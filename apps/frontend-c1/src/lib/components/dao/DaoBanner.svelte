<script lang="ts">
	import { truncate } from '@bigmarket/bm-utilities';
	import { Banner } from '@bigmarket/bm-ui';

	let {
		contractId
	}: {
		contractId: string;
	} = $props();
</script>

{#if contractId}
	<div class="mt-0 mb-8">
		<Banner
			bannerType="warning"
			message={'Dao contract: ' +
				truncate(contractId.split('.')[0]) +
				'.' +
				contractId.split('.')[1]}
		/>
	</div>
{/if}
