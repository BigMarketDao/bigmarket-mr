<script lang="ts">
	import { CircleUser, Wallet } from '@lucide/svelte';
	import { isLoggedIn, logUserOut } from '../../utils/signer';
	import { storedBnsData } from '../../stores/threads';
	import { getConfig } from '../../stores/stores_config';
	import { authenticate, getBnsNameFromAddress, getStxAddress } from '../../utils/forum_helper';
	import { isConnected } from '@bigmarket/bm-common/connection_wrapper';
	import { onMount } from 'svelte';

	let componentKey = 0;
	let connected = false;

	const toggleAuth = async () => {
		if (connected) {
			await logUserOut();
		} else {
			await authenticate();
			const name = await getBnsNameFromAddress(getConfig().VITE_FORUM_API, await getStxAddress());
			storedBnsData.set(name || (await getStxAddress()));
			window.location.reload();
		}
		componentKey++;
	};

	onMount(async () => {
		connected = await isConnected();
	});
</script>

<!-- {@render children()} -->

{#key componentKey}
	{#if connected}
		<button on:click={toggleAuth} class="btn bg-primary-800"
			><CircleUser class="mr-1 inline-block" size={20} /> {$storedBnsData}</button
		>
	{:else}
		<button on:click={toggleAuth}><Wallet size={20} /></button>
	{/if}
{/key}
