/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { crossChainMappingCollection } from '../../lib/data/db_models.js';
import { stacks } from '@bigmarket/sdk';
import { getConfig } from '../../lib/config.js';

/**
 * Replace this with your preferred wallet generation method.
 *
 * Important:
 * - encrypt privateKey before storing in production
 * - ensure mappedAddress is derived from privateKey
 */
async function createStacksWalletForMapping(params: { sourceChain: string; sourceAddress: string }): Promise<{ mappedAddress: string; privateKey: string }> {
	throw new Error('Implement secure Stacks key generation here');
}
export async function getOrCreateMappedAddress(sourceChain: string, sourceAddress: string) {
	const existing = await crossChainMappingCollection.findOne({
		sourceChain,
		sourceAddress
	});

	if (existing?.mappedAddress) {
		return existing.mappedAddress;
	}

	const account = await stacks.createStacksWallet(sourceChain, sourceAddress, getConfig().network as 'devnet' | 'mainnet' | 'testnet');

	await crossChainMappingCollection.insertOne(account);

	return account.mappedAddress;
}

// export async function getOrCreateMappedAddress(sourceChain: string, sourceAddress: string): Promise<string> {
// 	const normalisedSourceChain = sourceChain.toUpperCase();
// 	const normalisedSourceAddress = sourceAddress.toLowerCase();

// 	const existing = await crossChainMappingCollection.findOne<CreatedStacksWallet>({
// 		sourceChain: normalisedSourceChain,
// 		sourceAddress: normalisedSourceAddress,
// 		mappedChain: 'STX',
// 		network: getStacksNetwork()
// 	});

// 	if (existing) return existing.mappedAddress;

// 	const wallet = await createStacksWalletForMapping({
// 		sourceChain: normalisedSourceChain,
// 		sourceAddress: normalisedSourceAddress
// 	});

// 	const created: CreatedStacksWallet = {
// 		sourceChain: normalisedSourceChain,
// 		sourceAddress: normalisedSourceAddress,
// 		mappedChain: 'STX',
// 		mappedAddress: wallet.mappedAddress,
// 		privateKey: wallet.privateKey,
// 		network: getConfig().network as 'mainnet' | 'testnet' | 'devnet',
// 		createdAt: new Date()
// 	};

// 	await crossChainMappingCollection.insertOne(created);

// 	return created.mappedAddress;
// }
