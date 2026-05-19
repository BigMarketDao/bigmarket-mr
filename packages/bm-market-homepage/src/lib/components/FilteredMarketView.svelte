<script lang="ts">
	import type {
		Currency,
		ExchangeRate,
		MarketCategory,
		PredictionMarketCreateEvent,
		TokenPermissionEvent
	} from '@bigmarket/bm-types';
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
		bmApi,
		tokens = [],
		exchangeRates = [],
		isCoordinator
	} = $props<{
		markets: Array<PredictionMarketCreateEvent>;
		marketCategories: Array<MarketCategory>;
		selectedCurrency: Currency;
		currentBurnHeight: number;
		disputeWindowLength: number;
		marketVotingDuration: number;
		bmApi: string;
		tokens?: TokenPermissionEvent[];
		exchangeRates?: ExchangeRate[];
		isCoordinator: boolean;
	}>();

	let localMarketStatus: string = $state('all');
	let localMarketType: string = $state('all types');
	let searchTerm = $state('');
	let debouncedSearchTerm = $state('');
	let componentKey = $state(0);
	let sortBy: string = $state('ending-soon');
	let categoryNavWidth = $state(0);

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

<!-- Category nav width drives toolbar; controls row matches (right edge = Culture) -->
<div class="-mt-8 w-full md:-mt-10">
	<div
		class="max-w-full"
		style:width={categoryNavWidth > 0 ? `min(100%, ${categoryNavWidth}px)` : undefined}
		role="toolbar"
		aria-label="Search and filter markets"
	>
		<div class="flex w-full min-w-0 items-center gap-3">
			<div class="relative h-8 min-w-0 flex-1">
				<label for="searchTerm" class="sr-only">Search markets</label>
				<Search
					class="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<input
					id="searchTerm"
					type="search"
					bind:value={searchTerm}
					placeholder="Search markets..."
					class="h-full w-full rounded-[4px] border border-border bg-background py-0 pr-7 pl-8 text-xs font-medium text-foreground placeholder:text-muted-foreground transition-colors hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
				/>
				{#if searchTerm}
					<button
						type="button"
						aria-label="Clear search"
						onclick={() => (searchTerm = '')}
						class="absolute top-1/2 right-2 -translate-y-1/2 rounded-[4px] p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
					>
						<XIcon class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>

			<FilterSelect
				id="filter-sort"
				label="Sort by"
				class="w-[6.75rem] shrink-0"
				bind:value={sortBy}
				options={sortOptions}
				onchange={() => updateSortState(sortBy)}
			/>
			<FilterSelect
				id="filter-status"
				label="Market status"
				class="w-[7.5rem] shrink-0"
				bind:value={localMarketStatus}
				options={statusOptions}
				onchange={updateMarketStatus}
			/>
			<FilterSelect
				id="filter-type"
				label="Market type"
				class="w-[6.75rem] shrink-0"
				bind:value={localMarketType}
				options={marketTypes.map((t) => ({ value: t.value, label: t.name }))}
				onchange={() => updateMarketType(localMarketType)}
			/>
		</div>

		<div class="scrollbar-hide mt-4 max-w-full overflow-x-auto">
			<nav
				bind:clientWidth={categoryNavWidth}
				class="flex h-8 w-max items-center gap-2"
				aria-label="Market categories"
			>
				{#key componentKey}
					<CategoryButton
						label="tvl"
					selected={navSelection === 'sort:tvl'}
					onChangeCategory={selectTrending}
				>
					{#snippet body()}
						<span class="flex items-center gap-1.5">
							<TrendingUp class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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

				<div class="bg-border h-4 w-px shrink-0" aria-hidden="true"></div>

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
				{/key}
			</nav>
		</div>
	</div>

	<div class="mt-4 h-px w-full bg-border" aria-hidden="true"></div>
</div>

<!-- Market Grid with enhanced spacing -->
{#key componentKey}
	{#if filteredMarkets && filteredMarkets.length > 0}
		<div
			class="market-cards-grid mt-5 grid items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
			style="--market-ticker-duration: 48s"
		>
			{#each filteredMarkets as market (market.marketId + '-' + market.marketType)}
				<MarketEntry
					{market}
					{selectedCurrency}
					{currentBurnHeight}
					{disputeWindowLength}
					{marketVotingDuration}
					{bmApi}
					{tokens}
					{exchangeRates}
					{isCoordinator}
				/>
			{/each}
		</div>
	{:else}
		<div class="border-border bg-muted mt-4 w-full rounded-xl border p-8 text-center shadow-sm">
			<div class="mx-auto">
				<h3 class="text-foreground text-lg font-medium">No markets found</h3>
				<p class="text-muted-foreground mt-2 text-sm">
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
					class="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-background mt-4 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					Clear all filters
				</button>
			</div>
		</div>
	{/if}
{/key}
