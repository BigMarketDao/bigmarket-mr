<script lang="ts">
  	import { allowedTokenStore, appConfigStore, exchangeRatesStore, requireAppConfig, selectedCurrency } from '@bigmarket/bm-common';
	import type { Currency, PredictionMarketCreateEvent, PredictionMarketStakeEvent, Sip10Data } from '@bigmarket/bm-types';
  	import { convertCryptoToFiatNumber, fetchMarketStakes, fmtMicroToStxNumber, fmtRoundToNDecimalPlaces, getMarketToken, mapToMinMaxStrings } from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';
	// import { chart } from 'svelte-apexcharts';

	const { market, title, height } = $props<{
		market: PredictionMarketCreateEvent;
    title: string;
    height: number | undefined;
	}>(); 


	let chart: ((el: HTMLDivElement, opts: any) => any) | undefined = $state(undefined);	
	let options: any = $state(undefined);
	let marketStakes: Array<PredictionMarketStakeEvent> = [];

	let sip10Data: Sip10Data;

	const appConfig = $derived(requireAppConfig($appConfigStore));

	// Helper function to compute TVL per category
	const calculateTvlPerCategory = (currency: Currency, data: Array<PredictionMarketStakeEvent>, categories: string[]) => {
		let categoryTVL: Record<string, number> = {};

		// Initialize all categories with 0
		categories.forEach((category) => (categoryTVL[category] = 0));

		// Sum up all stake amounts per category
		data.forEach((event) => {
			const category = categories[event.index];
			let stakeAmount = fmtMicroToStxNumber(event.amount, sip10Data.decimals);
			stakeAmount = fmtRoundToNDecimalPlaces(stakeAmount, 2);
			categoryTVL[category] += stakeAmount;
		});
		//categoryTVL = Object.fromEntries(Object.entries(categoryTVL).map(([key, val]) => [key, Number(val.toFixed(2))]));
		categoryTVL = Object.fromEntries(Object.entries(categoryTVL).map(([key, val]) => [key, convertCryptoToFiatNumber($exchangeRatesStore, currency, (sip10Data?.decimals || 6) === 6, val)]));

		return categoryTVL;
	};

	let initializeChart = $derived((currency: Currency) => {
		if (marketStakes) {
			let categories = mapToMinMaxStrings(market.marketData.categories);
			const categoryTVL = calculateTvlPerCategory(currency, marketStakes, categories);

			// Generate data for the bar chart
			options = {
				series: [
					{
						name: 'Total Staked',
						data: Object.values(categoryTVL) // Heights of the bars (TVL)
					}
				],
				chart: {
					type: 'bar',
					toolbar: { show: false },
					zoom: { enabled: false }
				},
				title: {
					text: 'Total Value Locked (TVL)',
					align: 'center',
					style: {
						fontSize: '10px', // Adjust font size
						color: '#fff' // Custom color
					}
				},
				xaxis: {
					categories: Object.keys(categoryTVL), // Category names
					title: {
						text: 'Prediction Outcomes',
						style: {
							fontSize: '10px', // Adjust font size
							color: '#fff' // Custom color
						}
					},
					labels: {
						formatter: (value: string) => {
							return value.length > 10 ? value.slice(0, 10) + '...' : value; // Truncate long names
						},
						style: {
							fontSize: '12px',
							colors: '#fff'
						}
					}
				},
				yaxis: {
					title: {
						text: 'Total Staked (' + currency.code + ')',
						style: {
							fontSize: '12px',
							color: '#fff'
						}
					},
					labels: {
						formatter: (value: number) => value.toFixed(2),
						style: {
							fontSize: '12px',
							colors: '#fff'
						}
					}
				},
				plotOptions: {
					bar: {
						borderRadius: 4,
						horizontal: false,
						columnWidth: '50%' // Adjust width of bars
					}
				},
				tooltip: {
					y: {
						formatter: (value: number) => `${value} ${sip10Data.symbol}`
					}
				}
			};
		}
	});

	onMount(async () => {
		if (typeof window !== 'undefined') {
			const mod = await import('svelte-apexcharts');
			chart = mod.chart;
			marketStakes = await fetchMarketStakes(appConfig.VITE_BIGMARKET_API, market.marketId, market.marketType);
			sip10Data = getMarketToken(market.marketData.token, $allowedTokenStore);

			if (marketStakes) {
				initializeChart($selectedCurrency);
			}
		}
	});
</script>

{#if typeof window !== 'undefined' && options}
	{#if title}
		<h2 class="card-title mb-6 text-2xl text-gray-900 dark:text-gray-100">{title}</h2>
	{/if}
	<div class={height ? `h-[${height}px] text-gray-900 dark:text-gray-100` : 'h-auto text-gray-900 dark:text-gray-100'}>
		<div class=" z-10 text-gray-900 dark:text-gray-100" use:chart={options}></div>
	</div>

{/if}
