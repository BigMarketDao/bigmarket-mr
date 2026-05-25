<script lang="ts">
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	interface Props {
		loading: boolean;
		vaultBalance: bigint | null;
		walletBalance: bigint | null;
		mappedBalance: bigint | null;
		mappedAddress?: string;
	}

	const {
		loading,
		vaultBalance,
		walletBalance,
		mappedBalance,
		mappedAddress = ''
	}: Props = $props();

	const fmt = (v: bigint | null) => (v === null ? '—' : fmtMicroToStx(Number(v), 6));
</script>

<div class="space-y-2">
	<!-- Vault balance — primary, full width -->
	<div
		class="rounded-md border border-green-200 bg-green-50/60 p-3 dark:border-green-700/60 dark:bg-green-900/10"
	>
		<p class="text-[11px] text-neutral-500 dark:text-neutral-400">
			USDCx in vault (source address)
		</p>
		<p class="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
			{loading ? '…' : fmt(vaultBalance)}
		</p>
		<p class="mt-0.5 font-mono text-[9px] break-all text-neutral-400">
			{daoConfig.VITE_DAO_VAULT + '.usdcx'}
		</p>
	</div>

	<!-- Wallet + mapped side by side -->
	<div class="grid grid-cols-2 gap-2">
		<div
			class="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-600 dark:bg-neutral-900/60"
		>
			<p class="text-[11px] text-neutral-500 dark:text-neutral-400">Wallet USDCx (Source Wallet)</p>
			<p class="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
				{loading ? '…' : fmt(walletBalance)}
			</p>
			<!-- {#if stxAddress}
				<p class="mt-0.5 font-mono text-[9px] break-all text-neutral-400">
					{stxAddress}
				</p>
			{/if} -->
		</div>

		<div
			class="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-600 dark:bg-neutral-900/60"
		>
			<p class="text-[11px] text-neutral-500 dark:text-neutral-400">Relay address USDCx</p>
			<p class="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
				{loading ? '…' : fmt(mappedBalance)}
			</p>
			{#if mappedAddress}
				<p class="mt-0.5 font-mono text-[9px] break-all text-neutral-400">
					{mappedAddress}
				</p>
			{/if}
		</div>
	</div>
</div>
