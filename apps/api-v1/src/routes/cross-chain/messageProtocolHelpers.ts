import type { VaultMarketOpRequest, WithdrawFromVaultRequest } from '@bigmarket/sdk';
import { eip712HashDisplayString, stacks } from '@bigmarket/sdk';
import { hexToBytes } from '@stacks/common';
import {
	broadcastTransaction,
	bufferCV,
	contractPrincipalCV,
	getAddressFromPrivateKey,
	makeContractCall,
	makeSTXTokenTransfer,
	noneCV,
	PostConditionMode,
	principalCV,
	serializeTransaction,
	sponsorTransaction,
	standardPrincipalCV,
	uintCV
} from '@stacks/transactions';
import { STACKS_DEVNET, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { readDaoEventsInternal } from '../dao/events/dao_events_helper.js';
import { readDaoExtensionEvents } from '../dao/events/dao_events_extension_helper.js';

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
		throw new Error(`broadcast failed: ${(result as any).error}` + ((result as any).reason ? ` — ${(result as any).reason}` : ''));
	}

	console.log(`[${label}] txid:`, result.txid);
	return result.txid;
}

/** Precomputed keccak256(utf8) hashes for EIP-712 string fields (vault verify-evm). */
function eip712DisplayHashCvs(token: string, mapped: string, recipient = '') {
	return [bufferCV(eip712HashDisplayString(token)), bufferCV(eip712HashDisplayString(mapped)), bufferCV(eip712HashDisplayString(recipient))];
}

/**
 * Server-side relayer for Stacks vault withdrawals (SIP-18 / EIP-712 BMP1 path).
 *
 * Receives the user's signed BMP1 withdrawal message and broadcasts the
 * vault `withdraw` call.  The vault contract verifies the user's secp256k1
 * signature — the tx-sender is only a fee-payer.
 *
 * For EVM withdrawals `body.controllerAddress` (the ETH 0x… address) is used
 * to derive the mapped Stacks private key via deriveStacksPrivateKey so the
 * mapped address signs (and pays fees for) its own withdrawal transaction.
 * For Stacks-native withdrawals the field is absent and the server's global
 * walletKey is used as the relay fee-payer.
 */
export async function withdrawFromVault(body: WithdrawFromVaultRequest): Promise<{ txid: string }> {
	const config = getConfig();
	const daoConfig = getDaoConfig();

	if (!config.walletKey) throw new Error('Server walletKey is not configured.');

	const evmController = typeof body.controllerAddress === 'string' && /^0x[0-9a-fA-F]{40}$/.test(body.controllerAddress) ? body.controllerAddress : undefined;
	const { privateKey: senderKey } = resolveMappedKey(config, evmController);

	const network = resolveNetwork(config.network);
	const deployer = daoConfig.VITE_DAO_DEPLOYER;
	const vaultName = daoConfig.VITE_DAO_VAULT;
	const usdcxAddr = daoConfig.VITE_USDCX_CONTRACT_ADDRESS;
	const usdcxName = daoConfig.VITE_USDCX_CONTRACT_NAME;

	const devnet = getConfig().network === 'devnet';
	const tokenDisplay = `${usdcxAddr}.${usdcxName}`;

	let tx = await makeContractCall({
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
			...eip712DisplayHashCvs(tokenDisplay, body.stxAddress, body.recipientAddress)
		],
		senderKey,
		network,
		postConditionMode: PostConditionMode.Allow,
		postConditions: [],
		sponsored: !devnet // important
	});
	if (!devnet) {
		tx = await sponsorTransaction({
			transaction: tx,
			sponsorPrivateKey: config.walletKey,
			fee: 1000n
		});
	}

	const txid = await broadcast(tx, 'withdraw-relayer');
	//readDaoEventsInternal(`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`);
	return { txid };
}

const VAULT_MARKET_FUNCTIONS = {
	'buy-shares': 'buy-shares',
	'sell-shares': 'sell-shares',
	'claim-winnings': 'claim-winnings'
} as const;

/**
 * Relay a signed BMP1 vault market operation (buy / sell / claim) in one tx.
 */
export async function executeVaultMarketOp(body: VaultMarketOpRequest): Promise<{ txid: string }> {
	const config = getConfig();
	const daoConfig = getDaoConfig();

	if (!config.walletKey) throw new Error('Server walletKey is not configured.');

	const fn = VAULT_MARKET_FUNCTIONS[body.operation];
	if (!fn) throw new Error(`Unknown vault market operation: ${body.operation}`);

	const { privateKey: senderKey } = resolveMappedKey(config, body.controllerAddress);

	const network = resolveNetwork(config.network);
	const deployer = daoConfig.VITE_DAO_DEPLOYER;
	const vaultName = daoConfig.VITE_DAO_VAULT;
	const [tokenAddr, tokenName] = body.tokenContract.split('.');
	const [marketAddr, marketName] = body.marketExtension.split('.');

	if (!tokenAddr || !tokenName || !marketAddr || !marketName) {
		throw new Error('Invalid tokenContract or marketExtension principal');
	}
	const devnet = getConfig().network === 'devnet';
	let tx = await makeContractCall({
		contractAddress: deployer,
		contractName: vaultName,
		functionName: fn,
		functionArgs: [
			bufferCV(hexToBytes(body.message)),
			bufferCV(hexToBytes(body.signature)),
			bufferCV(hexToBytes(body.pubkey)),
			contractPrincipalCV(tokenAddr, tokenName),
			principalCV(body.mappedAddress),
			contractPrincipalCV(marketAddr, marketName),
			...eip712DisplayHashCvs(body.tokenContract, body.mappedAddress)
		],
		senderKey,
		network,
		postConditionMode: PostConditionMode.Allow,
		postConditions: [],
		sponsored: !devnet
	});

	if (!devnet) {
		tx = await sponsorTransaction({
			transaction: tx,
			sponsorPrivateKey: config.walletKey,
			fee: 1000n
		});
	}

	const txid = await broadcast(tx, `vault-market-${body.operation}`);
	//readDaoEventsInternal(`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`);
	return { txid };
}

