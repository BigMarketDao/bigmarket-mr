<script lang="ts">
	// import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import UserToggle from './UserToggle.svelte';

	const { isConnected } = $props<{
		isConnected: boolean;
	}>();

</script>

<div class="w-full px-20">
	{#snippet lead()}
		<h2 class="h2"><a href="/">📣 Community Forums</a></h2>
	{/snippet}
	{#snippet trail()}
		<UserToggle {isConnected} />
		<ThemeToggle />
	{/snippet}
</div>
