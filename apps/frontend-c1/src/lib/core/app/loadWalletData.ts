import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
import { get } from 'svelte/store';
import {
	getMappedAddress,
	getStxAddress,
	isLoggedIn,
	userReputationStore,
	userWalletStore,
	walletState
} from '@bigmarket/bm-common';
import type {
	AddressObject,
	UserReputation,
	ReputationByUserContractData,
	UserSettings
} from '@bigmarket/bm-types';
import { addresses, getWalletBalances } from '../app/loaders/walletLoaders';
import { getUserReputation } from '../server/loaders/reputationLoaders';
import { getTokenBalances } from '@bigmarket/bm-utilities';

export async function loadWalletData() {
	if (!isLoggedIn()) return;

	const obj: AddressObject = await addresses();
	const appConfig = requireAppConfig(get(appConfigStore));
	const stxAddr = getStxAddress();

	obj.tokenBalances = await getTokenBalances(appConfig.VITE_STACKS_API, stxAddr);
	obj.walletBalances = await getWalletBalances(
		appConfig.VITE_STACKS_API,
		appConfig.VITE_MEMPOOL_API,
		stxAddr,
		obj.cardinal,
		obj.ordinal
	);

	// For Stacks users the mapped relay address differs from their wallet address;
	// fetch its token balances separately so components can read from the store.
	// For EVM/Solana users getStxAddress() already returns the mapped address,
	// so tokenBalances and mappedTokenBalances are the same object.
	const mappedAddr = getMappedAddress().trim();
	if (mappedAddr && mappedAddr !== stxAddr) {
		obj.mappedTokenBalances = await getTokenBalances(appConfig.VITE_STACKS_API, mappedAddr);
	} else {
		obj.mappedTokenBalances = obj.tokenBalances;
	}

	userWalletStore.set(obj);

	const userReputationData: ReputationByUserContractData = await getUserReputation(
		appConfig.VITE_BIGMARKET_API,
		getStxAddress()
	);
	const uRep: UserReputation = {
		name: '',
		userSettings: {} as UserSettings,
		userReputationData
	};

	userReputationStore.set(uRep);
}
