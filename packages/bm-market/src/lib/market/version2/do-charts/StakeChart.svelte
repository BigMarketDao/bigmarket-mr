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

  let marketStakes: Array<PredictionMarketStakeEvent> = [];
  let homepage = false;

  let sip10Data: Sip10Data;
  let series: { name: string; data: number[] }[] = [];
  //let options = {};

  // Helper function to process data
  let processStakeData = $derived((
    currency: Currency,
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

  const initializeChart = (currency: Currency) => {
    if (marketStakes && marketStakes.length > 0) {
      //let categories = mapToMinMaxStrings(market.marketData.categories);
      //let categories = (market.marketData.categories as { min: number; max: number }[]).map((item) => `${item.min},${item.max}`);
      let categories = mapToMinMaxStrings(market.marketData.categories);
      const { xAxisData, categoryData } = processStakeData(currency, marketStakes, categories);

      const maxStaked = Math.max(...Object.values(categoryData).flat()).toPrecision(3);

      // Create series data for ApexCharts

      options = {
        legend: {
          show: !homepage && !simplified,
          position: 'bottom',
          fontSize: '12px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          markers: {
            width: 6,
            height: 6,
            radius: 12,
            offsetX: -5,
            size: 5,
          },
          labels: {
            useSeriesColors: false,
            padding: 10,
            vertical: 5,
            colors: isDark ? '#444' : '#444',
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
          height: height || 'auto',
          background: 'transparent',
          style: {
            fontSize: '10px',
            color: '#444',
            foreColor: isDark ? '#444' : '#374151', // text color inside apex elements
          },
        },
        title: {
          text: '% Chances',
          align: 'center',
          style: {
            fontSize: '10px', // Adjust font size
            color: '#fff', // Custom color
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
              color: '#444',
            },
          },
          labels: {
            show: !simplified,
            style: { fontSize: '12px', colors: isDark ? '#444' : '#ccc' },
          },
        },
        yaxis: {
          title: {
            text: simplified ? '' : `Total Staked (${currency.code})`,
            style: {
              fontSize: '12px',
              color: '#444',
            },
          },
          min: 0,
          max: Number(maxStaked),
          labels: {
            show: !simplified,
            formatter: (value: number) => value.toFixed(2),
            style: { fontSize: '12px', colors: isDark ? '#444' : '#444' },
          },
        },
        grid: {
          show: !simplified,
          borderColor: isDark ? '#2d2d2d' : '#444',
          strokeDashArray: 0,
          position: 'back',
        },
        stroke: {
          curve: 'smooth',
          width: simplified ? 2 : 3,
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
          x: { show: true },
          y: {
            //formatter: (v: number) => `${v.toFixed(2)} ${$selectedCurrency.code}`
            formatter: (v: number) => `${v.toFixed(2)} ${'BIG PLAY'}`,
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
    }
  };

  let isDark = $derived(
    document.documentElement.classList.contains('dark') ||
    window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  onMount(async () => {
    if (typeof window !== 'undefined') {
      const mod = await import('svelte-apexcharts');
      chartAction = mod.default;
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
  <div
    class={height
      ? `h-[${height}px] text-gray-900 dark:text-gray-100`
      : 'h-auto text-gray-900 dark:text-gray-100'}
  >
    <div class=" z-10 text-gray-900 dark:text-gray-100" use:chart={options}></div>
  </div>
  {/if}
