<script lang="ts">
	/**
	 * Unified Stacks wallet deposit panel.
	 *
	 * Loads all three balances once (vault, wallet, relay/mapped) and shares them
	 * across both action paths:
	 *   - Direct deposit: wallet USDCx → vault  (credits sourceAddress)
	 *   - Relay path:  wallet USDCx → mapped address → sweep → vault  (also credits sourceAddress)
	 *
	 * Vault balance is always keyed by (CHAIN_STACKS, hash160(stxAddress), stxAddress)
	 * regardless of which path deposited it, because depositForFromMappedAddress now
	 * uses sourceAddress as the vault credit address for native Stacks users.
	 */
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		daoConfigStore,
		getCreateMappedStacksAddress,
		getStxAddress,
		initWallet,
		requireAppConfig,
		requireDaoConfig,
		userWalletStore,
		walletState
	} from '@bigmarket/bm-common';
	import { fmtMicroToStx, requestMappedDepositToVault } from '@bigmarket/bm-utilities';
	import VaultBalanceStrip from './VaultBalanceStrip.svelte';
	import DepositAction from './DepositAction.svelte';
	import type { WalletAccount } from '@bigmarket/bm-types';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	// ── wallet state ──────────────────────────────────────────────────────────
	const stxAddress = $derived(
		$walletState.accounts.find((a: WalletAccount) => a.type === 'stx')?.address ?? ''
	);
	const stacksConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'stacks' && stxAddress.length > 0
	);

	// Wallet USDCx balance from store (no extra call needed)
	const walletBalance = $derived(
		BigInt(
			$userWalletStore.tokenBalances?.fungible_tokens[
				`${daoConfig.VITE_DAO_DEPLOYER}.usdcx::usdcx-token`
			]?.balance || 0
		)
	);

	// ── loaded state ─────────────────────────────────────────────────────────
	let loading = $state(false);
	let mappedAddress = $state('');
	let vaultBalance = $state<bigint | null>(null);
	let mappedBalance = $state<bigint | null>(null);
	let errorMsg = $state<string | null>(null);

	// ── action state ─────────────────────────────────────────────────────────
	type Path = 'direct' | 'relay';
	let path = $state<Path>('direct');

	// Direct deposit
	let directBusy = $state(false);
	let directTxHash = $state<string | null>(null);
	let directError = $state<string | null>(null);

	// Relay: transfer wallet → mapped
	let relayTransferBusy = $state(false);
	let relayTransferTxHash = $state<string | null>(null);
	let relayTransferError = $state<string | null>(null);
	let relayRawInput = $state('');
	const MICRO = 1_000_000n;

	const relayAmountMicro = $derived.by((): bigint | null => {
		const t = (relayRawInput + '').trim();
		if (!t) return null;
		const p = parseFloat(t);
		if (!Number.isFinite(p) || p <= 0) return null;
		return BigInt(Math.floor(p * 1_000_000));
	});
	const relayAmountError = $derived.by((): string | null => {
		if (!(relayRawInput + '').trim()) return null;
		if (relayAmountMicro === null) return 'Enter a valid amount.';
		if (relayAmountMicro > walletBalance)
			return `Exceeds wallet balance of ${fmtMicroToStx(Number(walletBalance), 6)} USDCx.`;
		return null;
	});

	// Relay: sweep mapped → vault
	let sweepBusy = $state(false);
	let sweepTxHash = $state<string | null>(null);
	let sweepError = $state<string | null>(null);

	// ── derived capability flags ──────────────────────────────────────────────
	const canDirectDeposit = $derived(
		stacksConnected && !directBusy && walletBalance > 0n
	);
	const canRelayTransfer = $derived(
		stacksConnected &&
			!relayTransferBusy &&
			mappedAddress.length > 0 &&
			walletBalance > 0n &&
			relayAmountMicro !== null &&
			relayAmountMicro > 0n &&
			relayAmountError === null
	);
	const canSweep = $derived(
		stacksConnected &&
			!sweepBusy &&
			mappedAddress.length > 0 &&
			mappedBalance !== null &&
			mappedBalance > 0n
	);

	const directExplorerUrl = $derived(
		directTxHash
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, directTxHash)
			: null
	);
	const relayTransferExplorerUrl = $derived(
		relayTransferTxHash
			? stacks.explorerTxUrl(
					appConfig.VITE_NETWORK,
					appConfig.VITE_STACKS_EXPLORER,
					relayTransferTxHash
				)
			: null
	);
	const sweepExplorerUrl = $derived(
		sweepTxHash
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, sweepTxHash)
			: null
	);

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

	$effect(() => {
		if (stacksConnected && stxAddress) void loadAll();
	});

	// ── data loading ─────────────────────────────────────────────────────────

	async function loadAll() {
		loading = true;
		errorMsg = null;
		try {
			const vault = stacks.createVaultClient(daoConfig);

			// Resolve mapped/relay address
			const mapping = await getCreateMappedStacksAddress(
				appConfig.VITE_BIGMARKET_API,
				'stacks',
				stxAddress
			);
			mappedAddress = mapping.mappedAddress?.trim() ?? '';

			const [vaultBal, mappedBal] = await Promise.all([
				// Vault balance always keyed by (sourceAddress, sourceAddress):
				// both direct deposits and relay sweeps credit this same slot.
				vault.getVaultUsdcxBalance(appConfig.VITE_STACKS_API, 'stacks', stxAddress, stxAddress),
				mappedAddress
					? vault.getUsdcxBalance(appConfig.VITE_STACKS_API, mappedAddress)
					: Promise.resolve(0n)
			]);

			vaultBalance = vaultBal;
			mappedBalance = mappedBal;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	// ── actions ───────────────────────────────────────────────────────────────

	async function directDeposit(amountMicro: bigint) {
		if (!canDirectDeposit) return;
		directBusy = true;
		directError = null;
		directTxHash = null;
		try {
			const vault = stacks.createVaultClient(daoConfig);
			const result = await vault.depositSip10ToVault({
				amountMicro,
				userChain: 'stacks',
				sourceAddress: getStxAddress(),
				senderStxAddress: stxAddress
			});
			if (!result.success) throw new Error(result.error ?? 'Deposit failed');
			directTxHash = result.txid ?? null;
			await loadAll();
		} catch (e) {
			directError = e instanceof Error ? e.message : String(e);
		} finally {
			directBusy = false;
		}
	}

	async function transferToRelay() {
		if (!canRelayTransfer || relayAmountMicro === null) return;
		relayTransferBusy = true;
		relayTransferError = null;
		relayTransferTxHash = null;
		try {
			// Register intent so the relayer/cron can sweep
			const intentRes = await fetch(`${appConfig.VITE_BIGMARKET_API}/cross-chain/intents`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ sourceChain: 'stacks', sourceAddress: stxAddress })
			});
			if (!intentRes.ok) throw new Error(await intentRes.text());
			const { intentId } = await intentRes.json();

			// Transfer USDCx from wallet to relay (mapped) address
			const vault = stacks.createVaultClient(daoConfig);
			const result = await vault.transferUsdcxTo({
				amountMicro: relayAmountMicro,
				senderStxAddress: stxAddress,
				recipientStxAddress: mappedAddress
			});
			if (!result.success) throw new Error(result.error ?? 'Transfer failed');
			relayTransferTxHash = result.txid ?? null;

			// Mark intent as submitted so the cron sweep picks it up
			await fetch(`${appConfig.VITE_BIGMARKET_API}/cross-chain/intents/${intentId}/submitted`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ sourceTxHash: relayTransferTxHash })
			});

			relayRawInput = '';
			await loadAll();
		} catch (e) {
			relayTransferError = e instanceof Error ? e.message : String(e);
		} finally {
			relayTransferBusy = false;
		}
	}

	async function sweepToVault() {
		if (!canSweep) return;
		sweepBusy = true;
		sweepError = null;
		sweepTxHash = null;
		try {
			const result = await requestMappedDepositToVault(
				appConfig.VITE_BIGMARKET_API,
				'stacks',
				stxAddress
			);
			sweepTxHash = result.txid;
			await loadAll();
		} catch (e) {
			sweepError = e instanceof Error ? e.message : String(e);
		} finally {
			sweepBusy = false;
		}
	}

	const tabBase = 'flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';
	const tabActive = 'bg-green-500 text-white shadow-sm';
	const tabInactive =
		'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800';
