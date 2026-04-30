import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
import { get } from 'svelte/store';
import {
	getStxAddress,
	isLoggedIn,
	userReputationStore,
	userWalletStore
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

	obj.tokenBalances = await getTokenBalances(appConfig.VITE_STACKS_API, getStxAddress());
	obj.walletBalances = await getWalletBalances(
		appConfig.VITE_STACKS_API,
		appConfig.VITE_MEMPOOL_API,
		getStxAddress(),
		obj.cardinal,
		obj.ordinal
	);
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
