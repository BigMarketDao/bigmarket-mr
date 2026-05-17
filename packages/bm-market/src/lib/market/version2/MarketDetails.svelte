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
<div class="space-y-6 rounded-xl border border-community-border bg-card p-6 shadow-md">
	<!-- Header Section -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row">
		<p class="flex-1 text-sm leading-relaxed text-foreground">
			{@html market.unhashedData.description}
		</p>
		<span
			class="inline-flex whitespace-nowrap rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success"
		>
			{@html getMarketStatus($chainStore.stacks.burn_block_height, market)}
		</span>
	</div>

	<!-- Resolution Criteria -->
	<div class="rounded-lg bg-muted p-4">
		<h2 class="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			Resolution Criteria
		</h2>
		<p class="text-sm leading-relaxed text-foreground">
			{@html market.unhashedData.criterionSources.criteria || 'Resolution criteria coming soon'}
		</p>
	</div>

	<!-- Market Data -->
	<div class="rounded-lg bg-muted p-4">
		<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Market Data</h2>

		<table class="w-full text-sm text-foreground">
			<tbody class="divide-y divide-border">
				{#if resolution}
					<tr>
						<td class="py-2 font-medium">Starts</td>
						<td class="tabular-nums">
							<div class="flex justify-between">
								{resolution.startOffChain}
								<span class="text-xs">
									BTC Block:
									<span class="text-success tabular-nums">{fmtNumber(resolution.startOnChain)}</span>
								</span>
							</div>
						</td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Closes</td>
						<td class="tabular-nums">
							<div class="flex justify-between">
								{resolution.closeOffChain}
								<span class="text-xs">
									BTC Block:
									<span class="text-success tabular-nums">{fmtNumber(resolution.closeOnChain)}</span>
								</span>
							</div>
						</td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Resolves</td>
						<td class="tabular-nums">
							<div class="flex justify-between">
								{resolution.resolvesOffChain}
								<span class="text-xs">
									BTC Block:
									<span class="text-success tabular-nums">{fmtNumber(resolution.resolvesOnChain)}</span>
								</span>
							</div>
						</td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Market Fee</td>
						<td class="tabular-nums">{@html market.marketData.marketFeeBips / 100} %</td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Create Transaction</td>
						<td>
							<a
								href={stacks.explorerTxUrl(
									appConfig.VITE_NETWORK,
									appConfig.VITE_STACKS_EXPLORER,
									market.txId
								)}
								target="_blank"
								class="text-community underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								View on Explorer
							</a>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Fee Data -->
	<div class="rounded-lg bg-muted p-4">
		<h2 class="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Category Info</h2>
		<p class="text-sm leading-relaxed text-foreground">
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
