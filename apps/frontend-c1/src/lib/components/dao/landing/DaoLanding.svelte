<script lang="ts">
	import DaoLandingControls from './DaoLandingControls.svelte';
	import DaoLandingHero from './DaoLandingHero.svelte';
	import DaoLandingJoin from './DaoLandingJoin.svelte';
	import DaoLandingRevenue from './DaoLandingRevenue.svelte';
	import DaoLandingTrust from './DaoLandingTrust.svelte';
	import DaoLandingWhatIs from './DaoLandingWhatIs.svelte';
	import { walletState } from '@bigmarket/bm-common';

	let {
		activeMarkets,
		proposalCount,
		onScrollToPanel
	}: {
		activeMarkets: number | null;
		proposalCount: number | null;
		onScrollToPanel?: () => void;
	} = $props();

	const loggedIn = $derived(
		$walletState.status === 'connected' && ($walletState.accounts?.length ?? 0) > 0
	);
</script>

<DaoLandingHero
	{activeMarkets}
	{proposalCount}
	showPanelCta={loggedIn}
	{onScrollToPanel}
/>
<DaoLandingWhatIs {activeMarkets} {proposalCount} />
<DaoLandingControls />
<DaoLandingJoin />
<DaoLandingRevenue />
<DaoLandingTrust />
