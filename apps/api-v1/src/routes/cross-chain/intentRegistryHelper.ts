import crypto from 'crypto';
import { broadcastTransaction, makeContractCall, uintCV, PostConditionMode, contractPrincipalCV, bufferCV, standardPrincipalCV, Pc, principalCV, createAsset, FungibleConditionCode } from '@stacks/transactions';
import { STACKS_DEVNET, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { crossChainIntentCollection, crossChainMappingCollection } from '../../lib/data/db_models.js';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { getOrCreateMappedAddress } from './crossChainMappingHelpers.js';
import { stacks } from '@bigmarket/sdk';
import { CreatedStacksWallet, VaultUserChain } from '@bigmarket/bm-types';

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
};

const RELAYER_STX_FEE = Number(process.env.RELAYER_STX_FEE ?? '250000');

function getStacksNetwork() {
	if (getConfig().network === 'testnet') return STACKS_TESTNET;
	if (getConfig().network === 'devnet') return STACKS_DEVNET;
	return STACKS_MAINNET;
}

export async function registerBridgeIntent(params: { sourceChain: string; sourceAddress: string; amount?: string; tokenContractAddress?: string; tokenContractName?: string; destinationVaultAddress?: string }) {
	console.log('registerBridgeIntent: params = ', params);
	const mappedAddress = await getOrCreateMappedAddress(params.sourceChain, params.sourceAddress);

	const now = new Date();

	const intent: CrossChainIntent = {
		intentId: crypto.randomUUID(),
		sourceChain: params.sourceChain.toUpperCase(),
		sourceAddress: params.sourceAddress.toLowerCase(),
		destinationChain: 'STX',
		mappedAddress,
		destinationVaultAddress: params.destinationVaultAddress ?? getDaoConfig().VITE_DAO_VAULT,
		tokenContractAddress: params.tokenContractAddress ?? getDaoConfig().VITE_USDCX_CONTRACT_ADDRESS,
		tokenContractName: params.tokenContractName ?? getDaoConfig().VITE_USDCX_CONTRACT_ADDRESS,
		amount: params.amount,
		status: 'created',
		network: getConfig().network as 'mainnet' | 'testnet' | 'devnet',
		createdAt: now,
		updatedAt: now
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
		mappedAddress,
		mappedChain: 'STX',
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

async function getSip010Balance(params: { owner: string; contractAddress: string; contractName: string }): Promise<bigint> {
	const res = await fetch(`${getConfig().stacksApi}/v2/contracts/call-read/${params.contractAddress}/${params.contractName}/get-balance`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			sender: params.owner,
			arguments: [`0x${principalCV(params.owner)}`]
		})
	});

	if (!res.ok) {
		throw new Error(`Could not read SIP010 balance: ${await res.text()}`);
	}

	const json: any = await res.json();

	if (!json.okay) {
		throw new Error(`SIP010 balance read failed: ${JSON.stringify(json)}`);
	}

	return parseClarityUintHex(json.result);
}

