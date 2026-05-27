/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { crossChainMappingCollection } from '../../lib/data/db_models.js';
import { stacks } from '@bigmarket/sdk';
import { getConfig } from '../../lib/config.js';

/** Aliases for each canonical chain so that records stored under any alias are found. */
const CHAIN_ALIASES: Record<string, string[]> = {
	evm:     ['evm', 'eth', 'ethereum'],
	stacks:  ['stacks', 'stx'],
	solana:  ['solana', 'sol'],
};

export async function getOrCreateMappedAddress(sourceChain: string, sourceAddress: string) {
	const normalized = stacks.normalizeVaultSourceChain(sourceChain);
	const aliases = CHAIN_ALIASES[normalized] ?? [normalized];

	const existing = await crossChainMappingCollection.findOne({
		sourceChain: { $in: aliases },
		sourceAddress: { $regex: `^${sourceAddress.toUpperCase()}$`, $options: 'i' }
	});

	if (existing?.mappedAddress) {
		return existing.mappedAddress;
	}

	// Create with the canonical chain name so future lookups are consistent
	const account = await stacks.createStacksWallet(
		getConfig().walletKey,
		normalized,
		sourceAddress.toUpperCase(),
		getConfig().network as 'devnet' | 'mainnet' | 'testnet'
	);

	await crossChainMappingCollection.insertOne(account);

	return account.mappedAddress;
}
