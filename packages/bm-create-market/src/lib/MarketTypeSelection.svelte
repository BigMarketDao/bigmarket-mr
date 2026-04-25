<script lang="ts">
  import {
    type StoredOpinionPoll,
    type MarketCategoricalOption,
    type ScalarMarketDataItem,
  } from '@bigmarket/bm-types';
  import { onMount } from 'svelte';
  import { Plus, X } from 'lucide-svelte';
  import type { ValidationResult } from './app/validation';
  import { chainStore } from '@bigmarket/bm-common';
  import { MARKET_BINARY_OPTION } from '@bigmarket/bm-utilities';

  const { template, validation, onFeedChange, testIdPrefix = 'market-mgt:martypesel' } = $props<{
		template: StoredOpinionPoll;
		validation: ValidationResult;
    onFeedChange: () => void;
    testIdPrefix: string;
 }>();

  let marketTypeInternal: 'binary' | 'categories' | 'scalars' = $state('categories');

  const marketTypes = [
    { label: 'Binary Market - for or against', value: 'binary' },
    { label: 'Categorical Market - multiple options', value: 'categories' },
    { label: 'Scalar Market - preset price ranges', value: 'scalars' },
  ];

  const priceFeedOptions = [
    {
      label: 'STX/USD',
      value: '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17',
    },
    {
      label: 'BTC/USD',
      value: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    },
    {
      label: 'SOL/USD',
      value: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    },
    {
      label: 'ETH/USD',
      value: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    },
    {
      label: 'SUI/USD',
      value: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
    },
    {
      label: 'TON/USD',
      value: '0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026',
    },
  ];

  function syncMarketTypeInternal() {
    if (template.marketType === 2) {
      marketTypeInternal = 'scalars';
    } else if (template.marketType === 1) {
      marketTypeInternal =
        template.marketTypeDataCategorical?.length === 2 ? 'binary' : 'categories';
    }
  }

  function changeMarketType(e: Event) {
    const value = (e.target as HTMLSelectElement).value as typeof marketTypeInternal;
    marketTypeInternal = value;

    if (value === 'binary') {
      template.marketType = 1;
      template.marketTypeDataCategorical = [...MARKET_BINARY_OPTION];
      template.priceFeedId = undefined;
      template.marketTypeDataScalar = [];
    } else if (value === 'categories') {
      template.marketType = 1;
      if (!template.marketTypeDataCategorical || template.marketTypeDataCategorical.length < 3) {
        template.marketTypeDataCategorical = [
          { label: 'Option 1' },
          { label: 'Option 2' },
          { label: 'Option 3' },
        ];
      }
      template.priceFeedId = undefined;
      template.marketTypeDataScalar = [];
    } else if (value === 'scalars') {
      template.marketType = 2;
      template.marketTypeDataCategorical = [];
      template.marketTypeDataScalar =
        template.marketTypeDataScalar?.length || 0 > 0
          ? template.marketTypeDataScalar
          : [
              { min: 0.4, max: 0.6 },
              { min: 0.6, max: 0.8 },
              { min: 0.8, max: 1.0 },
              { min: 1.0, max: 1.2 },
            ];
    }
  }

  function changeCategoryLabel(index: number, value: string) {
    if (template.marketTypeDataCategorical) {
      template.marketTypeDataCategorical = template.marketTypeDataCategorical.map((option: MarketCategoricalOption, i: number) =>
        i === index ? { ...option, label: value } : option,
      );
    }
  }

  function addOption() {
    if (!template.marketTypeDataCategorical) template.marketTypeDataCategorical = [];
    template.marketTypeDataCategorical = [
      ...template.marketTypeDataCategorical,
      { label: `Option ${template.marketTypeDataCategorical.length + 1}` },
    ];
  }

  function removeOption(index: number) {
    if (template.marketTypeDataCategorical && template.marketTypeDataCategorical.length > 3) {
      template.marketTypeDataCategorical = template.marketTypeDataCategorical.filter(
        (_: MarketCategoricalOption, i: number) => i !== index,
      );
    }
  }

  function changePriceFeedId(e: Event) {
    template.priceFeedId = (e.target as HTMLSelectElement).value;
    onFeedChange();
  }

  onMount(() => {
    syncMarketTypeInternal();
  });
</script>

