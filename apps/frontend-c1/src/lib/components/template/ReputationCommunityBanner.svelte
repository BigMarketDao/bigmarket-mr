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
		class="group block border-b border-community-border bg-community-soft transition-colors hover:bg-community-soft/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
	>
		<div
			class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6 lg:px-8"
		>
			<div class="flex min-w-0 items-center gap-2 text-community">
				<Sparkles
					class="h-4 w-4 shrink-0 text-community/70 group-hover:text-community"
					aria-hidden="true"
				/>
				<span class="text-xs font-semibold tracking-wide sm:text-sm">
					Community reputation — participate in markets and governance to earn {reputationData.tokenSymbol ??
						'BIGR'}.
				</span>
			</div>

			<dl
				class="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs text-community/90"
			>
				<div class="flex gap-1">
					<dt class="font-medium text-community/70">Epoch</dt>
					<dd class="font-mono tabular-nums">
						{fmtNumber(reputationData.currentEpoch)} (epoch duration: {reputationData.epochDuration} blocks)
					</dd>
				</div>

				{#if reputationData && reputationData.rewardPerEpoch}
					<div class="hidden gap-1 sm:flex">
						<dt class="font-medium text-community/70">Reward / epoch</dt>
						<dd class="font-mono tabular-nums">
							{fmtMicroToStx(reputationData.rewardPerEpoch, 6)} BIG
						</dd>
					</div>
				{/if}

				<div class="flex gap-1">
					<dt class="font-medium text-community/70">Weighted supply</dt>
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
					<div class="flex gap-1 border-l border-community-border pl-4">
						<dt class="font-medium text-community/70">Yours</dt>
						<dd class="font-mono font-semibold tabular-nums">
							{fmtNumber(personalRep.weightedReputation)} weighted · {fmtNumber(
								personalRep.overallBalance
							)} total
						</dd>
					</div>
				{:else}
					<div
						class="hidden border-l border-community-border pl-4 text-community/80 sm:block"
					>
						Connect wallet to see your stats →
					</div>
				{/if}
			</dl>
		</div>
	</a>
{/if}
