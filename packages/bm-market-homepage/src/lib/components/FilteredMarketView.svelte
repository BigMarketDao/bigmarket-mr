<script lang="ts">
	import type { Currency, MarketCategory, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import { fromStore } from 'svelte/store';
	import CategoryButton from './markets/CategoryButton.svelte';
	import { getMarketStatus, totalPoolSum } from '@bigmarket/bm-utilities';
	import { Search, TrendingUp, XIcon } from 'lucide-svelte';
	import FilterSelect from './markets/FilterSelect.svelte';
	import MarketEntry from './markets/MarketEntry.svelte';
	import { SearchState } from '../core/app/filtering';
	import {
		categoryStateStore,
		marketStateStore,
		marketTypeStore,
		searchStateStore,
		searchTypeStore,
		sortStateStore
	} from '../stores/filterStore';

	const categoryS = fromStore(categoryStateStore);
	const marketStateS = fromStore(marketStateStore);
	const marketTypeS = fromStore(marketTypeStore);
	const sortStateS = fromStore(sortStateStore);

	const {
		markets,
		marketCategories,
		selectedCurrency,
		currentBurnHeight,
		disputeWindowLength,
		marketVotingDuration,
		forumApi,
		isCoordinator
	} = $props<{
		markets: Array<PredictionMarketCreateEvent>;
		marketCategories: Array<MarketCategory>;
		selectedCurrency: Currency;
		currentBurnHeight: number;
		disputeWindowLength: number;
		marketVotingDuration: number;
		forumApi: string;
		isCoordinator: boolean;
	}>();

	let localMarketStatus: string = $state('all');
	let localMarketType: string = $state('all types');
	let searchTerm = $state('');
	let debouncedSearchTerm = $state('');
	let componentKey = $state(0);
	let sortBy: string = $state('ending-soon');

	const searchStateLabels: Record<SearchState, string> = {
		[SearchState.All]: 'All Markets',
		[SearchState.Open]: 'Open Markets',
		[SearchState.Resolving]: 'Resolving Markets',
		[SearchState.Disputed]: 'Disputed Markets',
		[SearchState.Pending]: 'Pending Resolution',
		[SearchState.Cooling]: 'Cooling Markets',
		[SearchState.Closed]: 'Closed Markets'
	};
	const searchState = $derived(marketStateS.current as SearchState);

	let marketTypes = [
		{ name: 'All types', value: 'all types' },
		{ name: 'Yes/No', value: 'binary' },
		{ name: 'Multiple Choice', value: 'multiple' },
		{ name: 'Scalar', value: 'scalar' }
	];

	const sortOptions = [
		{ value: 'ending-soon', label: 'Ending soon' },
		{ value: 'newest', label: 'Newest' },
		{ value: 'tvl', label: 'TVL' },
		{ value: 'outcomes', label: 'Most outcomes' }
	];

	const statusOptions = [
		{ value: 'all', label: 'All Markets' },
		{ value: 'open', label: 'Open Markets' },
		{ value: 'resolving', label: 'Resolving' },
		{ value: 'disputed', label: 'Disputed' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'cooling', label: 'Cooling' },
		{ value: 'resolved', label: 'Closed' }
	];

	// Debounce search for smoother UX (timeout id must not be $state — effect reads it and would re-run forever)
	$effect(() => {
		const id = setTimeout(() => {
			debouncedSearchTerm = searchTerm;
		}, 200);
		return () => clearTimeout(id);
	});

	// Sort helpers
	const closeBlock = (m: PredictionMarketCreateEvent) =>
		(m?.marketData?.marketStart || 0) + (m?.marketData?.marketDuration || 0);
	const createdAt = (m: PredictionMarketCreateEvent) => m?.unhashedData?.createdAt || 0;

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

	const filteredMarkets = $derived.by(() => {
		const category = categoryS.current;
		const mState = marketStateS.current;
		const mType = marketTypeS.current;
		const sortKey = sortStateS.current;

		const comparator = (a: PredictionMarketCreateEvent, b: PredictionMarketCreateEvent) => {
			if (sortKey === 'ending-soon') return closeBlock(a) - closeBlock(b);
			if (sortKey === 'newest') return createdAt(b) - createdAt(a);
			if (sortKey === 'tvl')
				return totalPoolSum(b.marketData.stakes) - totalPoolSum(a.marketData.stakes);
			if (sortKey === 'outcomes')
				return (b.marketData.categories?.length || 0) - (a.marketData.categories?.length || 0);
			return 0;
		};

		return markets
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

				const matchesCategory =
					category === 'all' ||
					(category &&
						(market.unhashedData.category || '').toLowerCase() === category.toLowerCase());
				const matchesMarketState = doesMatchState(market, mState);
				const matchesType = doesMatchType(market, mType);

				return matchesSearch && matchesCategory && matchesMarketState && matchesType;
			})
			.sort(comparator);
	});

	/** Single nav highlight: sort tab, scope tab, or one category — never more than one. */
	const navSelection = $derived.by(() => {
		const category = categoryS.current;
		if (category && category !== 'all') {
			return `category:${category.toLowerCase()}`;
		}
		const sort = sortStateS.current;
		if (sort === 'newest') return 'sort:newest';
		if (sort === 'tvl') return 'sort:tvl';
		return 'scope:all';
	});

	const handleAll = () => {
		marketStateStore.set('all');
		marketTypeStore.set('all');
		categoryStateStore.set('all');
		searchStateStore.set('all');
		sortStateStore.set('tvl');
		componentKey++;
	};

	const selectTrending = () => {
		sortStateStore.set('tvl');
		categoryStateStore.set('all');
		searchStateStore.set('all');
		componentKey++;
	};

	const selectNew = () => {
		sortStateStore.set('newest');
		categoryStateStore.set('all');
		searchStateStore.set('all');
		componentKey++;
	};

	const handleChangeCategory = (label: string) => {
		const normalized = (label || 'all').trim();
		categoryStateStore.set(normalized.toLowerCase() === 'all' ? 'all' : normalized);
		searchStateStore.set('all');
		sortStateStore.set('tvl');
		componentKey++;
	};

	const updateMarketStatus = () => {
		searchStateStore.set('all');
		marketStateStore.set(localMarketStatus);
		componentKey++;
	};

	const updateSortState = (sortby: string) => {
		sortStateStore.set(sortby as 'ending-soon' | 'newest' | 'tvl' | 'outcomes');
		componentKey++;
	};

	const updateMarketType = (localMarketTypeInt: string) => {
		searchStateStore.set('all');
		marketTypeStore.set(localMarketTypeInt);
		componentKey++;
	};

	onMount(() => {
		// Initialize global stores for default tab / filters (list is derived from stores + props)
		searchStateStore.set('all');
		marketStateStore.set('open');
		categoryStateStore.set('all');
		marketTypeStore.set('all');
		sortStateStore.set('tvl');
		sortBy = 'tvl';
		localMarketStatus = 'open';
	});
