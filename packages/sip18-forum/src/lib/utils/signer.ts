import { disconnect, isConnected } from './connection_wrapper';

export type AddressObject = {
	stxAddress: string;
	cardinal: string;
	ordinal: string;
	sBTCBalance: number;
	stxBalance?: number;
	bnsNameInfo?: any;
	btcPubkeySegwit0?: string;
	btcPubkeySegwit1?: string;
};

export async function isLoggedIn() {
	try {
		if (typeof window === 'undefined') return false;
		return await isConnected();
	} catch (err) {
		return false;
	}
}

export async function logUserOut() {
	if (typeof window === 'undefined') return;
	return await disconnect();
}

export function isXverse(): boolean {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		try {
			const stxProvider = localStorage.getItem('STX_PROVIDER') || '';
			return stxProvider.toLowerCase().includes('xverse');
		} catch (err) {
			return false;
		}
	}
	return false;
}

export function isLeather(): boolean {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		try {
			const stxProvider = localStorage.getItem('STX_PROVIDER') || '';
			return stxProvider.toLowerCase().includes('leather');
		} catch (err) {
			return false;
		}
	}
	return false;
}
