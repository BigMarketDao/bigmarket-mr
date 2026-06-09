<script lang="ts">
	import { allowedTokenStore } from '@bigmarket/bm-common';
	import type { MarketData, PredictionMarketClaimEvent } from '@bigmarket/bm-types';
	import { fmtMicroToStx, getCategoryLabel, getMarketToken } from '@bigmarket/bm-utilities';
	import { stacks } from '@bigmarket/sdk';
	import { selectedCurrency } from '@bigmarket/bm-common';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { fetchMyClaimedMarket } from '$lib/core/app/loaders/myMarketsLoaders';
	import { onMount } from 'svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let {
		marketId,
		extension,
		claimer,
		marketData,
		claim: initialClaim = null
	}: {
		marketId: number;
		extension: string;
		claimer: string;
		marketData: MarketData;
		claim?: PredictionMarketClaimEvent | null;
	} = $props();

	let isLoading = $state(!initialClaim?.txId);
	let claim: PredictionMarketClaimEvent | null = $state(initialClaim);

	const token = $derived(getMarketToken(marketData.token, $allowedTokenStore));

	onMount(async () => {
		if (claim?.txId) {
			isLoading = false;
			return;
		}
		claim = await fetchMyClaimedMarket(appConfig.VITE_BIGMARKET_API, marketId, extension, claimer);
		isLoading = false;
	});
</script>

{#if isLoading}
	<p class="text-[11px] text-muted-foreground">Loading claim details…</p>
{:else if claim?.txId}
	<div class="space-y-3 text-[11px]">
		<p class="font-medium text-foreground">Claim settlement</p>
		<dl class="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2">
			<dt class="text-muted-foreground">Winning outcome</dt>
			<dd class="font-medium text-success">
				{@html getCategoryLabel($selectedCurrency, claim.indexWon, marketData)}
			</dd>

			<dt class="text-muted-foreground">Shares at claim</dt>
			<dd class="font-mono tabular-nums">
				{fmtMicroToStx(claim.userSharesInOutcome, token.decimals)}
			</dd>

			<dt class="text-muted-foreground">Token deposit</dt>
			<dd class="font-mono tabular-nums">
				{fmtMicroToStx(claim.userTokensInOutcome, token.decimals)}
				{token.symbol}
			</dd>

			{#if claim.marketFee > 0}
				<dt class="text-muted-foreground">Market fee</dt>
				<dd class="font-mono tabular-nums">
					{fmtMicroToStx(claim.marketFee, token.decimals)}
					{token.symbol}
				</dd>
			{/if}

			<dt class="text-muted-foreground">Received</dt>
			<dd class="font-mono font-medium text-success tabular-nums">
				{fmtMicroToStx(claim.netRefund, token.decimals)}
				{token.symbol}
			</dd>
		</dl>
		<a
			href={stacks.explorerTxUrl(
				appConfig.VITE_NETWORK,
				appConfig.VITE_STACKS_EXPLORER,
				claim.txId
			)}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-block text-[11px] font-medium text-primary underline hover:text-primary/80"
		>
			View claim transaction
		</a>
	</div>
{/if}
