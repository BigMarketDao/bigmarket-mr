<script lang="ts">
	import { daoConfigStore, requireDaoGoveranceClient } from '$lib/stores/config/daoConfigStore';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	let { daoContractId }: { daoContractId: string } = $props();

	const constructDao = async () => {
		const client = requireDaoGoveranceClient(get(daoConfigStore));
		await client.construct();
	};

	onMount(async () => {
		// txId = await getContractDeploymentTxId(daoContractId);
		// constructed = await isDaoConstructed(daoContractId);
		console.log('daoContractId', daoContractId);
	});
</script>

<svelte:head>
	<title>BigMarket DAO</title>
	<meta
		name="description"
		content="Governance of the Stacks Blockchain, Smart Contracts on Bitcoin"
	/>
</svelte:head>

<div>HI</div>
<div class="mx-auto w-full max-w-7xl py-4 md:px-6">
	<div class="my-2 flex w-full flex-col items-center">
		<div>
			<button
				onclick={() => {
					constructDao();
				}}
				class="bg-success-01 focus-visible:outline-primary-500/50 border-bitcoinorange w-[150px] items-center justify-center gap-x-1.5 rounded-xl border bg-black px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
			>
				Bootstrap DAO
			</button>
		</div>
	</div>
</div>
