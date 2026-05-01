<script lang="ts">
	import { daoOverviewStore, userReputationStore, walletState } from '@bigmarket/bm-common';
	import { fmtMicroToStx, fmtNumber } from '@bigmarket/bm-utilities';
	import { resolve } from '$app/paths';
	import { Sparkles } from 'lucide-svelte';
	import type { ReputationContractData } from '@bigmarket/bm-types';

	const reputationData: ReputationContractData | undefined = $derived(
		$daoOverviewStore?.reputationData
	);
	// const reputationEpochData: ReputationByEpochContractData | undefined = $derived(
	// 	$daoOverviewStore?.reputationEpochData
	// );

	const loggedIn = $derived(
		$walletState.status === 'connected' && ($walletState.accounts?.length ?? 0) > 0
	);

	/** Loaded client-side via `/reputation/:address` after wallet init (see loadWalletData). */
	const personalRep = $derived(loggedIn ? $userReputationStore?.userReputationData : undefined);
</script>

{#if reputationData}
	<a
		href={resolve('/reputation')}
		class="group border-b border-purple-500/15 bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-purple-50/90 transition-colors hover:border-purple-500/25 hover:from-purple-50 hover:via-indigo-50 hover:to-purple-50 dark:border-purple-400/10 dark:from-purple-950/40 dark:via-indigo-950/35 dark:to-purple-950/40 dark:hover:from-purple-950/55 dark:hover:via-indigo-950/50 dark:hover:to-purple-950/55"
	>
		<div
			class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6 lg:px-8"
		>
			<div class="flex min-w-0 items-center gap-2 text-purple-900 dark:text-purple-100">
				<Sparkles
					class="h-4 w-4 shrink-0 text-purple-600 opacity-80 group-hover:text-purple-700 dark:text-purple-400 dark:group-hover:text-purple-300"
					aria-hidden="true"
				/>
				<span class="text-xs font-semibold tracking-wide sm:text-sm">
					Community reputation — participate in markets and governance to earn {reputationData.tokenSymbol ??
						'BIGR'}.
				</span>
			</div>

			<dl
				class="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[11px] text-purple-800/90 sm:text-xs dark:text-purple-200/85"
			>
				<div class="flex gap-1">
					<dt class="font-medium text-purple-600/80 dark:text-purple-400/90">Epoch</dt>
					<dd class="font-mono tabular-nums">
						{fmtNumber(reputationData.currentEpoch)} (epoch duration: {reputationData.epochDuration} blocks)
					</dd>
				</div>

				{#if reputationData && reputationData.rewardPerEpoch}
					<div class="hidden gap-1 sm:flex">
						<dt class="font-medium text-purple-600/80 dark:text-purple-400/90">Reward / epoch</dt>
						<dd class="font-mono tabular-nums">
							{fmtMicroToStx(reputationData.rewardPerEpoch, 6)} BIG
						</dd>
					</div>
				{/if}

				<div class="flex gap-1">
					<dt class="font-medium text-purple-600/80 dark:text-purple-400/90">Weighted supply</dt>
					<dd class="font-mono tabular-nums">{fmtNumber(reputationData.weightedSupply)}</dd>
				</div>

				<!-- {#if reputationEpochData}
					<div class="flex gap-1">
						<dt class="font-medium text-purple-600/80 dark:text-purple-400/90">This epoch</dt>
						<dd class="font-mono tabular-nums">
							<span class="text-emerald-700 dark:text-emerald-400"
								>+{fmtNumber(reputationEpochData.mintedInEpoch)}</span
							>
							<span class="text-purple-400 dark:text-purple-500"> / </span>
							<span class="text-rose-700 dark:text-rose-400"
								>−{fmtNumber(reputationEpochData.burnedInEpoch)}</span
							>
						</dd>
					</div>
				{/if} -->

				{#if personalRep}
					<div class="flex gap-1 border-l border-purple-300/50 pl-4 dark:border-purple-600/40">
						<dt class="font-medium text-purple-600/80 dark:text-purple-400/90">Yours</dt>
						<dd class="font-mono font-semibold tabular-nums">
							{fmtNumber(personalRep.weightedReputation)} weighted · {fmtNumber(
								personalRep.overallBalance
							)} total
						</dd>
					</div>
				{:else}
					<div
						class="hidden border-l border-purple-300/50 pl-4 text-purple-600 sm:block dark:border-purple-600/40 dark:text-purple-300/90"
					>
						Connect wallet to see your stats →
					</div>
				{/if}
			</dl>
		</div>
	</a>
{/if}
