import crypto from 'crypto';
import { getAddressFromPrivateKey, principalCV } from '@stacks/transactions';
import { crossChainIntentCollection, crossChainMappingCollection } from '../../lib/data/db_models.js';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { getOrCreateMappedAddress } from './crossChainMappingHelpers.js';
import { stacks } from '@bigmarket/sdk';
import { CreatedStacksWallet, VaultUserChain } from '@bigmarket/bm-types';
import { RelayerDepositForParams } from '@bigmarket/sdk/dist/chains/stacks';

export type CrossChainIntentStatus = 'created' | 'submitted' | 'sweeping' | 'pending-confirm' | 'swept' | 'failed';

export type CrossChainIntent = {
	intentId: string;
	sourceChain: string;
	sourceAddress: string;
	destinationChain: 'STX';
	mappedAddress: string;
	destinationVaultAddress: string;
	tokenContractAddress: string;
	tokenContractName: string;
	amount?: string;
	sourceTxHash?: string;
	sweepTxId?: string;
	status: CrossChainIntentStatus;
	network: 'mainnet' | 'testnet' | 'devnet';
	createdAt: Date;
	updatedAt: Date;
	error?: string;
	sweepAttempt: number;
};

const RELAYER_STX_FEE = Number(process.env.RELAYER_STX_FEE ?? '250000');

export async function registerBridgeIntent(params: { sourceChain: string; sourceAddress: string; amount?: string; tokenContractAddress?: string; tokenContractName?: string; destinationVaultAddress?: string }) {
	console.log('registerBridgeIntent: params = ', params);
	const mappedAddress = await getOrCreateMappedAddress(params.sourceChain, params.sourceAddress.toUpperCase());

	const now = new Date();

	const intent: CrossChainIntent = {
		intentId: crypto.randomUUID(),
		sourceChain: params.sourceChain,
		sourceAddress: params.sourceAddress.toUpperCase(),
		destinationChain: 'STX',
		mappedAddress: mappedAddress.toUpperCase(),
		destinationVaultAddress: params.destinationVaultAddress ?? getDaoConfig().VITE_DAO_VAULT,
		tokenContractAddress: params.tokenContractAddress ?? getDaoConfig().VITE_USDCX_CONTRACT_ADDRESS,
		tokenContractName: params.tokenContractName ?? getDaoConfig().VITE_USDCX_CONTRACT_NAME,
		amount: params.amount,
		status: 'created',
		network: getConfig().network as 'mainnet' | 'testnet' | 'devnet',
		createdAt: now,
		updatedAt: now,
		sweepAttempt: 0
	};

	await crossChainIntentCollection.insertOne(intent);

	return {
		intentId: intent.intentId,
		mappedAddress: intent.mappedAddress,
		status: intent.status
	};
}

export async function markIntentSubmitted(intentId: string, sourceTxHash: string) {
	await crossChainIntentCollection.updateOne(
		{ intentId },
		{
			$set: {
				sourceTxHash,
				status: 'submitted',
				updatedAt: new Date()
			}
		}
	);

	return getBridgeIntent(intentId);
}

export async function getBridgeIntent(intentId: string) {
	return crossChainIntentCollection.findOne<CrossChainIntent>(
		{ intentId },
		{
			projection: {
				_id: 0
			}
		}
	);
}

async function getMappingByMappedAddress(mappedAddress: string) {
	return crossChainMappingCollection.findOne<CreatedStacksWallet>({
		mappedAddress: { $regex: `^${mappedAddress}$`, $options: 'i' },
		network: getConfig().network as 'mainnet' | 'testnet' | 'devnet'
	});
}

async function getAccountNonce(address: string): Promise<number> {
	const res = await fetch(`${getConfig().stacksApi}/extended/v1/address/${address}/nonces`);

	if (!res.ok) {
		throw new Error(`Could not fetch nonce for ${address}: ${await res.text()}`);
	}

	const json: any = await res.json();

	if (typeof json.possible_next_nonce === 'number') {
		return json.possible_next_nonce;
	}

	if (typeof json.last_executed_tx_nonce === 'number') {
		return json.last_executed_tx_nonce + 1;
	}

	return 0;
}

async function getSip010Balance(params: { sourceChain: VaultUserChain; address: string }): Promise<bigint> {
	const vault = stacks.createVaultClient(getDaoConfig());
	const vaultBalanceMicro = await vault.getUsdcxBalance(getConfig().stacksApi, params.address);
	return vaultBalanceMicro;
}

