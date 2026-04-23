<script lang="ts">
	import type { Currency, MarketCategory, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import CategoryButton from './CategoryButton.svelte';
	import { SearchState } from '../core/app/filtering';
	import { categoryStateStore, marketStateStore, marketTypeStore, searchStateStore, searchTypeStore, sortStateStore } from '../stores/filterStore';
	import { getMarketStatus, totalPoolSum } from '@bigmarket/bm-utilities';
	import { ChevronDown, Search, XIcon } from 'lucide-svelte';
  import MarketEntry from './markets/MarketEntry.svelte';

	const { markets, marketCategories, selectedCurrency, currentBurnHeight, disputeWindowLength, marketVotingDuration } = $props<{
		markets: Array<PredictionMarketCreateEvent>;
		marketCategories: Array<MarketCategory>;
		selectedCurrency: Currency;
		currentBurnHeight: number;
		disputeWindowLength: number;
		marketVotingDuration: number;
	}>();

	let filteredMarkets: Array<PredictionMarketCreateEvent> = $state([]);

	let localMarketStatus: string = $state('all');
	let localMarketType: string = $state('all types');
	let searchTerm = $state('');
	let debouncedSearchTerm = $state(''); 
	let debounceHandle: any = $state(null);
	let componentKey = $state(0);
	let sortBy: 'ending-soon' | 'newest' | 'tvl' | 'outcomes' = $state('ending-soon');

	const searchStateLabels: Record<SearchState, string> = {
		[SearchState.All]: 'All Markets',
		[SearchState.Open]: 'Open Markets',
		[SearchState.Resolving]: 'Resolving Markets',
		[SearchState.Disputed]: 'Disputed Markets',
		[SearchState.Pending]: 'Pending Resolution',
		[SearchState.Cooling]: 'Cooling Markets',
		[SearchState.Closed]: 'Closed Markets'
	};
	let searchState:SearchState = $state($marketStateStore as SearchState);

	let marketTypes = [
		{ name: 'All types', value: 'all types' },
		{ name: 'Yes/No', value: 'binary' },
		{ name: 'Multiple Choice', value: 'multiple' },
		{ name: 'Scalar', value: 'scalar' }
	];

	// Debounce search for smoother UX
	$effect(() => {
		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(() => {
			debouncedSearchTerm = searchTerm;
		}, 200);
	});

	// Sort helpers
	const closeBlock = (m: PredictionMarketCreateEvent) =>
		(m?.marketData?.marketStart || 0) + (m?.marketData?.marketDuration || 0);
	const createdAt = (m: PredictionMarketCreateEvent) => m?.unhashedData?.createdAt || 0;
	let sortComparator = $state((a: PredictionMarketCreateEvent, b: PredictionMarketCreateEvent) => {
		if ($sortStateStore === 'ending-soon') return closeBlock(a) - closeBlock(b);
		if ($sortStateStore === 'newest') return createdAt(b) - createdAt(a);
		if ($sortStateStore === 'tvl')
			return totalPoolSum(b.marketData.stakes) - totalPoolSum(a.marketData.stakes);
		if ($sortStateStore === 'outcomes')
			return (b.marketData.categories?.length || 0) - (a.marketData.categories?.length || 0);
		return 0;
	}); 

	$effect(() => {
		filteredMarkets = markets
			.filter((market: PredictionMarketCreateEvent) => {
				let matchesSearch = true;
				if (searchTerm && searchTerm.length > 0) {
					const needle = debouncedSearchTerm.trim().toLowerCase();
					matchesSearch =
						needle === '' ||
						market.unhashedData.name.toLowerCase().includes(needle) ||
						market.unhashedData.description.toLowerCase().includes(needle) ||
						market.unhashedData.category?.toLowerCase().includes(needle);
				}

				//let isAll = $searchState === 'all';
				//if (isAll) return true;

				const matchesCategory =
					$categoryStateStore === 'all' ||
					($categoryStateStore &&
						(market.unhashedData.category || '').toLowerCase() === $categoryStateStore.toLowerCase());
				const matchesMarketState = doesMatchState(market, $marketStateStore);
				const matchesType = doesMatchType(market, $marketTypeStore);

				return matchesSearch && matchesCategory && matchesMarketState && matchesType;
			})
			.sort(sortComparator);
	});

	const handleAll = () => {
		marketStateStore.set('all');
		marketTypeStore.set('all');
		categoryStateStore.set('all');
		searchStateStore.set('all');
	};

	const handleChangeCategory = (searchStateLabel: string) => {
		searchStateStore.set(searchStateLabel);
		categoryStateStore.set(searchStateLabel);
	};

	const updateMarketStatus = () => {
		searchStateStore.set('all');
		marketStateStore.set(localMarketStatus);
		componentKey++;
	};

	const updateSortState = (sortby: 'ending-soon' | 'newest' | 'tvl' | 'outcomes') => {
		sortStateStore.set(sortby);
		componentKey++;
	};

	const updateMarketType = (localMarketTypeInt: string) => {
		searchStateStore.set('all');
		marketTypeStore.set(localMarketTypeInt);
		componentKey++;
	};

	const doesMatchState = (market: PredictionMarketCreateEvent, marketState: string) => {
		if (marketState === 'all') return true;
		return marketState === getMarketStatus(currentBurnHeight, market);
	};

	const doesMatchType = (market: PredictionMarketCreateEvent, marketType: string) => {
		if (marketType === 'all') return true;
		if (marketType === 'scalar') return market.marketType === 2;
		if (marketType === 'bitcoin') return market.marketType === 3;
		if (marketType === 'binary') return market.marketData.categories.length === 2;
		if (marketType === 'multiple')
			return market.marketType === 1 && market.marketData.categories.length > 2;
		return true; //throw new Error('Unknown market type');
	};

	onMount(async () => {
		// Initialize local UI state from global stores for proper default selection
		searchStateStore.set('all');
		marketStateStore.set('open');
		categoryStateStore.set('all');
		marketTypeStore.set('all');
		filteredMarkets = markets;
	});
</script>

<!-- Filter Section with improved spacing -->
<div class="space-y-4">
	<!-- Row 1: Primary category tabs -->
	<div class="overflow-x-auto">
		<nav class="inline-flex items-center gap-5 whitespace-nowrap">
			{#key componentKey}
				<CategoryButton label="tvl" active={$searchStateStore} onChangeCategory={updateSortState}>
					<div slot="body">
						<span class="inline-flex items-center gap-1.5">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="h-4 w-4"
							>
								<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
								<polyline points="17 6 23 6 23 12"></polyline>
							</svg>
							Trending
						</span>
					</div>
				</CategoryButton>
				<CategoryButton label="newest" active={$searchStateStore} onChangeCategory={updateSortState}
					><div slot="body">New</div></CategoryButton
				>
				<CategoryButton label="all" active={$searchStateStore} onChangeCategory={handleAll}
					><div slot="body">{searchStateLabels[searchState]}</div></CategoryButton
				>
				{#each marketCategories as category}
					{#if category.active}<CategoryButton
							label={category.name}
							active={$categoryStateStore}
							onChangeCategory={handleChangeCategory}
							><div slot="body">{category.displayName}</div></CategoryButton
						>{/if}
				{/each}
			{/key}
		</nav>
	</div>

	<!-- Divider -->
	<div class="h-px w-full bg-gray-200 dark:bg-gray-800"></div>

	<!-- Row 2: Search + dropdowns + results counter -->
	<div class="space-y-3">
		<!-- Search and filters container with grid alignment -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
			<!-- Search input that matches first card column width -->
			<div class="relative col-span-1">
				<label for="searchTerm" class="sr-only">Search</label>
				<input
					id="searchTerm"
					type="text"
					bind:value={searchTerm}
					placeholder="Search markets..."
					class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-600"
				/>
				<Search
					class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
				/>
				{#if searchTerm}
					<button
						type="button"
						aria-label="Clear search"
						onclick={() => (searchTerm = '')}
						class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none dark:hover:bg-gray-800"
					>
						<XIcon class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>

			<!-- Filters in remaining columns -->
			<div class="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3">
				<div
					class="flex items-center gap-6 text-xs font-normal text-gray-500 md:text-sm dark:text-gray-400"
				>
					<!-- Sort by -->
					<div class="relative">
						<select
							bind:value={sortBy}
							onchange={() => updateSortState(sortBy)}
							class="appearance-none bg-transparent px-2 py-1 pr-6 text-xs text-gray-600 hover:text-gray-800 focus:text-gray-800 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200 dark:focus:text-gray-200"
						>
							<option value="ending-soon">Ending soon</option>
							<option value="newest">Newest</option>
							<option value="tvl">TVL</option>
							<option value="outcomes">Most outcomes</option>
						</select>
						<ChevronDown
							class="pointer-events-none absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 text-gray-400"
						/>
					</div>

					<!-- Status -->
					<div class="relative">
						<select
							bind:value={localMarketStatus}
							onchange={updateMarketStatus}
							class="appearance-none bg-transparent px-2 py-1 pr-6 text-xs text-gray-600 hover:text-gray-800 focus:text-gray-800 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200 dark:focus:text-gray-200"
						>
							<option value="all" selected={$marketStateStore === 'all'}>All Markets</option>
							<option value="open" selected={$marketStateStore === 'open'}>Open Markets</option>
							<option value="resolving" selected={$marketStateStore === 'resolving'}>Resolving</option>
							<option value="disputed" selected={$marketStateStore === 'disputed'}>Disputed</option>
							<option value="pending" selected={$marketStateStore === 'pending'}>Pending</option>
							<option value="cooling" selected={$marketStateStore === 'cooling'}>Cooling</option>
							<option value="resolved" selected={$marketStateStore === 'resolved'}>Closed</option>
						</select>
						<ChevronDown
							class="pointer-events-none absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 text-gray-400"
						/>
					</div>

					<!-- Type -->
					<div class="relative">
						<select
							bind:value={localMarketType}
							onchange={() => updateMarketType(localMarketType)}
							class="appearance-none bg-transparent px-2 py-1 pr-6 text-xs text-gray-600 hover:text-gray-800 focus:text-gray-800 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200 dark:focus:text-gray-200"
						>
							{#each marketTypes as marketType}
								<option value={marketType.value}>{marketType.name}</option>
							{/each}

							<!-- <option value="all types">All types</option>
							<option value="boolean">Yes/No</option>
							<option value="multiple">Multiple Choice</option> -->
						</select>
						<ChevronDown
							class="pointer-events-none absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 text-gray-400"
						/>
					</div>

					<!-- Vertical divider -->
					<div class="h-5 w-px bg-gray-300 dark:bg-gray-600"></div>

					<!-- Results counter -->
					<div class="text-xs font-medium text-gray-600 md:text-sm dark:text-gray-400">
						{filteredMarkets.length} of {markets.length} Markets
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Market Grid with enhanced spacing -->
{#key componentKey}
	{#if filteredMarkets && filteredMarkets.length > 0}
		<div
			class="mt-4 grid gap-4 sm:grid-cols-2 md:mt-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
		>
			{#each filteredMarkets as market}
				<MarketEntry {market} {marketCategories} {selectedCurrency} {currentBurnHeight} {disputeWindowLength} {marketVotingDuration} />
			{/each}
		</div>
	{:else}
		<div
			class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mx-auto max-w-sm">
				<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No markets found</h3>
				<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
					Try adjusting your filters or search terms to find more markets.
				</p>
				<button
					onclick={() => {
						searchTerm = '';
						marketStateStore.set('all');
						marketTypeStore.set('all');
						searchStateStore.set('all');
						searchTypeStore.set('all');
					}}
					class="mt-4 inline-flex items-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					Clear all filters
				</button>
			</div>
		</div>
	{/if}
{/key}
