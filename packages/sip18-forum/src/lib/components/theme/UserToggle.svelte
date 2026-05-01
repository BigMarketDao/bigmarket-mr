<script lang="ts">
	import { CircleUser, Wallet } from 'lucide-svelte';
	import { isLoggedIn, logUserOut } from '../../utils/signer';
	import { storedBnsData } from '../../stores/threads';
	import { getConfig } from '../../stores/stores_config';
	import { authenticate, getBnsNameFromAddress, getStxAddress } from '../../utils/forum_helper';
	import { onMount } from 'svelte';

	const { isConnected } = $props<{
		isConnected: boolean;
	}>();

	let componentKey = $state(0);
	let connected = $state(false);
	
	const toggleAuth = async () => {
		if (isConnected) {
			await logUserOut();
		} else {
			await authenticate();
			const name = await getBnsNameFromAddress(getConfig().VITE_STACKS_API, await getStxAddress());
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
		<button onclick={toggleAuth} class="btn bg-primary-800"
			><CircleUser class="mr-1 inline-block" size={20} /> {$storedBnsData}</button
		>
	{:else}
		<button onclick={toggleAuth}><Wallet size={20} /></button>
	{/if}
{/key}
