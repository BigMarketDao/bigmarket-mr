<script lang="ts">
	import type { PredictionMarketCreateEvent, Sip10Data } from '@bigmarket/bm-types';
	import { LucideWallet, LucideTrendingUp, LucideUsers } from 'lucide-svelte';
	import { bitcoinMode, chainStore, allowedTokenStore, exchangeRatesStore, selectedCurrency } from '@bigmarket/bm-common';
  import { convertSip10ToBtc, dateOfResolution, fmtMicroToStx, fmtMicroToStxNumber, getMarketToken, totalPoolSum, trimTrailingZeros } from '@bigmarket/bm-utilities';

	const { market, totalUsers } = $props<{
		market: PredictionMarketCreateEvent;
		totalUsers: number;
	}>();

	let totalStaked: number = $derived(market.marketData?.stakes ? totalPoolSum(market.marketData?.stakes) : 0);
	let resolutionDate = $derived(dateOfResolution($chainStore.stacks.burn_block_height, market));
	let token: string = $derived(market.marketData.token);
	let sip10Data: Sip10Data = $derived(getMarketToken(token, $allowedTokenStore));
</script>

<!-- Market Stats Summary -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
	<!-- Stat Card -->
	{#each [{ label: 'Total Stakes', value: totalUsers, icon: LucideUsers, color: 'text-primary', link: `/market/analysis/${market.marketId}/${market.marketType}` }, { label: 'Total Staked', value: $bitcoinMode ? `${trimTrailingZeros(convertSip10ToBtc($exchangeRatesStore, $selectedCurrency, sip10Data, fmtMicroToStxNumber(totalStaked, 8)))} ${'BTC'}` : `${trimTrailingZeros(fmtMicroToStx(totalStaked, sip10Data.decimals))} ${sip10Data.symbol}`, icon: LucideWallet, color: 'text-primary' }, { label: market.marketData.resolutionState >= 3 ? 'Resolved' : 'Resolves', value: market.marketType === 2 ? `BTC ${resolutionDate?.resolvesOnChain}\n~ ${resolutionDate?.resolvesOffChain}` : resolutionDate?.resolvesOffChain, icon: LucideTrendingUp, color: market.marketData.resolutionState >= 3 ? 'text-accent' : 'text-primary' }] as stat}
		<div class="bg-surface flex items-center gap-4 rounded-xl border border-purple-600/20 p-4 shadow-sm">
			<!-- <svelte:component this={stat.icon} class="h-8 w-8 {stat.color}" /> -->
			<div>
				<div class="text-secondary text-sm">{stat.label}</div>
				<div class="text-primary text-lg font-semibold whitespace-pre-line">
					{#if stat.link}
						<a href={stat.link} class="hover:underline">{stat.value}</a>
					{:else}
						{stat.value}
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>
