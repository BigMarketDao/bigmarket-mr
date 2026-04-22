import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import { daoConfigStore, requireDaoClient } from '$lib/stores/config/daoConfigStore';
import { get } from 'svelte/store';
import {
	allowedTokenStore,
	getStxAddress,
	isLoggedIn,
	userReputationStore,
	userWalletStore,
	vaultBalanceStore
} from '@bigmarket/bm-common';
import type { AddressObject, UserReputationContractData } from '@bigmarket/bm-types';
import { addresses, getTokenBalances, getWalletBalances } from '../app/loaders/walletLoaders';
import { getUserReputation } from '../server/loaders/reputationLoaders';

async function loadVaultBalances(stacksApi: string): Promise<void> {
	const tokens = get(allowedTokenStore);
	if (!tokens.length) return;

	const daoConfig = get(daoConfigStore);
	if (!daoConfig) return;

	const stxAddress = getStxAddress();
	if (!stxAddress || stxAddress === '??' || stxAddress === '?') return;

	const client = requireDaoClient(daoConfig);

	const results = await Promise.all(
		tokens.map(async (t) => {
			try {
				const res = await client.getBalance(stacksApi, stxAddress, t.token);
				return [t.token, Number(res?.value ?? 0)] as const;
			} catch {
				return [t.token, 0] as const;
			}
		})
	);

	vaultBalanceStore.set(Object.fromEntries(results));
}

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

	await loadVaultBalances(appConfig.VITE_STACKS_API);
}
