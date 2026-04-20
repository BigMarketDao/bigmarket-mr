import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import { get } from 'svelte/store';
import {
	getStxAddress,
	isLoggedIn,
	userReputationStore,
	userWalletStore
} from '@bigmarket/bm-common';
import type { AddressObject, UserReputationContractData } from '@bigmarket/bm-types';
import { addresses, getTokenBalances, getWalletBalances } from '../app/loaders/walletLoaders';
import { getUserReputation } from '../server/loaders/reputationLoaders';

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

	const userReputationData: UserReputationContractData = await getUserReputation(
		appConfig.VITE_BIGMARKET_API,
		getStxAddress()
	);
	userReputationStore.set(userReputationData);
}
