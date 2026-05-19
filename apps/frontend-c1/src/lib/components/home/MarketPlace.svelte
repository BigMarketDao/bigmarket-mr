<script lang="ts">
	import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import {
		allowedTokenStore,
		chainStore,
		daoOverviewStore,
		exchangeRatesStore,
		getStxAddress,
		marketSystemCategoriesStore,
		selectedCurrency
	} from '@bigmarket/bm-common';
	import { isCoordinator } from '$lib/core/tools/security';
	import { FilteredMarketView, InfoPanelContainer } from '@bigmarket/bm-market-homepage';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const { markets } = $props<{
		markets: Array<PredictionMarketCreateEvent>;
	}>();
</script>

<div class="mx-auto w-full max-w-7xl space-y-10">
	<section class="-mt-4 md:-mt-6">
		<FilteredMarketView
			{markets}
			marketCategories={$marketSystemCategoriesStore}
			selectedCurrency={$selectedCurrency}
			currentBurnHeight={$chainStore.stacks.burn_block_height}
			disputeWindowLength={$daoOverviewStore.contractData.disputeWindowLength}
			marketVotingDuration={$daoOverviewStore.contractData.marketVotingDuration}
			bmApi={appConfig.VITE_BIGMARKET_API}
			tokens={$allowedTokenStore ?? []}
			exchangeRates={$exchangeRatesStore ?? []}
			isCoordinator={isCoordinator(getStxAddress())}
		/>
	</section>

	<section>
		<InfoPanelContainer />
	</section>
</div>
