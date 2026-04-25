import type { Sip10Data, TokenPermissionEvent } from '@bigmarket/bm-types';
import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
import { get } from 'svelte/store';
import { allowedTokenStore } from '@bigmarket/bm-common';

const defToken: Sip10Data = {
	symbol: 'BIG',
	name: 'BitcoinDAO Governance Token',
	decimals: 6,
	balance: 0,
	tokenUri: '',
	totalSupply: 0
};

export function getGovernanceToken(tokens: Array<TokenPermissionEvent>): Sip10Data {
	const daoConfig = requireDaoConfig(get(daoConfigStore));
	const token = tokens.find(
		(t) => t.token === `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}`
	);
	return token?.sip10Data || defToken;
}
export function getSbtcTokenContract(tokens: Array<TokenPermissionEvent>): string {
	const token = tokens.find((t) => t.token.toLowerCase().indexOf('sbtc') > -1);
	return token?.token || '';
}
export function getMarketToken(tokenContract: string): Sip10Data {
	const tokens = get(allowedTokenStore);
	const token = tokens.find((t) => t.token === tokenContract);
	return token?.sip10Data || defToken;
}
