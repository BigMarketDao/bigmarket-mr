<script lang="ts">
	import { onMount } from 'svelte';
	import { Sun, Moon } from '@lucide/svelte';

	let isDark = true;

	onMount(() => {});

	function toggleTheme() {
		isDark = !isDark;
		//localStorage.theme = isDark ? 'dark' : 'light';
		const current = document.documentElement.getAttribute('data-theme');
		const themeName = current === 'cerberus' ? 'sahara' : 'cerberus';
		//document.documentElement.setAttribute('data-theme', themeName);
		localStorage.setItem('theme', themeName);
		updateTheme(themeName);
	}

	function updateTheme(theme: 'sahara' | 'cerberus') {
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<!-- {@render children()} -->
<button on:click={toggleTheme}>
	{#if isDark}
		<Sun size={20} />
	{:else}
		<Moon size={20} />
	{/if}
</button>
