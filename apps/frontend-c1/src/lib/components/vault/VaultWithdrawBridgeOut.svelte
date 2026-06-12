<script lang="ts">
	/**
	 * Step 2 after an EVM vault withdrawal: bridge USDCx from the mapped relay
	 * address on Stacks back to USDC on Ethereum via AllBridge (mainnet).
	 */
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		requireAppConfig,
		walletState
	} from '@bigmarket/bm-common';
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';
	import type { WalletAccount } from '@bigmarket/bm-types';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const isMainnet = $derived(appConfig.VITE_NETWORK === 'mainnet');

	const ethAddress = $derived(
		$walletState.accounts.find((a: WalletAccount) => a.type === 'eth')?.address ?? ''
	);
	const mappedAddress = $derived($walletState.activeAccount?.mappedAddress?.trim() ?? '');

	const relayInfoUrl = $derived(
		ethAddress
			? `${appConfig.VITE_BIGMARKET_API}/cross-chain/protocol/relay-info?controllerAddress=${encodeURIComponent(ethAddress)}`
			: null
	);
	const bridgeUrl = $derived(
		`${appConfig.VITE_BIGMARKET_API}/cross-chain/protocol/bridge-relay-to-ethereum`
	);
	const mappedExplorerUrl = $derived(
		mappedAddress.length > 0
			? stacks.explorerAddressUrl(
					appConfig.VITE_NETWORK,
					appConfig.VITE_STACKS_EXPLORER,
					mappedAddress
				)
			: null
	);
	const ethExplorerOrigin = $derived(
		isMainnet ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
	);

	let balanceMicro = $state<bigint | null>(null);
	let loading = $state(false);
	let bridging = $state(false);
	let errorMsg = $state<string | null>(null);
	let bridgeTxid = $state<string | null>(null);
	let amountInput = $state('');

	const balanceDisplay = $derived(
		balanceMicro !== null ? fmtMicroToStx(Number(balanceMicro), 6) : null
	);

	const bridgeAmountMicro = $derived.by((): bigint | null => {
		const trimmed = amountInput.trim();
		if (!trimmed) return balanceMicro;
		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed) || parsed <= 0) return null;
		return BigInt(Math.round(parsed * 1_000_000));
	});

	const canBridge = $derived(
		isMainnet &&
			!bridging &&
			ethAddress.length > 0 &&
			mappedAddress.length > 0 &&
			balanceMicro !== null &&
			balanceMicro > 0n &&
			bridgeAmountMicro !== null &&
			bridgeAmountMicro > 0n &&
			bridgeAmountMicro <= balanceMicro
	);

	async function refreshBalance() {
		if (!relayInfoUrl) return;
		loading = true;
		errorMsg = null;
		try {
			const res = await fetch(relayInfoUrl);
			if (!res.ok) throw new Error(await res.text());
			const data = (await res.json()) as { relayAddress: string; balanceMicro: string };
			balanceMicro = BigInt(data.balanceMicro);
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function bridgeToEthereum() {
		if (!canBridge || bridgeAmountMicro === null) return;
		bridging = true;
		errorMsg = null;
		bridgeTxid = null;
		try {
			const body: Record<string, string> = {
				controllerAddress: ethAddress,
				toAccountAddress: ethAddress
			};
			if (amountInput.trim()) {
				body.amountMicro = bridgeAmountMicro.toString();
			}
			const res = await fetch(bridgeUrl, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => null);
				throw new Error(errJson?.error ?? `HTTP ${res.status}`);
			}
			const data = (await res.json()) as { txid: string };
			bridgeTxid = data.txid;
			await refreshBalance();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			bridging = false;
		}
	}

	onMount(() => void refreshBalance());
</script>

<div
	class="space-y-3 rounded-md border border-neutral-200 bg-white/60 p-4 dark:border-neutral-600 dark:bg-neutral-900/30"
>
	<div class="flex items-start justify-between gap-3">
		<div>
			<p class="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
				Step 2 — Bridge to Ethereum
			</p>
			<p class="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
				After step 1, USDCx sits on your mapped relay address on Stacks. Bridge it back to USDC on
				your Ethereum wallet via AllBridge.
			</p>
		</div>
		<button
			type="button"
			onclick={() => void refreshBalance()}
			disabled={loading || !ethAddress}
			class="shrink-0 text-[10px] text-neutral-400 underline hover:text-neutral-600 disabled:cursor-wait dark:hover:text-neutral-200"
		>
			{loading ? '…' : 'refresh'}
		</button>
	</div>

	{#if !ethAddress}
		<p class="text-xs text-amber-800 dark:text-amber-200">Connect MetaMask to bridge out.</p>
	{:else}
		<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">Relay (Stacks)</span>
				{#if mappedAddress && mappedExplorerUrl}
					<a
						class="mt-0.5 block break-all underline"
						href={mappedExplorerUrl}
						target="_blank"
						rel="noreferrer"
					>
						{mappedAddress}
					</a>
				{:else}
					<span class="mt-0.5 block break-all text-neutral-400">—</span>
				{/if}
			</p>
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">Receive on (ETH)</span>
				<span class="mt-0.5 block break-all">{ethAddress}</span>
			</p>
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">Relay balance</span>
				<span
					class="mt-0.5 block {balanceMicro !== null && balanceMicro > 0n
						? 'font-semibold text-emerald-700 dark:text-emerald-400'
						: ''}"
				>
					{balanceDisplay !== null ? `${balanceDisplay} USDCx` : loading ? '…' : '—'}
				</span>
			</p>
		</div>

		{#if !isMainnet}
			<p class="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
				AllBridge Stacks → Ethereum is only available on <strong>mainnet</strong>. On testnet,
				use the debug relay panel to move USDCx to a Stacks address for testing.
			</p>
		{:else if balanceMicro === 0n}
			<p class="text-xs text-neutral-500 dark:text-neutral-400">
				No USDCx on the relay address yet. Complete step 1 above, wait for confirmation, then
				refresh.
			</p>
		{:else if balanceMicro !== null && balanceMicro > 0n}
			<div class="space-y-1">
				<label
					class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
					for="bm-bridge-out-amount"
				>
					Amount (USDCx) — leave blank to bridge all
				</label>
				<input
					id="bm-bridge-out-amount"
					type="text"
					inputmode="decimal"
					placeholder={balanceDisplay ?? 'e.g. 0.25'}
					bind:value={amountInput}
					disabled={bridging}
					class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
				/>
			</div>

			<Button
				type="button"
				onclick={() => void bridgeToEthereum()}
				disabled={!canBridge}
				class="w-full cursor-pointer"
			>
				{bridging ? 'Bridging via AllBridge…' : 'Bridge USDCx → Ethereum USDC'}
			</Button>

			<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
				AllBridge may take several minutes to deliver USDC on Ethereum. Check
				<a
					class="underline"
					href="{ethExplorerOrigin}/address/{ethAddress}"
					target="_blank"
					rel="noreferrer"
				>
					your wallet on Etherscan
				</a>
				after the Stacks bridge tx confirms.
			</p>
		{/if}

		{#if errorMsg}
			<p class="text-xs text-red-700 dark:text-red-300">{errorMsg}</p>
		{/if}

		{#if bridgeTxid}
			<div
				class="space-y-1 rounded-md border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-700/50 dark:bg-emerald-900/10"
			>
				<p class="text-xs font-medium text-emerald-800 dark:text-emerald-200">
					Stacks bridge tx submitted — wait for USDC on Ethereum.
				</p>
				<a
					class="block font-mono text-[11px] break-all underline"
					href={stacks.explorerTxUrl(
						appConfig.VITE_NETWORK,
						appConfig.VITE_STACKS_EXPLORER,
						bridgeTxid
					)}
					target="_blank"
					rel="noreferrer"
				>
					{bridgeTxid}
				</a>
			</div>
		{/if}
	{/if}
</div>
