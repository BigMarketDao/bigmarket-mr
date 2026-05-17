<script lang="ts">
	import { appConfigStore, daoOverviewStore, requireAppConfig, userReputationStore, walletState } from '@bigmarket/bm-common';
	import { fmtNumber, fmtNumberStacksFloor } from '@bigmarket/bm-utilities';
	import { resolve } from '$app/paths';
	import type { ReputationContractData } from '@bigmarket/bm-types';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	const reputationData: ReputationContractData | undefined = $derived(
		$daoOverviewStore?.reputationData
	);

	const loggedIn = $derived(
		$walletState.status === 'connected' && ($walletState.accounts?.length ?? 0) > 0
	);

	/** Loaded client-side via `/reputation/:address` after wallet init (see loadWalletData). */
	const personalRep = $derived(loggedIn ? $userReputationStore?.userReputationData : undefined);

	const networkLabel = $derived(
		appConfig.VITE_NETWORK === 'testnet'
			? appConfig.VITE_NETWORK.toUpperCase()
			: 'ALPHA'
	);
</script>

{#if reputationData}
	<a
		href={resolve('/reputation')}
		class="group block border-b border-white/10 bg-background transition-colors hover:bg-background/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
	>
		<div
			class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6 lg:px-8"
		>
			<div
				class="flex min-w-0 flex-1 items-center gap-x-0 overflow-x-auto text-xs font-normal whitespace-nowrap text-white/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				<span class="shrink-0 font-medium text-white/70">Earn rewards just for playing</span>

				<span class="shrink-0 text-white/30" aria-hidden="true"> · </span>

				<span class="shrink-0">Round {fmtNumber(reputationData.currentEpoch)}</span>

				{#if reputationData.rewardPerEpoch}
					<span class="shrink-0 text-white/30" aria-hidden="true"> · </span>

					<span class="shrink-0">
						Prize pool: <span class="font-semibold text-white"
							>{fmtNumberStacksFloor(reputationData.rewardPerEpoch)} BIG</span
						>
					</span>
				{/if}

				{#if loggedIn}
					<span class="shrink-0 text-white/30" aria-hidden="true"> · </span>

					<span class="shrink-0">
						Your score: <span class="font-semibold text-white"
							>{fmtNumber(personalRep?.weightedReputation)} pts</span
						>
					</span>
				{/if}
			</div>

			<span
				class="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-400"
			>
				{networkLabel}
			</span>
		</div>
	</a>
{/if}