export async function sweepIntentToVault(intentId: string) {
	const intent = await crossChainIntentCollection.findOne<CrossChainIntent>({ intentId });

	if (!intent) throw new Error('Intent not found');

	// Already done — return early.
	if (intent.status === 'swept' || intent.status === 'pending-confirm') {
		return { intentId, status: intent.status, sweepTxId: intent.sweepTxId };
	}

	// Prevent concurrent sweeps: another process set 'sweeping' in the last 2 minutes.
	if (intent.status === 'sweeping') {
		const ageMs = Date.now() - new Date(intent.updatedAt).getTime();
		if (ageMs < 2 * 60 * 1000) {
			console.warn(`[cross-chain sweep] ${intentId} already sweeping (${ageMs}ms ago) — skipping`);
			return { intentId, status: intent.status, skipped: true, reason: 'already sweeping' };
		}
		console.warn(`[cross-chain sweep] ${intentId} stuck in sweeping for ${ageMs}ms — retrying`);
	}

	if (intent.status === 'failed') {
		throw new Error(`Intent ${intentId} is permanently failed — manual intervention required`);
	}

	const mapping = await getMappingByMappedAddress(intent.mappedAddress);
	if (!mapping) throw new Error(`No key mapping found for ${intent.mappedAddress}`);

	if (intent.sweepAttempt >= 3) {
		await crossChainIntentCollection.updateOne({ intentId }, { $set: { status: 'failed', updatedAt: new Date() } });
		throw new Error(`Intent ${intentId} exceeded max sweep attempts (${intent.sweepAttempt}) — marked failed`);
	}

	const balance = await getSip010Balance({
		sourceChain: stacks.normalizeVaultSourceChain(intent.sourceChain),
		address: intent.mappedAddress
	});
	console.log(`[cross-chain sweep] balance=${balance} for ${intent.mappedAddress}`);

	if (balance <= 0n) {
		return { intentId, status: intent.status, skipped: true, reason: `No token balance yet on ${intent.mappedAddress}` };
	}

	// Derive the private key that controls the mapped address.
	// walletKey is the HMAC secret; intent.sourceAddress (the user's EVM address) is the HMAC message.
	// The resulting private key controls the mapped Stacks address where the USDCx arrived.
	const privateKey = stacks.deriveStacksPrivateKey(getConfig().walletKey, intent.sourceAddress);
	const derivedAddress = getAddressFromPrivateKey(privateKey, getConfig().network as 'devnet' | 'mainnet' | 'testnet');

	// Log before writing 'sweeping' so the mismatch is visible in logs even if we abort.
	console.log(`[cross-chain sweep] intentId=${intentId} mappedAddress=${intent.mappedAddress} derivedAddress=${derivedAddress} match=${derivedAddress.toLowerCase() === intent.mappedAddress.toLowerCase()}`);

	// The SDK's depositForFromMappedAddress will throw on mismatch, but catch it here
	// to reset status to 'submitted' so the cron can retry when the key is corrected.

	await crossChainIntentCollection.updateOne(
		{ intentId },
		{ $set: { status: 'sweeping', updatedAt: new Date() } }
	);

	try {
		const nonce = await getAccountNonce(intent.mappedAddress);
		console.log(`[cross-chain sweep] nonce=${nonce} for ${intent.mappedAddress}`);

		const relayer = stacks.createVaultRelayerClient(getDaoConfig());
		const { txid } = await relayer.depositForFromMappedAddress(
			{
				privateKey,
				senderAddress: intent.mappedAddress,
				amount: balance,
				fee: RELAYER_STX_FEE,
				nonce,
				sourceChain: intent.sourceChain,
				sourceAddress: intent.sourceAddress,
				intentId: intent.intentId
			},
			getConfig().walletKey,
			getConfig().network
		);

		// Broadcast succeeded — mark pending-confirm; the scheduler polls the txid
		// and promotes to 'swept' only once the Clarity call succeeds on-chain.
		await crossChainIntentCollection.updateOne(
			{ intentId },
			{
				$set: {
					status: 'pending-confirm',
					sweepTxId: txid,
					updatedAt: new Date(),
					sweepAttempt: intent.sweepAttempt + 1
				}
			}
		);

		console.log(`[cross-chain sweep] broadcast OK txid=${txid} — awaiting on-chain confirmation`);
		return { intentId, status: 'pending-confirm', sweepTxId: txid, amount: balance.toString() };
	} catch (err: any) {
		await crossChainIntentCollection.updateOne(
			{ intentId },
			{
				$set: {
					status: 'submitted',
					error: err.message ?? String(err),
					updatedAt: new Date(),
					sweepAttempt: intent.sweepAttempt + 1
				}
			}
		);
		throw err;
	}
}

