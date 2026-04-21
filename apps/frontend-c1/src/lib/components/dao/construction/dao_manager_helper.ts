import { fetchDataVar, lookupContract } from '@bigmarket/bm-helpers';
import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import {
	cvToJSON,
	deserializeCV,
	type ClarityValue,
	type StringUtf8CV
} from '@stacks/transactions';

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
	} catch (err: any) {}
	return txId;
}

export async function isDaoConstructed(contractAddress: string): Promise<boolean> {
	const appConfig = requireAppConfig(get(appConfigStore));
	let constructed = false;
	try {
		let result = await fetchDataVar(
			appConfig.VITE_STACKS_API,
			contractAddress.split('.')[0],
			contractAddress.split('.')[1],
			'executive'
		);
		if (result && result.data) {
			const clarityValue = deserializeCV(result.data);
			// executive is only given a value by the construct call
			if (clarityValue && clarityValue.type === 'contract') constructed = true;
		}
	} catch (err: any) {}
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
