import type { WithdrawFromVaultRequest } from '@bigmarket/sdk';
import { stacks } from '@bigmarket/sdk';
import { hexToBytes } from '@stacks/common';
import {
	broadcastTransaction,
	bufferCV,
	contractPrincipalCV,
	getAddressFromPrivateKey,
	makeContractCall,
	noneCV,
	PostConditionMode,
	principalCV,
	serializeTransaction,
	standardPrincipalCV,
	uintCV,
} from '@stacks/transactions';
import { STACKS_DEVNET, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';

function resolveNetwork(network: string) {
	if (network === 'testnet') return STACKS_TESTNET;
	if (network === 'devnet') return STACKS_DEVNET;
	return STACKS_MAINNET;
}

async function broadcast(tx: Awaited<ReturnType<typeof makeContractCall>>, label: string) {
	const txHex = Buffer.from(serializeTransaction(tx)).toString('hex');
	console.log(`[${label}] broadcasting, first 120 chars:`, txHex.slice(0, 120));

	const result = await broadcastTransaction({ transaction: tx, network: resolveNetwork(getConfig().network) });

	if ('error' in result) {
		throw new Error(
			`broadcast failed: ${(result as any).error}` +
				((result as any).reason ? ` — ${(result as any).reason}` : '')
		);
	}

	console.log(`[${label}] txid:`, result.txid);
	return result.txid;
}

/**
 * Server-side relayer for Stacks vault withdrawals (SIP-18 signed BMP1 path).
 *
 * Receives the user's signed BMP1 withdrawal message (produced by the
 * frontend after stx_signStructuredMessage) and broadcasts a Stacks
 * transaction to the vault's `withdraw` function using the server's
 * own private key (CONFIG.walletKey).
 *
 * The tx-sender (server key) is irrelevant to withdrawal authorisation —
 * the vault contract verifies the user's secp256k1 signature against the
 * BMP1 message. This allows the user to withdraw without needing STX
 * for gas or a second wallet popup.
 */
export async function withdrawFromVault(body: WithdrawFromVaultRequest): Promise<{ txid: string }> {
	const config = getConfig();
	const daoConfig = getDaoConfig();

	if (!config.walletKey) throw new Error('Server walletKey is not configured.');

	const network = resolveNetwork(config.network);
	const deployer = daoConfig.VITE_DAO_DEPLOYER;
	const vaultName = daoConfig.VITE_DAO_VAULT;
	const usdcxAddr = daoConfig.VITE_USDCX_CONTRACT_ADDRESS;
	const usdcxName = daoConfig.VITE_USDCX_CONTRACT_NAME;

	const tx = await makeContractCall({
		contractAddress: deployer,
		contractName: vaultName,
		functionName: 'withdraw',
		functionArgs: [
			bufferCV(hexToBytes(body.message)),
			bufferCV(hexToBytes(body.signature)),
			bufferCV(hexToBytes(body.pubkey)),
			contractPrincipalCV(usdcxAddr, usdcxName),
			principalCV(body.stxAddress),
			principalCV(body.recipientAddress),
		],
		senderKey: config.walletKey,
		network,
		postConditionMode: PostConditionMode.Allow,
		postConditions: [],
	});

	const txid = await broadcast(tx, 'withdraw-relayer');
	return { txid };
}

/**
 * Returns the relay address (server wallet's Stacks address) and its
 * current USDCx balance in micro-units.
 *
 * The relay address is the destination for EVM vault withdrawals: after
 * the vault releases USDCx to the relay, AllBridge is used to bridge
 * the funds on to Ethereum.  On devnet/testnet use `POST /sweep-relay`
 * to manually drain the relay for demo purposes.
 */
export async function getRelayInfo(): Promise<{ relayAddress: string; balanceMicro: string }> {
	const config = getConfig();
	const daoConfig = getDaoConfig();

	if (!config.walletKey) throw new Error('Server walletKey is not configured.');

	const relayAddress = getAddressFromPrivateKey(config.walletKey, config.network as any);

	const vault = stacks.createVaultClient(daoConfig);
	const balance = await vault.getUsdcxBalance(config.stacksApi, relayAddress);

	return { relayAddress, balanceMicro: balance.toString() };
}

/**
 * Manually transfer USDCx from the server relay address to a Stacks
 * recipient.
 *
 * Used for demos on devnet/testnet where AllBridge is unavailable.
 * On mainnet this endpoint is still useful as an emergency drain, but
 * the normal path uses AllBridge directly after an EVM vault withdrawal.
 *
 * If `amountMicro` is omitted the entire relay balance is swept.
 */
export async function sweepRelayAddress(body: {
	recipientAddress: string;
	amountMicro?: string;
}): Promise<{ txid: string; relayAddress: string; amount: string }> {
	const config = getConfig();
	const daoConfig = getDaoConfig();

	if (!config.walletKey) throw new Error('Server walletKey is not configured.');

	const relayAddress = getAddressFromPrivateKey(config.walletKey, config.network as any);

	const vault = stacks.createVaultClient(daoConfig);
	const balance = await vault.getUsdcxBalance(config.stacksApi, relayAddress);
	const amount = body.amountMicro ? BigInt(body.amountMicro) : balance;

	if (amount <= 0n) {
		throw new Error(`No USDCx balance to sweep at relay address ${relayAddress}`);
	}
	if (amount > balance) {
		throw new Error(`Requested ${amount} but relay only holds ${balance} micro-USDCx`);
	}

	const usdcxAddr = daoConfig.VITE_USDCX_CONTRACT_ADDRESS;
	const usdcxName = daoConfig.VITE_USDCX_CONTRACT_NAME;
	const network = resolveNetwork(config.network);

	const tx = await makeContractCall({
		contractAddress: usdcxAddr,
		contractName: usdcxName,
		functionName: 'transfer',
		functionArgs: [
			uintCV(amount),
			standardPrincipalCV(relayAddress),
			standardPrincipalCV(body.recipientAddress),
			noneCV(),
		],
		senderKey: config.walletKey,
		network,
		postConditionMode: PostConditionMode.Allow,
		postConditions: [],
	});

	const txid = await broadcast(tx, 'sweep-relay');
	console.log(`[sweep-relay] ${amount} USDCx sent from ${relayAddress} → ${body.recipientAddress}`);
	return { txid, relayAddress, amount: amount.toString() };
}
