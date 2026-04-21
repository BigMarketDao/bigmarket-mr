import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';

import type {
	LeaderBoard,
	ReputationContractData,
	UserReputationContractData
} from '@bigmarket/bm-types';
import { get } from 'svelte/store';

export const CLAIMING_TIER = 1;
export const LIQUIDITY_TIER = 4;
export const STAKING_TIER = -1; // removed due to sybil
export const CREATE_MARKET_TIER = 2;
export const MARKET_VOTE_TIER = -1; // removed due to sybil
export const RECLAIM_VOTES_TIER = 12;

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

export async function getUserReputation(address: string): Promise<UserReputationContractData> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/reputation/${address}`;
	const response = await fetch(path);
	const res = (await response.json()) || 0;
	return res;
}

export async function getReputationLeaderBoard(): Promise<Array<LeaderBoard>> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/reputation/leader-board`;
	const response = await fetch(path);
	const res = (await response.json()) || [];
	return res;
}
