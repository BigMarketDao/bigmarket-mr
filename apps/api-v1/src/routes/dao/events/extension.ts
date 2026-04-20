import { hex } from '@scure/base';
import { contractPrincipalCV, principalCV, serializeCV } from '@stacks/transactions';
import { callContractReadOnly, GovernanceData } from '@mijoco/stx_helpers/dist/index.js';
import { getConfig } from '../../../lib/config.js';

export async function isExtension(daoContractAddress: string, daoContractName: string, extensionCid: string): Promise<{ result: boolean }> {
	const functionArgs = [`0x${serializeCV(contractPrincipalCV(extensionCid.split('.')[0], extensionCid.split('.')[1]))}`];
	const data = {
		contractAddress: daoContractAddress,
		contractName: daoContractName,
		functionName: 'is-extension',
		functionArgs
	};
	let res: { value: boolean; type: string };
	try {
		res = await callContractReadOnly(getConfig().stacksApi, data, getConfig().stacksHiroKey);
		return { result: res.value };
	} catch (e) {
		return { result: false };
	}
}

export async function isExecutiveTeamMember(emergencyExecuteContractId: string, stxAddress: string): Promise<{ executiveTeamMember: boolean }> {
	if (!stxAddress || stxAddress === 'undefined') return { executiveTeamMember: false };
	const functionArgs = [`0x${serializeCV(principalCV(stxAddress))}`];
	const data = {
		contractAddress: emergencyExecuteContractId.split('.')[0],
		contractName: emergencyExecuteContractId.split('.')[1],
		functionName: 'is-executive-team-member',
		functionArgs
	};
	try {
		const result = (await callContractReadOnly(getConfig().stacksApi, data, getConfig().stacksHiroKey)).value;
		return {
			executiveTeamMember: Boolean(result)
		};
	} catch (err: any) {
		return { executiveTeamMember: false };
	}
}

export async function getGovernanceData(daoContractAddress: string, principle: string): Promise<GovernanceData> {
	try {
		const result = await getEdgTotalSupply(daoContractAddress);
		const result1 = await getEdgBalance(daoContractAddress, principle);
		const result2 = await getEdgLocked(daoContractAddress, principle);
		return {
			totalSupply: Number(result.totalSupply),
			userBalance: Number(result1.balance),
			userLocked: Number(result2.locked)
		};
	} catch (err: any) {
		return {
			totalSupply: 0,
			userBalance: 0,
			userLocked: 0
		};
	}
}

export async function getEdgTotalSupply(daoContractAddress: string): Promise<{ totalSupply: boolean }> {
	const functionArgs: Array<any> = [];
	const data = {
		contractAddress: daoContractAddress,
		contractName: 'ede000-governance-token',
		functionName: 'get-total-supply',
		functionArgs
	};
	const result = (await callContractReadOnly(getConfig().stacksApi, data, getConfig().stacksHiroKey)).value;
	return {
		totalSupply: Boolean(result)
	};
}

export async function getEdgBalance(daoContractAddress: string, stxAddress: string): Promise<{ balance: boolean }> {
	const functionArgs = [`0x${serializeCV(principalCV(stxAddress))}`];
	const data = {
		contractAddress: daoContractAddress,
		contractName: 'ede000-governance-token',
		functionName: 'edg-get-balance',
		functionArgs
	};
	const result = (await callContractReadOnly(getConfig().stacksApi, data, getConfig().stacksHiroKey)).value;
	return {
		balance: Boolean(result)
	};
}

export async function getEdgLocked(daoContractAddress: string, stxAddress: string): Promise<{ locked: boolean }> {
	const functionArgs = [`0x${serializeCV(principalCV(stxAddress))}`];
	const data = {
		contractAddress: daoContractAddress,
		contractName: 'ede000-governance-token',
		functionName: 'edg-get-locked',
		functionArgs
	};
	const result = (await callContractReadOnly(getConfig().stacksApi, data, getConfig().stacksHiroKey)).value;
	return {
		locked: Boolean(result)
	};
}
