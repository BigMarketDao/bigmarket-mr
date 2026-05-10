<script lang="ts">
	import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import { dateOfResolution, fmtNumber, getMarketStatus } from '@bigmarket/bm-utilities';
  import { appConfigStore, chainStore, requireAppConfig } from '@bigmarket/bm-common';
  import { stacks } from '@bigmarket/sdk';

	const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>();
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let resolution = dateOfResolution($chainStore.stacks.burn_block_height, market);
</script>

<!-- Market Container -->
<div class="bg-surface space-y-6 rounded-xl border border-purple-600/20 p-6 shadow-md">
	<!-- Header Section -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row">
		<p class="text-primary flex-1 text-sm leading-relaxed">
			{@html market.unhashedData.description}
		</p>
		<span
			class="inline-flex shrink-0 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium whitespace-nowrap text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
		>
			{@html getMarketStatus($chainStore.stacks.burn_block_height, market)}
		</span>
	</div>

	<!-- Resolution Criteria -->
	<div class="bg-surface-1 rounded-lg p-4">
		<h2 class="text-secondary mb-2 text-sm font-semibold tracking-wide uppercase">Resolution Criteria</h2>
		<p class="text-primary text-sm leading-relaxed">
			{@html market.unhashedData.criterionSources.criteria || 'Resolution criteria coming soon'}
		</p>
	</div>

	<!-- Market Data -->
	<div class="bg-surface-2 rounded-lg p-4">
		<h2 class="text-secondary mb-4 text-sm font-semibold tracking-wide uppercase">Market Data</h2>

		<table class="text-primary w-full text-sm">
			<tbody class="divide-outline divide-y">
				{#if resolution}
					<tr>
						<td class="py-2 font-medium">Starts</td>
						<td><div class="flex justify-between">{resolution.startOffChain} <span class="text-xs">BTC Block: <span class=" text-green-400">{fmtNumber(resolution.startOnChain)}</span></span></div></td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Closes</td>
						<td><div class="flex justify-between">{resolution.closeOffChain} <span class="text-xs">BTC Block: <span class=" text-green-400">{fmtNumber(resolution.closeOnChain)}</span></span></div></td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Resolves</td>
						<td><div class="flex justify-between">{resolution.resolvesOffChain} <span class="text-xs">BTC Block: <span class=" text-green-400">{fmtNumber(resolution.resolvesOnChain)}</span></span></div></td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Market Fee</td>
						<td>{@html market.marketData.marketFeeBips / 100} %</td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Create Transaction</td>
						<td>
							<a href={stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, market.txId)} target="_blank" class="text-purple-600 underline">View on Explorer</a>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Fee Data -->
	<div class="bg-surface-1 rounded-lg p-4">
		<h2 class="text-secondary mb-2 text-sm font-semibold tracking-wide uppercase">Category Info</h2>
		<p class="text-primary text-sm leading-relaxed">
			{#if market.marketType === 1}
				{#if market.marketData.categories.length === 2}
					Binary market – choose for or against
				{:else}
					Categorical market – choose from listed options
					{@html market.marketData.categories}
				{/if}
			{:else}
				Scalar market – resolves on-chain via Pyth Oracle
				{@html market.marketData.categories}
			{/if}
		</p>
	</div>
</div>
