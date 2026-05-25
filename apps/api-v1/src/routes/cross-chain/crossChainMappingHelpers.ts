/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { crossChainMappingCollection } from '../../lib/data/db_models.js';
import { stacks } from '@bigmarket/sdk';
import { getConfig } from '../../lib/config.js';

export async function getOrCreateMappedAddress(sourceChain: string, sourceAddress: string) {
	const existing = await crossChainMappingCollection.findOne({
		sourceChain,
		sourceAddress: { $regex: `^${sourceAddress.toUpperCase()}$`, $options: 'i' }
	});

	if (existing?.mappedAddress) {
		return existing.mappedAddress;
	}

	const account = await stacks.createStacksWallet(getConfig().walletKey, sourceChain, sourceAddress.toUpperCase(), getConfig().network as 'devnet' | 'mainnet' | 'testnet');

	await crossChainMappingCollection.insertOne(account);

	return account.mappedAddress;
}
