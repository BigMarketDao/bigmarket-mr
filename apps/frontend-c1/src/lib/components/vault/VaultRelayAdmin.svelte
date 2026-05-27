<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		requireAppConfig,
		walletState,
		daoConfigStore,
		requireDaoConfig
	} from '@bigmarket/bm-common';
	import type { WalletAccount } from '@bigmarket/bm-types';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	// EVM controller address — the server derives the mapped Stacks key from this
	const ethAddress = $derived(
		$walletState.accounts.find((a: WalletAccount) => a.type === 'eth')?.address ?? ''
	);
	const mappedAddress = $derived($walletState.activeAccount?.mappedAddress ?? '');

	let relayAddress = $state<string | null>(null);
	let balanceMicro = $state<bigint | null>(null);
	let loading = $state(false);
	let sweeping = $state(false);
	let errorMsg = $state<string | null>(null);
	let sweepTxid = $state<string | null>(null);

	let recipientInput = $state('');
	let amountInput = $state('');

	let open = $state(false);

	const balanceDisplay = $derived(
		balanceMicro !== null ? (Number(balanceMicro) / 1_000_000).toFixed(6) + ' USDCx' : '—'
	);

	const sweepUrl = $derived(`${appConfig.VITE_BIGMARKET_API}/cross-chain/protocol/sweep-relay`);

	const canSweep = $derived(
		!sweeping &&
			balanceMicro !== null &&
			balanceMicro > 0n &&
			ethAddress.length > 0 &&
			/^S[TP][A-Z0-9]{38,39}$/.test(recipientInput.trim())
	);

	async function load() {
		if (!mappedAddress) return;
		loading = true;
		errorMsg = null;
		try {
			// Show the user's mapped address (derived server-side from ethAddress)
			relayAddress = mappedAddress;
			const vault = stacks.createVaultClient(daoConfig);
			balanceMicro = await vault.getUsdcxBalance(appConfig.VITE_STACKS_API, mappedAddress);
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function sweep() {
		if (!canSweep || !ethAddress) return;
		sweeping = true;
		sweepTxid = null;
		errorMsg = null;
		try {
			// Pass controllerAddress so the API derives the correct mapped private key
			const body: Record<string, string> = {
				controllerAddress: ethAddress,
				recipientAddress: recipientInput.trim()
			};
			if (amountInput.trim()) {
				body.amountMicro = String(BigInt(Math.round(Number(amountInput.trim()) * 1_000_000)));
			}
			const res = await fetch(sweepUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => null);
				throw new Error(errJson?.error ?? `HTTP ${res.status}`);
			}
			const data = (await res.json()) as { txid: string; amount: string };
			sweepTxid = data.txid;
			balanceMicro = null; // invalidate — reload to refresh
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			sweeping = false;
		}
	}

	onMount(() => void load());
</script>

<!-- Collapsible relay admin panel — shown in EVM section for devnet/testnet demos -->
<div
	class="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 dark:border-amber-700/50 dark:bg-amber-900/10"
>
	<button
		type="button"
		onclick={() => (open = !open)}
		class="flex w-full items-center justify-between px-4 py-2.5 text-left"
	>
		<span class="text-xs font-semibold text-amber-800 dark:text-amber-300">
			Relay address admin
			{#if balanceMicro !== null && balanceMicro > 0n}
				<span
					class="ml-2 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-700/50 dark:text-amber-200"
				>
					{balanceDisplay}
				</span>
			{/if}
		</span>
		<svg
			class="h-3.5 w-3.5 text-amber-600 transition-transform dark:text-amber-400 {open
				? 'rotate-180'
				: ''}"
			viewBox="0 0 16 16"
			fill="currentColor"
		>
			<path d="M8 10.5 L2 4.5 L14 4.5 Z" />
		</svg>
	</button>

	{#if open}
		<div class="space-y-4 border-t border-amber-200 px-4 pt-3 pb-4 dark:border-amber-700/40">
			<p class="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
				After an EVM vault withdrawal, USDCx lands at the relay address. On devnet/testnet AllBridge
				is unavailable — use this panel to manually drain the relay to any Stacks address.
			</p>

			<!-- Relay address + balance -->
			<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
				<div class="flex items-center gap-2">
					<span class="text-neutral-500">Relay</span>
					{#if loading}
						<span class="text-neutral-400">loading…</span>
					{:else if relayAddress}
						<span class="break-all">{relayAddress}</span>
					{/if}
					<button
						type="button"
						onclick={load}
						disabled={loading}
						class="ml-auto shrink-0 text-[10px] text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
					>
						{loading ? '…' : 'refresh'}
					</button>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-neutral-500">Balance</span>
					<span
						class={balanceMicro !== null && balanceMicro > 0n
							? 'text-emerald-700 dark:text-emerald-400'
							: 'text-neutral-400'}
					>
						{balanceDisplay}
					</span>
				</div>
			</div>

			<!-- Sweep form -->
			<div class="space-y-2">
				<div class="space-y-1">
					<label
						class="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300"
						for="relay-recipient"
					>
						Send to (Stacks address)
					</label>
					<input
						id="relay-recipient"
						type="text"
						autocomplete="off"
						placeholder="ST… or SP…"
						bind:value={recipientInput}
						class="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-mono text-xs text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
					/>
				</div>

				<div class="space-y-1">
					<label
						class="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300"
						for="relay-amount"
					>
						Amount (USDCx) — leave blank to sweep all
					</label>
					<input
						id="relay-amount"
						type="text"
						inputmode="decimal"
						placeholder="e.g. 100 (blank = all)"
						bind:value={amountInput}
						class="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
					/>
				</div>

				{#if errorMsg}
					<p class="text-[11px] text-red-700 dark:text-red-400">{errorMsg}</p>
				{/if}

				{#if sweepTxid}
					<p class="text-[11px] break-all text-emerald-700 dark:text-emerald-400">
						Swept. txid: <span class="font-mono">{sweepTxid}</span>
					</p>
				{/if}

				<Button
					type="button"
					onclick={sweep}
					disabled={!canSweep}
					class="w-full cursor-pointer text-xs"
				>
					{sweeping ? 'Sweeping…' : 'Sweep relay → recipient'}
				</Button>
			</div>
		</div>
	{/if}
</div>
