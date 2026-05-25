<script lang="ts">
	//import { userWalletStore } from '@bigmarket/bm-common';
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';
	//import { requireDaoConfig, daoConfigStore } from '@bigmarket/bm-common';

	//const appConfig = $derived(requireAppConfig($appConfigStore));
	//const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	interface Props {
		walletBalance: bigint | null;
		vaultBalance: bigint | null;
		loading: boolean;
	}

	const { walletBalance, vaultBalance, loading }: Props = $props();

	// function getBalance(token: string) {
	// 	const tokenBalances = $userWalletStore.tokenBalances;
	// 	return getTokenBalanceMicro(token, tokenBalances!) || 0;
	// }

	const walletDisplay = $derived(
		walletBalance === null ? '—' : fmtMicroToStx(Number(walletBalance), 6)
	);

	const vaultDisplay = $derived(
		vaultBalance === null ? '—' : fmtMicroToStx(Number(vaultBalance), 6)
	);
</script>

<div class="grid grid-cols-2 gap-3">
	<div
		class="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-600 dark:bg-neutral-900/60"
	>
		<p class="text-[11px] text-neutral-500 dark:text-neutral-400">USDCx available to move</p>
		<p class="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
			{loading ? '…' : walletDisplay}
		</p>
	</div>
	<div
		class="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-600 dark:bg-neutral-900/60"
	>
		<p class="text-[11px] text-neutral-500 dark:text-neutral-400">USDCx in vault</p>
		<p class="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
			{loading ? '…' : vaultDisplay}
		</p>
	</div>
</div>

{#if !loading && walletBalance !== null && walletBalance === 0n}
	<p class="text-xs text-amber-700 dark:text-amber-300">
		No USDCx balance found in your Stacks wallet.
	</p>
{/if}
