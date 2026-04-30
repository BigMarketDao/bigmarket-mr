import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';

import type {
	ReputationContractData,
	ReputationLeaderboardItem,
	ReputationByUserContractData
} from '@bigmarket/bm-types';
import { get } from 'svelte/store';

export async function runBatchClaims(): Promise<string | number> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/reputation/batch-claims`;
	const response = await fetch(path);
	const result = await response.text();
	return result || 0;
}

export async function getTierBalance(tier: number, address: string): Promise<number> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/reputation/${tier}/${address}`;
	const response = await fetch(path);
	const result = (await response.json()) || 0;
	return result || 0;
}

export async function getReputationContractData(): Promise<ReputationContractData> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/reputation/meta-data`;
	const response = await fetch(path);
	const res = (await response.json()) || 0;
	return res;
}

export async function getUserReputation(address: string): Promise<ReputationByUserContractData> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/reputation/${address}`;
	const response = await fetch(path);
	const res = (await response.json()) || 0;
	return res;
}

export async function getReputationLeaderBoard(): Promise<Array<ReputationLeaderboardItem>> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/reputation/leader-board`;
	const response = await fetch(path);
	const res = (await response.json()) || [];
	return res;
}
