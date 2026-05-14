<script lang="ts">
	import { PageContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import Deposit from '$lib/components/vault/Deposit.svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	onMount(async () => {
		//const address = getStxAddress();
		console.log(appConfig);
	});
</script>

<svelte:head>
	<title>BigMarket - Reputation & BIG Token Claims</title>
	<meta
		name="description"
		content="DAO Governance tokens to participate in BigMarket prediction markets on Bitcoin"
	/>
</svelte:head>

<PageContainer>
	<!-- Page Header -->
	<div class="flex w-full justify-center bg-white py-1 dark:bg-gray-900">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="bg-white dark:bg-gray-900">
				<div class="mb-6 md:flex md:items-center md:justify-between">
					<div class="min-w-0 flex-1">
						<!-- <h1 class="text-xl leading-7 font-semibold text-gray-900 sm:text-2xl dark:text-white">
							Deposits
						</h1> -->
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Bridge USDC or USDT between Ethereum and Stacks
						</p>
					</div>
				</div>
				<div class="">
					<Deposit />
				</div>
			</div>
		</div>
	</div>
</PageContainer>