{#if $chainStore.stacks?.burn_block_height !== undefined}
  <div data-testid={`${testIdPrefix}:ready`} class="hidden"></div>
{/if}

<div class="space-y-6">
  <div class="space-y-6">
    <label for="market-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Market Type
    </label>
    <div class="mt-1">
      <select
        id="market-type"
        class="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
               shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
               focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white
               dark:placeholder-gray-400"
        bind:value={marketTypeInternal}
        onchange={changeMarketType}
      >
        {#each marketTypes as type}
          <option value={type.value}>{type.label}</option>
        {/each}
      </select>
    </div>
    {#if validation.errors.marketType}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.marketType}</p>
    {/if}
    {#if validation.errors.options}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.options}</p>
    {/if}
  </div>

  {#if marketTypeInternal === 'scalars'}
    <div class="space-y-6">
      <div class="space-y-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          The price ranges are determined in the contract during market creation:
        </p>
        <ul class="text-sm text-gray-500 dark:text-gray-400">
          <li>1. The contract reads the current price from the Pyth oracle</li>
          <li>2. For each feed the contract has a set of price-band-widths (set by DAO)</li>
          <li>
            3. The price-band-widths are used to determine the ranges either side of the current
            price
          </li>
        </ul>
        <label for="price-feed" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Price Feed
        </label>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          See
          <a
            href="https://www.pyth.network/price-feeds"
            target="_blank"
            class="text-orange-500 hover:text-orange-600">pyth-oracle</a
          >
          for supported pairs
        </p>
        <select
          id="price-feed"
          class="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
	               text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
	               focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white
	               dark:placeholder-gray-400"
          bind:value={template.priceFeedId}
          onchange={changePriceFeedId}
        >
          {#each priceFeedOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        {#if validation.errors.priceFeed}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.priceFeed}</p>
        {/if}
      </div>

      <!-- <div>
				<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Scalar Ranges</h4>
				<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Define value ranges for resolution</p>

				<div class="space-y-2">
					{#if !template.marketTypeDataScalar}
						No ranges found
					{:else}
						{#each template.marketTypeDataScalar || [] as range, i}
							<div class="flex items-center gap-2">
								<input
									type="number"
									class="block w-1/2 rounded border border-gray-300 bg-white px-2 py-1 text-sm
							       text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
							       focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
									placeholder="Min"
									bind:value={template.marketTypeDataScalar[i].min}
									step="any"
								/>
								<input
									type="number"
									class="block w-1/2 rounded border border-gray-300 bg-white px-2 py-1 text-sm
							       text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
							       focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
									placeholder="Max"
									bind:value={template.marketTypeDataScalar[i].max}
									step="any"
								/>
								<button
									type="button"
									class="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
									on:click={() => {
										template.marketTypeDataScalar = template.marketTypeDataScalar!.filter((_, j) => j !== i);
									}}
									disabled={(template.marketTypeDataScalar?.length || 0) <= 1}
								>
									Remove
								</button>
							</div>
						{/each}
					{/if}
				</div>

				<div class="mt-2 flex gap-2">
					<button
						type="button"
						class="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
						on:click={() => {
							const current = template.marketTypeDataScalar || [];
							const last = current.at(-1);
							const nextMin = last ? last.max : 0;
							template.marketTypeDataScalar = [...current, { min: nextMin, max: nextMin + 1 }];
						}}
					>
						+ Add Range
					</button>
				</div>

				{#if validation.errors.ranges}
					<p class="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.ranges}</p>
				{/if}
			</div> -->
    </div>
  {:else if marketTypeInternal === 'categories'}
    <div>
      <h3 id="choices-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Define Choices
      </h3>
      <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
        Add multiple choices for users to select from - minimum three
      </p>

      <div class="mt-3 space-y-3">
        {#each template.marketTypeDataCategorical! as option, index}
          <div class="flex items-center gap-2">
            <input
              type="text"
              class="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
                     text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
                     focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white
                     dark:placeholder-gray-400"
              placeholder="Option text..."
              value={option.label}
              oninput={(e) => changeCategoryLabel(index, (e.target as HTMLInputElement).value)}
              aria-labelledby="choices-label"
            />
            <button
              type="button"
              class="inline-flex items-center rounded-lg border border-gray-300 bg-white p-2 text-sm
                     text-gray-500 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-orange-500/50
                     focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800
                     dark:text-gray-400 dark:hover:bg-gray-700"
              onclick={() => removeOption(index)}
              disabled={template.marketTypeDataCategorical!.length <= 3}
              aria-label="Remove option"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        {/each}

        <button
          type="button"
          class="mt-2 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-orange-500/50
                 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300
                 dark:hover:bg-gray-700"
          onclick={addOption}
        >
          <Plus class="mr-2 -ml-1 h-4 w-4" />
          Add Option
        </button>
      </div>
    </div>
  {/if}
</div>
