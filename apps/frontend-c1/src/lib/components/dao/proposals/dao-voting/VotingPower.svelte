<script lang="ts">
	import { Banner } from '@bigmarket/bm-ui';
	import { fmtMicroToStxNumber, fmtNumber } from '@bigmarket/bm-utilities';

	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { getStxAddress } from '@bigmarket/bm-common';
	import { getBalanceAtHeight } from '$lib/core/app/loaders/walletLoaders';
	//import { daoConfigStore, requireDaoConfig } from '$lib/stores/config/daoConfigStore';
	const appConfig = $derived(requireAppConfig($appConfigStore));
	//const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let { proposal }: { proposal: VotingEventProposeProposal } = $props();
	let balanceAtHeight = $state(0);

	let errorMessage = $state<string | undefined>(undefined);
	// let txId = $state<string | undefined>(undefined);
	// let canVote = $state(true);

	// if (balanceAtHeight === 0 || balanceAtHeight < 1) {
	// 	canVote = false;
	// }
	onMount(async () => {
		const response = await getBalanceAtHeight(
			appConfig.VITE_STACKS_API,
			getStxAddress(),
			proposal.proposalData.startBlockHeight
		);
		//balanceAtHeight = ChainUtils.fromMicroAmount(Number(response.stx.balance) - Number(response.stx.locked))
		balanceAtHeight = Number(response?.stx?.balance) || 0;
		balanceAtHeight = fmtMicroToStxNumber(balanceAtHeight);
	});
</script>

<div>
	<div class="flex flex-col gap-y-4">
		<div class="flex w-full flex-col justify-start">
			<div class="space-y-3 rounded-lg pb-6">
				<Banner
					bannerType="warning"
					message={'Snapshot balance (connected wallet) when voting began, (at block ' +
						fmtNumber(proposal.proposalData?.startBlockHeight) +
						'), was ' +
						balanceAtHeight +
						' STX'}
				/>
			</div>
		</div>
		{#if errorMessage}
			<div class="flex w-full justify-start gap-x-4">
				{errorMessage}
			</div>
		{/if}
	</div>
</div>
