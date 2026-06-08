import crypto from 'crypto';
import { principalCV } from '@stacks/transactions';
import { crossChainIntentCollection, crossChainMappingCollection } from '../../lib/data/db_models.js';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { getOrCreateMappedAddress } from './crossChainMappingHelpers.js';
import { stacks } from '@bigmarket/sdk';
import { CreatedStacksWallet, VaultUserChain } from '@bigmarket/bm-types';
import { RelayerDepositForParams } from '@bigmarket/sdk/dist/chains/stacks';

export type CrossChainIntentStatus = 'created' | 'submitted' | 'sweeping' | 'swept' | 'failed';

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
	const intent = await crossChainIntentCollection.findOne<CrossChainIntent>({
		intentId
	});

	if (!intent) {
		throw new Error('Intent not found');
	}

	if (intent.status === 'swept') {
		return {
			intentId,
			status: intent.status,
			sweepTxId: intent.sweepTxId
		};
	}

	const mapping = await getMappingByMappedAddress(intent.mappedAddress);
	console.log(`[cross-chain sweep] sweeping mapping: ` + mapping, intent);

	if (!mapping) {
		throw new Error(`No private key mapping found for ${intent.mappedAddress}`);
	}

	await crossChainIntentCollection.updateOne(
		{ intentId },
		{
			$set: {
				status: 'sweeping',
				updatedAt: new Date()
			}
		}
	);
	if (intent.sweepAttempt > 3) {
		throw new Error(`Sweep attempt ${intent.sweepAttempt} - too many sweeps`);
	}

	try {
		console.log('balance fetching ' + intent.mappedAddress);
		const balance = await getSip010Balance({
			sourceChain: stacks.normalizeVaultSourceChain(intent.sourceChain),
			address: intent.mappedAddress
		});
		console.log('balance = ' + balance + ' for ' + intent.mappedAddress);

		if (balance <= 0n) {
			throw new Error(`No token balance to sweep for ${intent.mappedAddress}`);
		}

		const nonce = await getAccountNonce(intent.mappedAddress);
		console.log('nonce = ' + nonce + ' for ' + intent.mappedAddress);
		const privateKey = stacks.deriveStacksPrivateKey(getConfig().walletKey, intent.sourceAddress);

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

		await crossChainIntentCollection.updateOne(
			{ intentId },
			{
				$set: {
					status: 'swept',
					sweepTxId: txid,
					updatedAt: new Date(),
					sweepAttempt: intent.sweepAttempt + 1
				}
			}
		);

		return {
			intentId,
			status: 'swept',
			sweepTxId: txid,
			amount: balance.toString()
		};
	} catch (err: any) {
		await crossChainIntentCollection.updateOne(
			{ intentId },
			{
				$set: {
					status: 'failed',
					error: err.message ?? String(err),
					updatedAt: new Date()
				}
			}
		);

		throw err;
	}
}

/**
 * Sweep USDCx from the mapped Stacks custody address into the vault via `deposit`,
 * crediting the cross-chain identity (source chain + address).
 */
export async function depositMappedBalanceToVault(sourceChain: string, sourceAddress: string) {
	const chain = stacks.normalizeVaultSourceChain(sourceChain);
	const mappedAddress = await getOrCreateMappedAddress(chain, sourceAddress.toUpperCase());
	const dao = getDaoConfig();

	const balance = await getSip010Balance({
		sourceChain: chain,
		address: mappedAddress
	});

	if (balance <= 0n) {
		throw new Error(`No USDCx balance on mapped address ${mappedAddress}`);
	}

	const nonce = await getAccountNonce(mappedAddress);
	const privateKey = stacks.deriveStacksPrivateKey(getConfig().walletKey, sourceAddress);

	const relayer = stacks.createVaultRelayerClient(dao);
	const params: RelayerDepositForParams = {
		privateKey,
		senderAddress: mappedAddress,
		amount: balance,
		fee: RELAYER_STX_FEE,
		nonce,
		sourceChain: sourceChain,
		sourceAddress: sourceAddress,
		intentId: crypto.randomUUID()
	};
	const { txid } = await relayer.depositForFromMappedAddress(params, getConfig().walletKey, getConfig().network);

	return {
		mappedAddress,
		amount: balance.toString(),
		txid
	};
}
