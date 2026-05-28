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
		getStxAddress,
		initWallet,
		requireAppConfig,
		requireDaoConfig,
		userWalletStore,
		walletState
	} from '@bigmarket/bm-common';
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';
	import DepositAction from './DepositAction.svelte';
	import MappedSweepPanel from './MappedSweepPanel.svelte';
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
	let tokenSymbol = $state<'USDC' | 'USDT'>('USDC');

	// Wallet USDCx balance from store (no extra call needed)
	const walletBalance = $derived(
		BigInt(
			$userWalletStore.tokenBalances?.fungible_tokens[
				`${daoConfig.VITE_DAO_DEPLOYER}.usdcx::usdcx-token`
			]?.balance || 0
		)
	);

	// Mapped relay address — populated in walletState by initWallet
	const mappedAddress = $derived($walletState.activeAccount?.mappedAddress ?? '');

	// ── action state ─────────────────────────────────────────────────────────
	let errorMsg = $state<string | null>(null);

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

	// ── derived capability flags ──────────────────────────────────────────────
	const canDirectDeposit = $derived(stacksConnected && !directBusy && walletBalance > 0n);
	const canRelayTransfer = $derived(
		stacksConnected &&
			!relayTransferBusy &&
			mappedAddress.length > 0 &&
			walletBalance > 0n &&
			relayAmountMicro !== null &&
			relayAmountMicro > 0n &&
			relayAmountError === null
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

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

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
		} catch (e) {
			relayTransferError = e instanceof Error ? e.message : String(e);
		} finally {
			relayTransferBusy = false;
		}
	}
</script>

<div
	class="w-full space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	{#if !stacksConnected}
		<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
			Deposit {tokenSymbol} to your vault then participate by buying or selling market shares in BigMarket.
		</p>
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect a <strong>Stacks</strong> wallet to deposit USDCx.
		</p>
	{:else}
		{#if errorMsg}
			<p class="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
		{/if}

		<!-- Direct deposit (always shown) -->
		<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
			Move USDCx directly from your Stacks wallet into the vault. You sign the transaction in Hiro
			or a compatible wallet.
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

		<!-- Debug toggle — right-aligned, subtle -->
		<div class="flex justify-end">
			<button
				type="button"
				onclick={() => (path = path === 'relay' ? 'direct' : 'relay')}
				class="flex items-center gap-1 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
				title="Toggle relay debug path"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					fill="currentColor"
					class="h-3 w-3 {path === 'relay' ? 'text-amber-500' : ''}"
				>
					<path
						fill-rule="evenodd"
						d="M6.455 1.45A.5.5 0 0 1 6.952 1h2.096a.5.5 0 0 1 .497.45l.186 1.858a4.996 4.996 0 0 1 1.466.848l1.703-.769a.5.5 0 0 1 .639.206l1.047 1.814a.5.5 0 0 1-.14.656l-1.517 1.09a5.026 5.026 0 0 1 0 1.694l1.516 1.09a.5.5 0 0 1 .141.656l-1.047 1.814a.5.5 0 0 1-.639.206l-1.703-.768a4.996 4.996 0 0 1-1.466.847l-.186 1.858a.5.5 0 0 1-.497.45H6.952a.5.5 0 0 1-.497-.45l-.186-1.858a4.996 4.996 0 0 1-1.466-.848l-1.703.769a.5.5 0 0 1-.639-.206L1.414 10.86a.5.5 0 0 1 .14-.656l1.517-1.09a5.025 5.025 0 0 1 0-1.694L1.554 6.33a.5.5 0 0 1-.14-.656L2.46 3.86a.5.5 0 0 1 .639-.206l1.703.769a4.996 4.996 0 0 1 1.466-.848L6.455 1.45ZM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class={path === 'relay' ? 'text-amber-500' : ''}>debug</span>
			</button>
		</div>

		<!-- ── Relay path (debug only) ─────────────────────────────────────────── -->
		{#if path === 'relay'}
			<div
				class="space-y-3 rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3 dark:border-amber-700/50 dark:bg-amber-900/10"
			>
				<p class="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
					Debug: transfer USDCx to the relay (mapped) address. The sweep cron will detect the
					balance and deposit it into the vault, crediting your source address.
				</p>

				<!-- Step 1: Transfer to mapped address -->
				<div class="space-y-2">
					<p class="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
						Step 1 — Transfer wallet → mapped address
					</p>
					<div class="flex gap-2">
						<input
							type="number"
							min="0"
							step="any"
							placeholder="0.000000"
							bind:value={relayRawInput}
							disabled={!stacksConnected || relayTransferBusy}
							class="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
						/>
						<button
							type="button"
							onclick={() =>
								(relayRawInput = (Number(walletBalance) / Number(MICRO))
									.toFixed(6)
									.replace(/\.?0+$/, ''))}
							disabled={!stacksConnected || walletBalance === 0n}
							class="shrink-0 rounded-md border border-neutral-300 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
						>
							Max
						</button>
					</div>
					{#if relayAmountError}
						<p class="text-[11px] text-red-600 dark:text-red-400">{relayAmountError}</p>
					{/if}
					{#if relayTransferError}
						<p class="text-[11px] text-red-700 dark:text-red-300">{relayTransferError}</p>
					{/if}
					{#if relayTransferTxHash}
						<p class="text-[11px] text-emerald-700 dark:text-emerald-300">
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
						class="w-full cursor-pointer text-xs"
					>
						{relayTransferBusy ? 'Submitting…' : 'Transfer to mapped address'}
					</Button>
				</div>

				<!-- Step 2: Sweep mapped → vault -->
				<p class="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
					Step 2 — Sweep mapped address → vault
				</p>
				<MappedSweepPanel sourceChain="stacks" sourceAddress={stxAddress} />
			</div>
		{/if}
	{/if}
</div>