/**
 * Resolve the Stacks address and its private key for a given controller.
 *
 * When `controllerAddress` is supplied (an EVM or other cross-chain address)
 * the mapped Stacks address is derived deterministically from the server
 * walletKey + controllerAddress — exactly the same derivation used by
 * createStacksWallet / depositMappedBalanceToVault.
 *
 * When `controllerAddress` is omitted the server's own wallet address is
 * returned (backward-compatible path).
 */
/** AllBridge bridge txs are not sponsored — the relay pays STX fees from its own balance. */
const RELAY_BRIDGE_MIN_STX_MICRO = 1_000_000n;
const RELAY_BRIDGE_TARGET_STX_MICRO = 2_000_000n;

async function getStxBalanceMicro(stacksApi: string, address: string): Promise<bigint> {
	const res = await fetch(`${stacksApi}/extended/v1/address/${address}/balances`);
	if (!res.ok) throw new Error(`Failed to fetch STX balance for ${address}`);
	const data = (await res.json()) as { stx?: { balance?: string } };
	return BigInt(data.stx?.balance ?? '0');
}

/** Top up the mapped relay with STX from the server wallet when USDCx arrived without gas. */
async function ensureRelayStxForBridge(relayAddress: string, walletKey: string, network: ReturnType<typeof resolveNetwork>) {
	const config = getConfig();
	const balance = await getStxBalanceMicro(config.stacksApi, relayAddress);
	if (balance >= RELAY_BRIDGE_MIN_STX_MICRO) return;

	const topUp = RELAY_BRIDGE_TARGET_STX_MICRO - balance;
	if (topUp <= 0n) return;

	console.log(`[bridge-relay] topping up ${relayAddress} with ${topUp} micro-STX (had ${balance})`);
	const tx = await makeSTXTokenTransfer({
		recipient: relayAddress,
		amount: topUp,
		senderKey: walletKey,
		network
	});
	const result = await broadcastTransaction({ transaction: tx, network });
	if ('error' in result) {
		throw new Error(`Failed to fund relay ${relayAddress} with STX for bridge fees: ${(result as { error: string }).error}` + ((result as { reason?: string }).reason ? ` — ${(result as { reason?: string }).reason}` : ''));
	}
	console.log(`[bridge-relay] STX top-up txid ${result.txid}`);
}

function resolveMappedKey(
	config: ReturnType<typeof getConfig>,
	controllerAddress?: string
): {
	address: string;
	privateKey: string;
} {
	if (controllerAddress) {
		const privateKey = stacks.deriveStacksPrivateKey(config.walletKey, controllerAddress);
		const address = getAddressFromPrivateKey(privateKey, config.network as any);
		return { address, privateKey };
	}
	return { address: getAddressFromPrivateKey(config.walletKey, config.network as any), privateKey: config.walletKey };
}

/**
 * Returns the mapped Stacks address for a given EVM controller and its
 * current USDCx balance in micro-units.
 *
 * Pass `controllerAddress` (the ETH 0x… address) to get the derived mapped
 * address that received the vault withdrawal.  Omit it to fall back to the
 * server's own relay wallet (used for deposit-side sweep flows).
 */
export async function getRelayInfo(controllerAddress?: string): Promise<{
	relayAddress: string;
	balanceMicro: string;
	stxBalanceMicro: string;
}> {
	const config = getConfig();
	const daoConfig = getDaoConfig();

	if (!config.walletKey) throw new Error('Server walletKey is not configured.');

	const { address: relayAddress } = resolveMappedKey(config, controllerAddress);

	const vault = stacks.createVaultClient(daoConfig);
	const [balance, stxBalance] = await Promise.all([vault.getUsdcxBalance(config.stacksApi, relayAddress), getStxBalanceMicro(config.stacksApi, relayAddress)]);

	return { relayAddress, balanceMicro: balance.toString(), stxBalanceMicro: stxBalance.toString() };
}

/**
 * Manually transfer USDCx from the controller's mapped Stacks address to
 * any Stacks recipient.
 *
 * `controllerAddress` must be the EVM (0x…) address whose mapped Stacks
 * address holds the funds — the server derives the corresponding private key
 * via deriveStacksPrivateKey(walletKey, controllerAddress).
 *
 * If `amountMicro` is omitted the entire balance is swept.
 */
