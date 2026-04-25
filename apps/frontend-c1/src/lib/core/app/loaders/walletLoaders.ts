import { getBtcAddress, getOrdAddress, getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
import type {
	AddressMempoolObject,
	AddressObject,
	TokenBalances,
	TransactionObject,
	WalletBalances
} from '@bigmarket/bm-types';

export async function addresses(): Promise<AddressObject> {
	if (!isLoggedIn()) return {} as AddressObject;
	if (typeof window !== 'undefined') {
		try {
			const result: AddressObject = {
				stxAddress: getStxAddress() || 'unknown',
				cardinal: getBtcAddress() || 'unknown',
				ordinal: getOrdAddress() || 'unknown',
				btcPubkeySegwit0: 'unknown',
				btcPubkeySegwit1: 'unknown',
				sBTCBalance: 0,
				stxBalance: 0
			};
			return result;
		} catch (err) {
			console.warn('getUserData failed:', err);
		}
	}
	return {} as AddressObject;
}

export async function getWalletBalances(
	stacksApi: string,
	mempoolApi: string,
	stxAddress: string,
	cardinal: string,
	ordinal: string
): Promise<WalletBalances> {
	const rawBal = await fetchUserBalances(stacksApi, mempoolApi, stxAddress, cardinal, ordinal);
	return {
		stacks: {
			address: stxAddress,
			amount: Number(rawBal?.tokenBalances?.stx?.balance || '0')
		},
		cardinal: {
			address: cardinal,
			amount: extractBtcBalance(rawBal?.cardinalInfo)
		},
		ordinal: {
			address: ordinal,
			amount: extractBtcBalance(rawBal?.ordinalInfo)
		}
	};
}

export async function fetchUserBalances(
	stacksApi: string,
	mempoolApi: string,
	stxAddress: string,
	cardinal: string,
	ordinal: string,
	stacksHiroKey?: string
): Promise<AddressObject> {
	const userBalances: AddressObject = {} as AddressObject;
	userBalances.stxAddress = stxAddress;
	userBalances.cardinal = cardinal;
	userBalances.ordinal = ordinal;
	try {
		//checkAddressForNetwork(getConfig().network, stxAddress)
		//checkAddressForNetwork(getConfig().network, cardinal)
		//checkAddressForNetwork(getConfig().network, ordinal)
		if (userBalances.stxAddress) {
			const url = `${stacksApi}/extended/v1/address/${userBalances.stxAddress}/balances`;
			const response = await fetch(url, {
				headers: { ...(stacksHiroKey ? { 'x-api-key': stacksHiroKey } : {}) }
			});
			const result = await response.json();
			userBalances.tokenBalances = result;
		}
	} catch {
		//console.error('fetchUserBalances: stacksTokenInfo: ' + err.message)
	}
	// fetch bns info
	try {
		const url = `${stacksApi}/v1/addresses/stacks/${stxAddress}`;
		const response = await fetch(url, {
			headers: { ...(stacksHiroKey ? { 'x-api-key': stacksHiroKey } : {}) }
		});
		const result = await response.json();
		userBalances.bnsNameInfo = result;
	} catch (err) {
		userBalances.bnsNameInfo = { names: [] };
		console.log('fetchUserBalances: sBtcBalance: ' + err);
	}
	try {
		//checkAddressForNetwork(getConfig().network, userBalances.cardinal)
		const address: AddressMempoolObject = await fetchAddress(mempoolApi, userBalances.cardinal);
		userBalances.cardinalInfo = address;
	} catch (err) {
		console.log('fetchUserBalances: cardinalInfo: ', err);
	}
	try {
		//checkAddressForNetwork(getConfig().network, userBalances.cardinal)
		const address: AddressMempoolObject = await fetchAddress(mempoolApi, userBalances.ordinal);
		userBalances.ordinalInfo = address;
	} catch (err) {
		console.log('fetchUserBalances: ordinalInfo: ', err);
	}
	return userBalances;
}
function extractBtcBalance(addressMempoolObject: AddressMempoolObject | undefined) {
	if (!addressMempoolObject) return 0;
	return (
		addressMempoolObject?.chain_stats?.funded_txo_sum -
			addressMempoolObject.chain_stats?.spent_txo_sum || 0
	);
}
export async function fetchAddress(
	mempoolUrl: string,
	address: string,
	stacksHiroKey?: string
): Promise<AddressMempoolObject> {
	const url = `${mempoolUrl}/address/${address}`;
	try {
		const response = await fetch(url, {
			headers: { ...(stacksHiroKey ? { 'x-api-key': stacksHiroKey } : {}) }
		});
		const result = await response.json();
		return result;
	} catch {
		//console.log('fetchAddress: error: ', err);
		return {} as AddressMempoolObject;
	}
}
