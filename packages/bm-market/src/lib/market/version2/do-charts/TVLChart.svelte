<script lang="ts">
  	import { allowedTokenStore, appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import type { PredictionMarketCreateEvent, PredictionMarketStakeEvent, Sip10Data } from '@bigmarket/bm-types';
  	import { fetchMarketStakes, fmtMicroToStxNumber, fmtRoundToNDecimalPlaces, getMarketToken, mapToMinMaxStrings } from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';
	// import { chart } from 'svelte-apexcharts';

	const { market, title, height } = $props<{
		market: PredictionMarketCreateEvent;
    title: string;
    height: number | undefined;
	}>(); 


	let chart: ((el: HTMLDivElement, opts: any) => any) | undefined = $state(undefined);	
	let options: any = $state(undefined);
	let marketStakes = $state<Array<PredictionMarketStakeEvent>>([]);

	let sip10Data!: Sip10Data;

	const appConfig = $derived(requireAppConfig($appConfigStore));

	// Human-readable token amounts per category (not fiat — avoids empty chart when rates load late or return 0)
	const calculateTvlPerCategory = (data: Array<PredictionMarketStakeEvent>, categories: string[]) => {
		let categoryTVL: Record<string, number> = {};

		categories.forEach((category) => (categoryTVL[category] = 0));

		data.forEach((event) => {
			const category = categories[event.index];
			let stakeAmount = fmtMicroToStxNumber(event.amount, sip10Data.decimals);
			stakeAmount = fmtRoundToNDecimalPlaces(stakeAmount, 2);
			categoryTVL[category] += stakeAmount;
		});

		return categoryTVL;
	};

	function initializeChart() {
		if (!sip10Data) return;
		let categories = mapToMinMaxStrings(market.marketData.categories);

		let categoryTVL: Record<string, number>;
		if (marketStakes.length > 0) {
			categoryTVL = calculateTvlPerCategory(marketStakes, categories);
		} else {
			categoryTVL = {};
			categories.forEach((category, i) => {
				const tokensMicro = market.marketData.stakeTokens?.[i] ?? 0;
				const stakeAmt = fmtMicroToStxNumber(tokensMicro, sip10Data.decimals);
				categoryTVL[category] = fmtRoundToNDecimalPlaces(stakeAmt, 2);
			});
		}

			const vals = Object.values(categoryTVL);
			const maxY = Math.max(...vals, 1);

			// Generate data for the bar chart
			options = {
				series: [
					{
						name: 'Total staked',
						data: vals
					}
				],
				colors: ['#ea580c'],
				theme: { mode: 'light' },
				chart: {
					type: 'bar',
					toolbar: { show: false },
					zoom: { enabled: false },
					background: 'transparent',
					foreColor: '#374151',
					fontFamily: 'inherit'
				},
				title: {
					text: 'Total Value Locked (TVL)',
					align: 'center',
					style: {
						fontSize: '11px',
						color: '#374151'
					}
				},
				xaxis: {
					categories: Object.keys(categoryTVL),
					title: {
						text: 'Prediction Outcomes',
						style: {
							fontSize: '10px',
							color: '#6b7280'
						}
					},
					labels: {
						formatter: (value: string) => {
							return value.length > 10 ? value.slice(0, 10) + '...' : value;
						},
						style: {
							fontSize: '11px',
							colors: '#4b5563'
						}
					}
				},
				yaxis: {
					max: maxY * 1.05,
					min: 0,
					title: {
						text: `Staked (${sip10Data.symbol})`,
						style: {
							fontSize: '12px',
							color: '#6b7280'
						}
					},
					labels: {
						formatter: (value: number) => value.toFixed(2),
						style: {
							fontSize: '11px',
							colors: '#4b5563'
						}
					}
				},
				plotOptions: {
					bar: {
						borderRadius: 4,
						horizontal: false,
						columnWidth: '55%',
						dataLabels: { position: 'top' }
					}
				},
				dataLabels: {
					enabled: true,
					offsetY: -18,
					style: { fontSize: '10px', colors: ['#374151'] },
					formatter: (val: number) => (val > 0 ? val.toFixed(1) : '')
				},
				tooltip: {
					y: {
						formatter: (value: number) =>
							`${value.toFixed(4)} ${sip10Data.symbol}`
					}
				}
			};
	}

	onMount(async () => {
			const mod = await import('svelte-apexcharts');
			chart = mod.chart;
			marketStakes = await fetchMarketStakes(appConfig.VITE_BIGMARKET_API, market.marketId, market.marketType);
			sip10Data = getMarketToken(market.marketData.token, $allowedTokenStore);
			initializeChart();
	});
</script>

{#if typeof window !== 'undefined' && options}
	{#if title}
		<h2 class="card-title mb-6 text-2xl text-gray-900 dark:text-gray-100">{title}</h2>
	{/if}
	{#if chart}
	<div
		class="min-h-[220px] text-gray-900 dark:text-gray-100"
		style={height != null ? `min-height:${height}px` : undefined}
	>
		<div class=" z-10 min-h-[200px] text-gray-900 dark:text-gray-100" use:chart={options}></div>
	</div>
	{/if}
{/if}
