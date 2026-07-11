<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { restoreOAuthSession } from '$lib/core/auth/authSession';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	let errorMsg = $state<string | null>(null);

	onMount(async () => {
		const user = await restoreOAuthSession(appConfig.VITE_BIGMARKET_API);
		if (user) {
			await goto(resolve('/'));
			return;
		}
		errorMsg = 'Sign-in failed. Please try again.';
	});
</script>

<div class="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-4 text-center">
	{#if errorMsg}
		<p class="text-sm text-red-600 dark:text-red-400" role="alert">{errorMsg}</p>
		<a href={resolve('/')} class="mt-4 text-sm text-foreground underline">Back to home</a>
	{:else}
		<p class="text-sm text-muted-foreground">Completing sign-in…</p>
	{/if}
</div>