function parseClarityUintHex(hexValue: string): bigint {
	const hex = hexValue.replace(/^0x/, '');

	// Clarity uint prefix is 01, followed by 16-byte uint.
	if (!hex.startsWith('01')) {
		throw new Error(`Expected Clarity uint, received ${hexValue}`);
	}

	return BigInt(`0x${hex.slice(2)}`);
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

	try {
		const balance = await getSip010Balance({
			owner: intent.mappedAddress,
			contractAddress: intent.tokenContractAddress,
			contractName: intent.tokenContractName
		});

		if (balance <= 0n) {
			throw new Error(`No token balance to sweep for ${intent.mappedAddress}`);
		}

		const nonce = await getAccountNonce(intent.mappedAddress);
		const privateKey = stacks.deriveStacksPrivateKey(getConfig().walletKey, intent.sourceAddress);

		// const tx = await makeContractCall({
		// 	contractAddress: intent.tokenContractAddress,
		// 	contractName: intent.tokenContractName,
		// 	functionName: 'transfer',
		// 	functionArgs: [uintCV(balance), principalCV(intent.mappedAddress), principalCV(intent.destinationVaultAddress), noneCV()],
		// 	senderKey: stacks.deriveStacksPrivateKey(getConfig().walletKey, privateKey),
		// 	network: getStacksNetwork(),
		// 	fee: RELAYER_STX_FEE,
		// 	nonce,
		// 	postConditionMode: PostConditionMode.Deny
		// });
		const tx = await makeContractCall({
			contractAddress: getDaoConfig().VITE_DAO_DEPLOYER, // your vault, not the token
			contractName: getDaoConfig().VITE_DAO_VAULT,
			functionName: 'deposit-for',
			functionArgs: [
				contractPrincipalCV(intent.tokenContractAddress, intent.tokenContractName),
				uintCV(balance),
				standardPrincipalCV(intent.mappedAddress), // the real user
				bufferCV(Buffer.from(intent.intentId.replace('0x', ''), 'hex')) // 32-byte intent id
			],
			senderKey: privateKey, // already derived, don't re-derive
			network: getStacksNetwork(),
			fee: RELAYER_STX_FEE,
			nonce,
			postConditionMode: PostConditionMode.Allow,
			postConditions: [
				//   makeContractFungiblePostCondition(         // be explicit — mapped address sends exactly `balance`
				// 	intent.mappedAddress,
				// 	FungibleConditionCode.Equal,
				// 	balance,
				// 	createAsset(intent.tokenContractAddress, intent.tokenContractName, 'usdc') // your asset name
				//   )
			]
		});
		const broadcast = await broadcastTransaction({
			transaction: tx,
			network: getStacksNetwork()
		});

		if ('error' in broadcast) {
			throw new Error(JSON.stringify(broadcast));
		}

		await crossChainIntentCollection.updateOne(
			{ intentId },
			{
				$set: {
					status: 'swept',
					sweepTxId: broadcast.txid,
					updatedAt: new Date()
				}
			}
		);

		return {
			intentId,
			status: 'swept',
			sweepTxId: broadcast.txid,
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

function normalizeVaultSourceChain(sourceChain: string): VaultUserChain {
	const s = sourceChain.toLowerCase();
	if (s === 'eth' || s === 'ethereum') return 'ethereum';
	if (s === 'sol' || s === 'solana') return 'solana';
	if (s === 'stx' || s === 'stacks') return 'stacks';
	throw new Error(`Unsupported source chain: ${sourceChain}`);
}

/**
 * Sweep USDCx from the mapped Stacks custody address into the vault via `deposit`,
 * crediting the cross-chain identity (source chain + address).
 */
export async function depositMappedBalanceToVault(sourceChain: string, sourceAddress: string) {
	const chain = normalizeVaultSourceChain(sourceChain);
	const mappedAddress = await getOrCreateMappedAddress(chain, sourceAddress);
	const dao = getDaoConfig();

	const balance = await getSip010Balance({
		owner: mappedAddress,
		contractAddress: dao.VITE_USDCX_CONTRACT_ADDRESS,
		contractName: dao.VITE_USDCX_CONTRACT_NAME
	});

	if (balance <= 0n) {
		throw new Error(`No USDCx balance on mapped address ${mappedAddress}`);
	}

	const nonce = await getAccountNonce(mappedAddress);
	const privateKey = stacks.deriveStacksPrivateKey(getConfig().walletKey, sourceAddress);

	const tokenContract = contractPrincipalCV(dao.VITE_USDCX_CONTRACT_ADDRESS, dao.VITE_USDCX_CONTRACT_NAME);
	const asset = createAsset(dao.VITE_USDCX_CONTRACT_ADDRESS, dao.VITE_USDCX_CONTRACT_NAME, 'usdcx');
	//const postCondition = makeStandardFungiblePostCondition(mappedAddress, FungibleConditionCode.LessEqual, balance, asset);

	const tx = await makeContractCall({
		contractAddress: dao.VITE_DAO_DEPLOYER,
		contractName: dao.VITE_DAO_VAULT,
		functionName: 'deposit',
		//functionArgs: [tokenContract, uintCV(balance), bufferCV(stacks.vaultChainIdBuffer(chain)), bufferCV(vaultUserAddress32(chain, sourceAddress))],
		functionArgs: [tokenContract, uintCV(balance), bufferCV(stacks.vaultChainIdBuffer(chain)), principalCV(sourceAddress)],
		senderKey: privateKey,
		network: getStacksNetwork(),
		fee: RELAYER_STX_FEE,
		nonce,
		postConditionMode: PostConditionMode.Deny,
		postConditions: []
	});

	const broadcast = await broadcastTransaction({
		transaction: tx,
		network: getStacksNetwork()
	});

	if ('error' in broadcast) {
		throw new Error(JSON.stringify(broadcast));
	}

	return {
		mappedAddress,
		amount: balance.toString(),
		txid: broadcast.txid
	};
}