</script>

<div
	class="w-full space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	{#if !stacksConnected}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect a <strong>Stacks</strong> wallet (Hiro or compatible) to deposit USDCx.
		</p>
	{:else}
		<!-- Shared balance strip -->
		<VaultBalanceStrip
			{loading}
			{vaultBalance}
			{walletBalance}
			{mappedBalance}
			{stxAddress}
			{mappedAddress}
		/>

		{#if errorMsg}
			<p class="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
		{/if}

		<!-- Path selector -->
		<div
			class="flex gap-1 rounded-md border border-neutral-200 bg-neutral-100/60 p-1 dark:border-neutral-600 dark:bg-neutral-800/40"
			role="tablist"
		>
			<button
				type="button"
				role="tab"
				aria-selected={path === 'direct'}
				class="{tabBase} {path === 'direct' ? tabActive : tabInactive}"
				onclick={() => (path = 'direct')}
			>
				Direct deposit
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={path === 'relay'}
				class="{tabBase} {path === 'relay' ? tabActive : tabInactive}"
				onclick={() => (path = 'relay')}
			>
				Via relay address
			</button>
		</div>

		{#if path === 'direct'}
			<!-- ── Direct: wallet → vault ───────────────────────────────────────── -->
			<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
				Move USDCx directly from your Stacks wallet into the vault. You sign the transaction in
				Hiro or a compatible wallet.
			</p>
			<DepositAction
				maxBalance={walletBalance}
				canDeposit={canDirectDeposit}
				busy={directBusy}
				txHash={directTxHash}
				explorerUrl={directExplorerUrl}
				errorMsg={directError}
				onDeposit={directDeposit}
			/>
		{:else}
			<!-- ── Relay: wallet → mapped → sweep → vault ───────────────────────── -->
			<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
				Transfer USDCx from your wallet to the relay (mapped) address. The sweep cron will detect
				the balance and deposit it into the vault, crediting your source address.
			</p>

			<!-- Step 1: Transfer to relay address -->
			<div class="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-600">
				<p class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
					Step 1 — Transfer wallet → relay address
				</p>
				<div class="flex gap-2">
					<input
						type="number"
						min="0"
						step="any"
						placeholder="0.000000"
						bind:value={relayRawInput}
						disabled={!stacksConnected || relayTransferBusy}
						class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
					/>
					<button
						type="button"
						onclick={() =>
							(relayRawInput = (Number(walletBalance) / Number(MICRO))
								.toFixed(6)
								.replace(/\.?0+$/, ''))}
						disabled={!stacksConnected || walletBalance === 0n}
						class="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
					>
						Max
					</button>
				</div>
				{#if relayAmountError}
					<p class="text-xs text-red-600 dark:text-red-400">{relayAmountError}</p>
				{/if}
				{#if relayTransferError}
					<p class="text-xs text-red-700 dark:text-red-300">{relayTransferError}</p>
				{/if}
				{#if relayTransferTxHash}
					<p class="text-xs text-emerald-700 dark:text-emerald-300">
						Transfer submitted.
						{#if relayTransferExplorerUrl}
							<a
								class="font-mono break-all underline"
								href={relayTransferExplorerUrl}
								target="_blank"
								rel="noreferrer">{relayTransferTxHash}</a
							>
						{:else}
							<span class="font-mono break-all">{relayTransferTxHash}</span>
						{/if}
					</p>
				{/if}
				<Button
					type="button"
					variant="secondary"
					onclick={transferToRelay}
					disabled={!canRelayTransfer}
					class="w-full cursor-pointer"
				>
					{relayTransferBusy ? 'Submitting…' : 'Transfer to relay address'}
				</Button>
			</div>

			<!-- Step 2: Sweep relay → vault -->
			<div class="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-600">
				<p class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
					Step 2 — Sweep relay address → vault
					{#if mappedBalance !== null && mappedBalance > 0n}
						<span class="ml-1 text-emerald-600 dark:text-emerald-400"
							>({fmtMicroToStx(Number(mappedBalance), 6)} USDCx ready)</span
						>
					{/if}
				</p>
				<p class="text-[11px] text-neutral-500 dark:text-neutral-400">
					Triggers the relayer to sweep all USDCx on the relay address into your vault. The vault
					balance above will reflect the sweep once confirmed.
				</p>
				{#if sweepError}
					<p class="text-xs text-red-700 dark:text-red-300">{sweepError}</p>
				{/if}
				{#if sweepTxHash}
					<p class="text-xs text-emerald-700 dark:text-emerald-300">
						Sweep submitted.
						{#if sweepExplorerUrl}
							<a
								class="font-mono break-all underline"
								href={sweepExplorerUrl}
								target="_blank"
								rel="noreferrer">{sweepTxHash}</a
							>
						{:else}
							<span class="font-mono break-all">{sweepTxHash}</span>
						{/if}
					</p>
				{/if}
				<Button
					type="button"
					onclick={sweepToVault}
					disabled={!canSweep}
					class="w-full cursor-pointer"
				>
					{sweepBusy ? 'Sweeping…' : 'Sweep relay balance to vault'}
				</Button>
			</div>
		{/if}

		<!-- Refresh -->
		<button
			type="button"
			onclick={() => void loadAll()}
			disabled={loading}
			class="text-xs text-neutral-500 underline hover:text-neutral-700 disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:text-neutral-200"
		>
			{loading ? 'Refreshing…' : 'Refresh balances'}
		</button>
	{/if}
</div>