/**
 * Poll the Stacks API for the on-chain result of a pending-confirm sweep tx.
 * Transitions the intent to 'swept' on success or back to 'submitted' on
 * on-chain failure so the sweep job can retry with the correct key.
 */
export async function confirmSweepTx(intentId: string): Promise<{ intentId: string; status: CrossChainIntentStatus; sweepTxId?: string }> {
	const intent = await crossChainIntentCollection.findOne<CrossChainIntent>({ intentId });
	if (!intent) throw new Error('Intent not found');

	if (intent.status !== 'pending-confirm') {
		return { intentId, status: intent.status, sweepTxId: intent.sweepTxId };
	}

	const txid = intent.sweepTxId;
	if (!txid) {
		await crossChainIntentCollection.updateOne({ intentId }, { $set: { status: 'submitted', error: 'missing sweepTxId in pending-confirm', updatedAt: new Date() } });
		return { intentId, status: 'submitted' };
	}

	const res = await fetch(`${getConfig().stacksApi}/extended/v1/tx/${txid}`);
	if (!res.ok) {
		console.warn(`[cross-chain confirm] could not fetch tx ${txid}: ${res.status}`);
		return { intentId, status: intent.status, sweepTxId: txid };
	}

	const data: any = await res.json();
	const txStatus: string = data.tx_status ?? 'pending';

	if (txStatus === 'success') {
		await crossChainIntentCollection.updateOne({ intentId }, { $set: { status: 'swept', updatedAt: new Date() } });
		console.log(`[cross-chain confirm] intent ${intentId} confirmed swept txid=${txid}`);
		return { intentId, status: 'swept', sweepTxId: txid };
	}

	const failedStatuses = ['abort_by_response', 'abort_by_post_condition', 'dropped_replace_by_fee', 'dropped_too_expensive', 'dropped_stale_garbage_collect'];
	if (failedStatuses.includes(txStatus)) {
		const reason = data.tx_result?.repr ?? txStatus;
		console.error(`[cross-chain confirm] intent ${intentId} sweep tx FAILED on-chain: ${reason} — resetting to submitted`);
		await crossChainIntentCollection.updateOne(
			{ intentId },
			{ $set: { status: 'submitted', error: `on-chain failure: ${reason}`, updatedAt: new Date() } }
		);
		return { intentId, status: 'submitted', sweepTxId: txid };
	}

	console.log(`[cross-chain confirm] intent ${intentId} tx ${txid} still ${txStatus}`);
	return { intentId, status: intent.status, sweepTxId: txid };
}

/**
 * Sweep USDCx from the mapped Stacks custody address into the vault via `deposit-for`,
 * crediting the cross-chain identity (source chain + address).
 * walletKey is HMAC secret for deriving the mapped private key AND the sponsor key.
 */
export async function depositMappedBalanceToVault(sourceChain: string, sourceAddress: string) {
	const chain = stacks.normalizeVaultSourceChain(sourceChain);
	const mappedAddress = await getOrCreateMappedAddress(chain, sourceAddress.toUpperCase());
	const dao = getDaoConfig();

	const balance = await getSip010Balance({ sourceChain: chain, address: mappedAddress });
	if (balance <= 0n) throw new Error(`No USDCx balance on mapped address ${mappedAddress}`);

	const nonce = await getAccountNonce(mappedAddress);
	const privateKey = stacks.deriveStacksPrivateKey(getConfig().walletKey, sourceAddress);
	const derivedAddress = getAddressFromPrivateKey(privateKey, getConfig().network as 'devnet' | 'mainnet' | 'testnet');

	console.log(`[deposit-to-vault] sourceAddress=${sourceAddress} mappedAddress=${mappedAddress} derivedAddress=${derivedAddress} network=${getConfig().network}`);

	const relayer = stacks.createVaultRelayerClient(dao);
	const { txid } = await relayer.depositForFromMappedAddress(
		{
			privateKey,
			senderAddress: mappedAddress,
			amount: balance,
			fee: RELAYER_STX_FEE,
			nonce,
			sourceChain,
			sourceAddress,
			intentId: crypto.randomUUID()
		},
		getConfig().walletKey,
		getConfig().network
	);

	return { mappedAddress, amount: balance.toString(), txid };
}
