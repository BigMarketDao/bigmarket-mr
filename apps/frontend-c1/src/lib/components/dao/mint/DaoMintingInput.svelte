<script lang="ts">
	import { onMount } from 'svelte';
	import { fullBalanceInSip10Token, type Sip10Data } from '@bigmarket/bm-helpers';
	import { allowedTokenStore, getStxAddress } from '@bigmarket/bm-common';
	import { getGovernanceToken } from '$lib/core/app/loaders/governance/tokens';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { daoConfigStore, requireDaoConfig } from '$lib/stores/config/daoConfigStore';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	let sip10Data: Sip10Data;
	let totalBalanceUstx: number = 0;

	let amountStx: number;

	// Handle input change
	function mintToken() {}

	onMount(async () => {
		sip10Data = getGovernanceToken($allowedTokenStore);
		totalBalanceUstx = await fullBalanceInSip10Token(
			appConfig.VITE_STACKS_API,
			getStxAddress(),
			`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}`
		);
	});
</script>

<div class="my-5 max-w-xl rounded-lg bg-gray-50 p-4 shadow-md">
	<!-- Staking Info -->
	<div class="mb-3 flex flex-col">
		<span class="text-lg font-medium text-gray-800">Market Resolution </span>
		<p>Become part of BitcoinDao to participate in market resolution decisions much much more</p>
	</div>

	<!-- Input Field -->
	<div class="flex items-center gap-2">
		<input
			class="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
			bind:value={amountStx}
			placeholder="Enter amount (e.g., 0.000000)"
			type="number"
			id="Contribution"
			aria-describedby="Contribution"
		/>
		<span class="text-lg font-semibold text-gray-800">{sip10Data?.symbol || 'SYM'}</span>
	</div>
	<div class="">
		<button
			onclick={() => {
				mintToken();
			}}
			class="mt-4 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600"
		>
			MINT
		</button>
	</div>
	<p class="mt-20 text-[10px]">
		To participate in market voting <a href="/" class="text-black underline"
			>mint some governance token here</a
		>
	</p>

	<!-- Balance Hint -->
</div>
