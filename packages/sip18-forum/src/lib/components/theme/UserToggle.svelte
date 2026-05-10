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
		<button
			type="button"
			onclick={toggleAuth}
			class="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			><CircleUser class="inline-block" size={20} /> {$storedBnsData}</button
		>
	{:else}
		<button onclick={toggleAuth}><Wallet size={20} /></button>
	{/if}
{/key}
