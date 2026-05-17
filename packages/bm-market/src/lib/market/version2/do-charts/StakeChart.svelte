<script lang="ts">
  import { allowedTokenStore, appConfigStore, requireAppConfig, selectedCurrency } from '@bigmarket/bm-common';
  import type {
  Currency,
    PredictionMarketCreateEvent,
    PredictionMarketStakeEvent,
    ScalarMarketDataItem,
    Sip10Data,
  } from '@bigmarket/bm-types';
  import { fetchMarketStakes, fmtMicroToStxNumber, getMarketToken } from '@bigmarket/bm-utilities';
  import { onMount } from 'svelte';
  let options: any = $state(undefined);
  let chartAction: any = $state(undefined);
	let chart: ((el: HTMLDivElement, opts: any) => any) | undefined = $state(undefined);	
	const appConfig = $derived(requireAppConfig($appConfigStore));

  const { market, title, simplified, height } = $props<{
		market: PredictionMarketCreateEvent;
    title: string;
    simplified: boolean;
    height: number | undefined;
	}>();

  let marketStakes = $state<Array<PredictionMarketStakeEvent>>([]);
  let homepage = false;

  let sip10Data!: Sip10Data;
  let series: { name: string; data: number[] }[] = [];
  //let options = {};

  // Helper function to process data
  let processStakeData = $derived((
    data: Array<PredictionMarketStakeEvent>,
    categories: string[],
  ) => {
    const xAxisData = Array.from({ length: data.length }, (_, i) => i + 1);
    const categoryData: Record<string, number[]> = {};

    // Initialize arrays for each category
    categories.forEach((category) => (categoryData[category] = new Array(data.length).fill(0)));

    // Accumulate stake data
    data.forEach((event, index) => {
      categories.forEach((category) => {
        const previousValue = index > 0 ? categoryData[category][index - 1] : 0;
        const stakeAmount = fmtMicroToStxNumber(event.cost, sip10Data.decimals);
        const stakeAmountFiat = stakeAmount; //convertCryptoToFiatNumber(currency, (sip10Data?.decimals || 6) === 6, stakeAmount);
        const cate = categories[event.index];
        categoryData[category][index] =
          previousValue + (cate === category ? Number(stakeAmountFiat) : 0);
      });
    });

    return { xAxisData, categoryData };
  });

  function mapToMinMaxStrings(data: Array<string | ScalarMarketDataItem>): string[] {
    if (typeof data[0] === 'string') {
      return data as string[]; // Directly return if already an array of strings
    }
    return (data as { min: number; max: number }[]).map((item, index) => `Range ${index}`);
  }

  const SERIES_COLOR_VARS = [
    '--color-outcome-1',
    '--color-outcome-2',
    '--color-outcome-3',
    '--color-outcome-4',
    '--color-warning',
    '--color-info',
    '--color-community',
    '--color-info',
    '--color-primary',
    '--color-success',
  ] as const;

  function chartColor(cssVar: string): string {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  }

  function seriesColors(count: number): string[] {
    return SERIES_COLOR_VARS.slice(0, Math.max(count, 1)).map((v) => chartColor(v));
  }

  function chartChromeColors() {
    return {
      border: chartColor('--color-border'),
      mutedForeground: chartColor('--color-muted-foreground'),
    };
  }

  /** Snapshot when API returns [] — plot pool depth per outcome in native token units */
  function initializeSnapshotChart(): void {
    const chrome = chartChromeColors();
    const categories = mapToMinMaxStrings(market.marketData.categories);
    const stakeTokens = market.marketData.stakeTokens ?? [];
    const series = categories.map((category, idx) => {
      const tokensMicro = stakeTokens[idx] ?? 0;
      const human = fmtMicroToStxNumber(tokensMicro, sip10Data.decimals);
      return { name: category, data: [human] };
    });
    const flat = series.flatMap((s) => s.data);
    const maxNum = Math.max(...flat, 1e-12);

    options = {
      colors: seriesColors(series.length),
      theme: { mode: 'light' },
      legend: {
        show: !homepage && !simplified,
        position: 'bottom',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'inherit',
        markers: {
          width: 6,
          height: 6,
          radius: 12,
          offsetX: -5,
          size: 5,
        },
        labels: {
          useSeriesColors: true,
          padding: 10,
          vertical: 5,
          colors: chrome.border,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
        onItemClick: {
          toggleDataSeries: true,
        },
        onItemHover: {
          highlightDataSeries: true,
        },
      },
      series,
      chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        height: height || 280,
        background: 'transparent',
        foreColor: chrome.border,
        fontFamily: 'inherit',
      },
      title: {
        text: 'Pool depth by outcome (current)',
        align: 'center',
        style: {
          fontSize: '11px',
          color: chrome.border,
        },
      },
      markers: {
        size: 5,
        strokeWidth: 2,
        hover: { size: 7 },
      },
      xaxis: {
        categories: ['Current'],
        type: 'category',
        title: {
          text: '',
          style: {
            fontSize: '10px',
            color: chrome.mutedForeground,
          },
        },
        labels: {
          show: !simplified,
          style: { fontSize: '12px', colors: chrome.border },
        },
      },
      yaxis: {
        title: {
          text: simplified ? '' : `Tokens (${sip10Data.symbol})`,
          style: {
            fontSize: '12px',
            color: chrome.mutedForeground,
          },
        },
        min: 0,
        max: maxNum * 1.05,
        labels: {
          show: !simplified,
          formatter: (value: number) => value.toFixed(2),
          style: { fontSize: '12px', colors: chrome.border },
        },
      },
      grid: {
        show: !simplified,
        borderColor: chrome.border,
        strokeDashArray: 0,
        position: 'back',
      },
      stroke: {
        curve: 'smooth',
        width: simplified ? 2 : 3,
      },
      tooltip: {
        theme: 'light',
        x: { show: true },
        y: {
          formatter: (v: number) => `${v.toFixed(4)} ${sip10Data.symbol}`,
        },
        style: {
          fontSize: '12px',
        },
      },
    };
  }

  const initializeChart = () => {
    if (!sip10Data) return;

    if (marketStakes.length > 0) {
      const chrome = chartChromeColors();
      //let categories = mapToMinMaxStrings(market.marketData.categories);
      //let categories = (market.marketData.categories as { min: number; max: number }[]).map((item) => `${item.min},${item.max}`);
      let categories = mapToMinMaxStrings(market.marketData.categories);
      const { xAxisData, categoryData } = processStakeData(marketStakes, categories);

      const maxNum = Math.max(...Object.values(categoryData).flat(), 1e-12);

      options = {
        colors: seriesColors(categories.length),
        theme: { mode: 'light' },
        legend: {
          show: !homepage && !simplified,
          position: 'bottom',
          fontSize: '12px',
          fontWeight: 'bold',
          fontFamily: 'inherit',
          markers: {
            width: 6,
            height: 6,
            radius: 12,
            offsetX: -5,
            size: 5,
          },
          labels: {
            useSeriesColors: true,
            padding: 10,
            vertical: 5,
            colors: chrome.border,
          },
          itemMargin: {
            horizontal: 10,
            vertical: 5,
          },
          onItemClick: {
            toggleDataSeries: true,
          },
          onItemHover: {
            highlightDataSeries: true,
          },
        },
        series: categories.map((category) => {
          return {
            name: category,
            data: categoryData[category],
          };
        }),
        chart: {
          type: 'line',
          toolbar: { show: false },
          zoom: { enabled: !simplified },
          height: height || 280,
          background: 'transparent',
          foreColor: chrome.border,
          fontFamily: 'inherit',
        },
        title: {
          text: 'Stake history (cumulative, native token)',
          align: 'center',
          style: {
            fontSize: '11px',
            color: chrome.border,
          },
        },
        // tooltip: {
        // 	enabled: true,
        // 	y: {
        // 		formatter: (value: any) => `${value} ${sip10Data.symbol}`
        // 	}
        // },
        xaxis: {
          categories: marketStakes.map((o, index) => index),
          type: 'category',
          title: {
            text: '',
            style: {
              fontSize: '10px',
              color: chrome.mutedForeground,
            },
          },
          labels: {
            show: !simplified,
            style: { fontSize: '12px', colors: chrome.border },
          },
        },
        yaxis: {
          title: {
            text: simplified ? '' : `Cumulative (${sip10Data.symbol})`,
            style: {
              fontSize: '12px',
              color: chrome.mutedForeground,
            },
          },
          min: 0,
          max: maxNum * 1.05,
          labels: {
            show: !simplified,
            formatter: (value: number) => value.toFixed(2),
            style: { fontSize: '12px', colors: chrome.border },
          },
        },
        grid: {
          show: !simplified,
          borderColor: chrome.border,
          strokeDashArray: 0,
          position: 'back',
        },
        markers: {
          size: 0,
          hover: { size: 5 },
        },
        stroke: {
          curve: 'smooth',
          width: simplified ? 2 : 3,
        },
        tooltip: {
          theme: 'light',
          x: { show: true },
          y: {
            formatter: (v: number) => `${v.toFixed(4)} ${sip10Data.symbol}`,
          },
          style: {
            fontSize: '12px',
          },
        },

        // stroke: { curve: 'smooth' },
        // fill: {
        // 	type: 'gradient',
        // 	gradient: {
        // 		shade: 'light',
        // 		type: 'vertical',
        // 		shadeIntensity: 0.25,
        // 		gradientToColors: undefined,
        // 		inverseColors: false,
        // 		opacityFrom: 0.5,
        // 		opacityTo: 0,
        // 		stops: [0, 100]
        // 	}
        // }
      };
    } else if ((market.marketData.stakeTokens ?? []).some((t: number) => Number(t) > 0)) {
      initializeSnapshotChart();
    }
  };

  onMount(async () => {
    if (typeof window !== 'undefined') {
      console.log('initializeChart: selectedCurrency: ', $selectedCurrency);
      console.log('initializeChart: marketData: ', market.marketData);
      const mod = await import('svelte-apexcharts');
      chartAction = mod.default;
      chart = mod.chart;

      marketStakes = await fetchMarketStakes(appConfig.VITE_BIGMARKET_API, market.marketId, market.marketType);
      sip10Data = getMarketToken(market.marketData.token, $allowedTokenStore);
      initializeChart();
    }
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
