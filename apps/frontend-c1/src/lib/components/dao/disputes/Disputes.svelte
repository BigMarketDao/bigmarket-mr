<script lang="ts">
	import { ParaContainer } from '@bigmarket/bm-ui';
	import DaoHeading from '$lib/components/dao/DaoHeading.svelte';
	import { onMount } from 'svelte';
	import DisputeGridItem from './DisputeGridItem.svelte';
	import type { MarketDisputeRecord } from '@bigmarket/bm-types';
	import { getDisputes } from '$lib/core/app/loaders/governance/voting';
	let disputes = $state<Array<MarketDisputeRecord>>([]);

	const sortByMostRecentlyEnded = (
		proposals: Array<MarketDisputeRecord>
	): Array<MarketDisputeRecord> => {
		return proposals.sort((a, b) => a.event_index - b.event_index);
	};

	onMount(async () => {
		disputes = sortByMostRecentlyEnded(await getDisputes());
	});
</script>

<div class="max-w-4xl text-gray-900 dark:text-gray-100">
	<!-- Main Hero -->
	<DaoHeading
		headingPart1="Market"
		headingPart2="Disputes"
		message="Market disputes and how they were resolved by community voting"
	/>

	<!-- Modern Sale Timeline -->
	<div class="my-10">
		{#if disputes && disputes.length > 0}
			{#each disputes as dispute (dispute.event_index)}
				<div class="w-full justify-stretch">
					<DisputeGridItem {dispute} />
				</div>
			{/each}
		{:else}
			<ParaContainer>No disputed markets</ParaContainer>
		{/if}
	</div>
</div>
