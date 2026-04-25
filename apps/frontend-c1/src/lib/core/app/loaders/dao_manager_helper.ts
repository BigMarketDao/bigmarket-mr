import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
import { stacks } from '@bigmarket/sdk';
import { lookupContract } from '$lib/core/app/loaders/governance/dao_api';

export async function getContractDeploymentTxId(
	contractAddress: string
): Promise<string | undefined> {
	const appConfig = requireAppConfig(get(appConfigStore));
	let txId: string | undefined;
	try {
		const path = `${appConfig.VITE_STACKS_API}`;
		const c = await lookupContract(path, `${contractAddress}`);
		if (c && c.tx_id) {
			txId = c.tx_id;
		}
	} catch {
		console.error('Error getting contract deployment tx id');
	}
	return txId;
}

export async function isDaoConstructed(contractAddress: string): Promise<boolean> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const constructed = stacks.isDaoConstructed(appConfig.VITE_STACKS_API, contractAddress);
	return constructed;
}

export async function isExecutiveTeamMember(
	coreExecuteContractId: string | undefined,
	stxAddress: string
): Promise<{ executiveTeamMember: boolean }> {
	const appConfig = requireAppConfig(get(appConfigStore));
	let path = `${appConfig.VITE_BIGMARKET_API}/dao/events/extensions/is-core-team-member/${stxAddress}`;
	if (coreExecuteContractId)
		path = `${appConfig.VITE_BIGMARKET_API}/dao/events/extensions/is-core-team-member/${coreExecuteContractId}/${stxAddress}`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}

export async function isExtension(extensionAddress: string): Promise<{ result: boolean }> {
	const appConfig = requireAppConfig(get(appConfigStore));
	if (!extensionAddress) return { result: false };
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/events/extensions/is-extension/${extensionAddress}`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