</script>

<!-- Filter Section with improved spacing -->
<div class="space-y-4">
	<!-- Row 1: Primary category tabs -->
	<div class="scrollbar-hide overflow-x-auto">
		<nav class="flex items-center gap-4 pb-2" aria-label="Market filters">
			{#key componentKey}
				<div class="flex shrink-0 items-center gap-4">
					<CategoryButton
						label="tvl"
						selected={navSelection === 'sort:tvl'}
						onChangeCategory={selectTrending}
					>
						{#snippet body()}
							<span class="flex items-center gap-1.5">
								<TrendingUp class="h-4 w-4 shrink-0" aria-hidden="true" />
								Trending
							</span>
						{/snippet}
					</CategoryButton>

					<CategoryButton
						label="newest"
						selected={navSelection === 'sort:newest'}
						onChangeCategory={selectNew}
					>
						{#snippet body()}New{/snippet}
					</CategoryButton>
				</div>

				<div class="h-4 w-px shrink-0 bg-border" aria-hidden="true"></div>

				<div class="flex min-w-0 items-center gap-4">
					<CategoryButton
						label="all"
						selected={navSelection === 'scope:all'}
						onChangeCategory={handleAll}
					>
						{#snippet body()}
							{searchStateLabels[searchState]}
						{/snippet}
					</CategoryButton>

					{#each marketCategories as category (category.name)}
						{#if category.active}
							<CategoryButton
								label={category.name}
								selected={navSelection === `category:${category.name.toLowerCase()}`}
								onChangeCategory={handleChangeCategory}
							>
								{#snippet body()}
									{category.displayName}
								{/snippet}
							</CategoryButton>
						{/if}
					{/each}
				</div>
			{/key}
		</nav>
	</div>
	<!-- Divider -->
	<div class="h-px w-full bg-border"></div>

	<!-- Row 2: search + filters (single line from md up) -->
	<div class="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:gap-3">
		<div
			class="relative h-10 w-full min-w-0 rounded-lg border border-border bg-background shadow-xs md:min-w-52 md:max-w-sm md:flex-1 dark:bg-input/30"
		>
			<label for="searchTerm" class="sr-only">Search markets</label>
			<Search
				class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
				aria-hidden="true"
			/>
			<input
				id="searchTerm"
				type="search"
				bind:value={searchTerm}
				placeholder="Search markets..."
				class="h-full w-full rounded-lg border-0 bg-transparent py-0 pr-10 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			/>
			{#if searchTerm}
				<button
					type="button"
					aria-label="Clear search"
					onclick={() => (searchTerm = '')}
					class="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				>
					<XIcon class="size-3.5" />
				</button>
			{/if}
		</div>

		<div class="grid grid-cols-3 gap-2 md:contents">
			<FilterSelect
				id="filter-sort"
				label="Sort by"
				class="min-w-0 md:w-32"
				bind:value={sortBy}
				options={sortOptions}
				onchange={() => updateSortState(sortBy)}
			/>
			<FilterSelect
				id="filter-status"
				label="Market status"
				class="min-w-0 md:w-36"
				bind:value={localMarketStatus}
				options={statusOptions}
				onchange={updateMarketStatus}
			/>
			<FilterSelect
				id="filter-type"
				label="Market type"
				class="min-w-0 md:w-32"
				bind:value={localMarketType}
				options={marketTypes.map((t) => ({ value: t.value, label: t.name }))}
				onchange={() => updateMarketType(localMarketType)}
			/>
		</div>

		<p class="shrink-0 text-sm font-medium whitespace-nowrap tabular-nums text-muted-foreground">
			{filteredMarkets.length} of {markets.length} Markets
		</p>
	</div>
</div>

<!-- Market Grid with enhanced spacing -->
{#key componentKey}
	{#if filteredMarkets && filteredMarkets.length > 0}
		<div
			class="mt-4 grid gap-4 sm:grid-cols-2 md:mt-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
		>
			{#each filteredMarkets as market (market.marketId + '-' + market.marketType)}
				<MarketEntry
					{market}
					{selectedCurrency}
					{currentBurnHeight}
					{disputeWindowLength}
					{marketVotingDuration}
					{forumApi}
					{isCoordinator}
				/>
			{/each}
		</div>
	{:else}
		<div
			class="mt-4 rounded-xl border border-border bg-muted p-8 text-center shadow-sm"
		>
			<div class="mx-auto max-w-sm">
				<h3 class="text-lg font-medium text-foreground">No markets found</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Try adjusting your filters or search terms to find more markets.
				</p>
				<button
					onclick={() => {
						searchTerm = '';
						marketStateStore.set('all');
						marketTypeStore.set('all');
						searchStateStore.set('all');
						searchTypeStore.set('all');
						categoryStateStore.set('all');
						sortStateStore.set('tvl');
					}}
					class="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
				>
					Clear all filters
				</button>
			</div>
		</div>
	{/if}
{/key}
