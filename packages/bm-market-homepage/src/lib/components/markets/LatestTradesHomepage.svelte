<script lang="ts">
	import type {
		Currency,
		ExchangeRate,
		PredictionMarketCreateEvent,
		PredictionMarketStakeEvent,
		PredictionMarketUnStakeEvent,
		TokenPermissionEvent
	} from '@bigmarket/bm-types';
	import {
		convertCryptoToFiatNumber,
		fmtMicroToStxNumber,
		formatFiat,
		getMarketToken
	} from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';

	type TradeRow = {
		index: number;
		amountMicro: number;
		wallet: string;
		sortKey: string;
	};

	const {
		market,
		bmApi,
		tokens = [],
		selectedCurrency,
		exchangeRates = [],
		onTradesLoaded
	} = $props<{
		market: PredictionMarketCreateEvent;
		bmApi: string;
		tokens?: TokenPermissionEvent[];
		selectedCurrency: Currency;
		exchangeRates?: ExchangeRate[];
		onTradesLoaded?: (info: { count: number }) => void;
	}>();

	let trades = $state<TradeRow[]>([]);
	let loaded = $state(false);

	const token = $derived(getMarketToken(market.marketData?.token ?? '', tokens));

	const shortWallet = (addr: string) => {
		if (!addr || addr.length < 5) return addr || '?';
		return `${addr.slice(0, 2)}..${addr.slice(-2)}`;
	};

	const outcomeLabel = (index: number) => {
		const cats = market.marketData?.categories ?? [];
		if (cats.length === 2) return index === 1 ? 'Yes' : 'No';
		return `Opt${index + 1}`;
	};

	const outcomeClass = (index: number) => {
		const cats = market.marketData?.categories ?? [];
		if (cats.length === 2) return index === 1 ? 'text-price-up' : 'text-price-down';
		return 'text-muted-foreground';
	};

	const formatAmount = (micro: number) => {
		const crypto = fmtMicroToStxNumber(micro, token.decimals);
		const isStx = token.symbol === 'STX';
		const fiat = convertCryptoToFiatNumber(
			exchangeRates,
			selectedCurrency,
			isStx,
			crypto
		);
		const sym = selectedCurrency.symbol ?? '';
		if (!fiat) {
			const n =
				crypto >= 100 ? crypto.toFixed(0) : crypto >= 10 ? crypto.toFixed(1) : crypto.toFixed(2);
			return `${sym}${n}`;
		}
		return `${sym}${formatFiat(selectedCurrency, fiat, true)}`;
	};

	onMount(async () => {
		if (!bmApi || market.marketId == null) {
			loaded = true;
			return;
		}
		try {
			const res = await fetch(`${bmApi}/pm/stakes/${market.marketId}/${market.marketType}`);
			if (!res.ok) {
				onTradesLoaded?.({ count: 0 });
				loaded = true;
				return;
			}
			const data = await res.json();
			const stakes = (data?.stakes ?? []) as PredictionMarketStakeEvent[];
			const unstakes = (data?.unstakes ?? []) as PredictionMarketUnStakeEvent[];

			const rows: TradeRow[] = [
				...stakes.map((s) => ({
					index: s.index,
					amountMicro: s.cost ?? s.amount ?? 0,
					wallet: s.voter,
					sortKey: `${s.txId ?? ''}:${s.event_index ?? 0}`
				})),
				...unstakes.map((u) => ({
					index: u.index,
					amountMicro: u.refund ?? 0,
					wallet: u.seller,
					sortKey: `${u.txId ?? ''}:${u.event_index ?? 0}`
				}))
			];

			rows.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
			onTradesLoaded?.({ count: rows.length });
			trades = rows.slice(0, 10);
		} catch {
			trades = [];
			onTradesLoaded?.({ count: 0 });
		} finally {
			loaded = true;
		}
	});
</script>

<section class="market-card-ticker min-h-5 w-full shrink-0 overflow-x-hidden overflow-y-visible py-0.5">
	{#if !loaded}
		<p class="font-mono text-xs leading-5 text-muted-foreground/70">Loading trades…</p>
	{:else if trades.length === 0}
		<p class="font-mono text-xs leading-5 text-muted-foreground/70">No recent trades</p>
	{:else}
		<div class="ticker-track inline-flex items-center whitespace-nowrap will-change-transform">
			{#each [0, 1] as _copy}
				{#each trades as trade (`${trade.sortKey}-${_copy}`)}
					<span class="inline-flex items-center gap-1 pr-5 font-mono text-xs leading-5 tabular-nums">
						<span class="text-muted-foreground">{shortWallet(trade.wallet)}</span>
						<span class="font-semibold {outcomeClass(trade.index)}">{outcomeLabel(trade.index)}</span>
						<span class="text-muted-foreground">{formatAmount(trade.amountMicro)}</span>
					</span>
				{/each}
			{/each}
		</div>
	{/if}
</section>

<style>
	.ticker-track {
		animation: market-ticker-scroll var(--market-ticker-duration, 48s) linear infinite;
	}

	.ticker-track:hover {
		animation-play-state: paused;
	}

	@keyframes market-ticker-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
</style>
