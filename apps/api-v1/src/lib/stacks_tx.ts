import { getConfig } from './config.js';
import { STACKS_DEVNET, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { getAddressFromPrivateKey } from '@stacks/transactions';

export function resolveStacksNetwork() {
	const network = getConfig().network;
	if (network === 'testnet') return STACKS_TESTNET;
	if (network === 'devnet') return STACKS_DEVNET;
	return STACKS_MAINNET;
}

/** Next nonce for `address` from the configured Stacks API (not a local default). */
export async function fetchStacksAccountNonce(address: string): Promise<number> {
	const res = await fetch(`${getConfig().stacksApi}/extended/v1/address/${address}/nonces`);

	if (!res.ok) {
		throw new Error(`Could not fetch nonce for ${address}: ${await res.text()}`);
	}

	const json = (await res.json()) as {
		possible_next_nonce?: number;
		last_executed_tx_nonce?: number;
	};

	if (typeof json.possible_next_nonce === 'number') {
		return json.possible_next_nonce;
	}

	if (typeof json.last_executed_tx_nonce === 'number') {
		return json.last_executed_tx_nonce + 1;
	}

	return 0;
}

/** Nonce for the server's `walletKey` relay account. */
export async function fetchWalletKeyNonce(): Promise<number> {
	const config = getConfig();
	if (!config.walletKey) throw new Error('Server walletKey is not configured.');
	const address = getAddressFromPrivateKey(config.walletKey, config.network as any);
	return fetchStacksAccountNonce(address);
}