export async function sweepRelayAddress(body: { controllerAddress: string; recipientAddress: string; amountMicro?: string }): Promise<{ txid: string; relayAddress: string; amount: string }> {
	const config = getConfig();
	const daoConfig = getDaoConfig();

	if (!config.walletKey) throw new Error('Server walletKey is not configured.');
	if (!body.controllerAddress) throw new Error('controllerAddress is required');

	const { address: relayAddress, privateKey } = resolveMappedKey(config, body.controllerAddress);

	const vault = stacks.createVaultClient(daoConfig);
	const balance = await vault.getUsdcxBalance(config.stacksApi, relayAddress);
	const amount = body.amountMicro ? BigInt(body.amountMicro) : balance;

	if (amount <= 0n) {
		throw new Error(`No USDCx balance to sweep at mapped address ${relayAddress}`);
	}
	if (amount > balance) {
		throw new Error(`Requested ${amount} but ${relayAddress} only holds ${balance} micro-USDCx`);
	}

	const usdcxAddr = daoConfig.VITE_USDCX_CONTRACT_ADDRESS;
	const usdcxName = daoConfig.VITE_USDCX_CONTRACT_NAME;
	const network = resolveNetwork(config.network);

	const devnet = getConfig().network === 'devnet';
	let tx = await makeContractCall({
		contractAddress: usdcxAddr,
		contractName: usdcxName,
		functionName: 'transfer',
		functionArgs: [uintCV(amount), standardPrincipalCV(relayAddress), standardPrincipalCV(body.recipientAddress), noneCV()],
		senderKey: privateKey, // mapped address's own key, not server key
		network,
		postConditionMode: PostConditionMode.Allow,
		postConditions: [],
		sponsored: !devnet // important
	});
	if (!devnet) {
		tx = await sponsorTransaction({
			transaction: tx,
			sponsorPrivateKey: config.walletKey,
			fee: 1000n
		});
	}
	const txid = await broadcast(tx, 'sweep-relay');
	//await readDaoExtensionEvents(false,`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`);
	console.log(`[sweep-relay] ${amount} USDCx from ${relayAddress} → ${body.recipientAddress}`);
	return { txid, relayAddress, amount: amount.toString() };
}

function microUsdcToAllbridgeAmount(micro: bigint): string {
	const whole = micro / 1_000_000n;
	const frac = micro % 1_000_000n;
	if (frac === 0n) return whole.toString();
	return `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}

/**
 * Bridge USDCx from the controller's mapped Stacks relay address to Ethereum USDC via AllBridge.
 * Mainnet only — the mapped private key is derived from walletKey + EVM controller address.
 */
export async function bridgeRelayToEthereum(body: { controllerAddress: string; toAccountAddress?: string; amountMicro?: string }): Promise<{ txid: string; relayAddress: string; amount: string }> {
	const config = getConfig();

	if (config.network !== 'mainnet') {
		throw new Error('AllBridge Stacks → Ethereum is only available on mainnet.');
	}
	if (!config.walletKey) throw new Error('Server walletKey is not configured.');
	if (!body.controllerAddress) throw new Error('controllerAddress is required');

	const ethRecipient = (body.toAccountAddress ?? body.controllerAddress).trim();
	if (!/^0x[0-9a-fA-F]{40}$/.test(ethRecipient)) {
		throw new Error('toAccountAddress must be a valid Ethereum address (0x…).');
	}

	const { address: relayAddress, privateKey } = resolveMappedKey(config, body.controllerAddress);
	const daoConfig = getDaoConfig();
	const vault = stacks.createVaultClient(daoConfig);
	const balanceMicro = await vault.getUsdcxBalance(config.stacksApi, relayAddress);

	if (balanceMicro <= 0n) {
		throw new Error(`No USDCx balance to bridge at mapped address ${relayAddress}`);
	}

	const amountMicro = body.amountMicro ? BigInt(body.amountMicro) : balanceMicro;
	if (amountMicro <= 0n) throw new Error('amountMicro must be > 0');
	if (amountMicro > balanceMicro) {
		throw new Error(`Requested ${amountMicro} micro-USDCx but ${relayAddress} only holds ${balanceMicro}`);
	}

	const { sendAllbridgeWithdrawRelayer, ChainSymbol } = await import('@bigmarket/sdk/ethereum');

	const { txHash } = await sendAllbridgeWithdrawRelayer({
		amount: microUsdcToAllbridgeAmount(amountMicro),
		fromAccountAddress: relayAddress,
		toAccountAddress: ethRecipient,
		sourceChain: ChainSymbol.STX,
		destinationChain: ChainSymbol.ETH,
		tokenSymbol: 'USDCx',
		tokenSymbolDestination: 'USDC',
		stxIsTestnet: false,
		privateKey,
		network: 'mainnet'
	});

	console.log(`[bridge-relay] ${amountMicro} micro-USDCx from ${relayAddress} → ${ethRecipient}, txid ${txHash}`);
	return { txid: txHash, relayAddress, amount: amountMicro.toString() };
}
