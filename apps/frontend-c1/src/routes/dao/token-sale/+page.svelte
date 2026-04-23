<script lang="ts">
	import { goto } from '$app/navigation';
	import { PageContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/dao');
	});
</script>

<svelte:head>
	<title>BigMarket - IDO Token Sale</title>
	<meta
		name="description"
		content="DAO Governance tokens to participate in BigMarket prediction markets on Bitcoin"
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<PageContainer
		><div></div>
		<!-- <TokenSaleV3 fiatPerStx={fiatPerStx} /> -->
	</PageContainer>
</div>
