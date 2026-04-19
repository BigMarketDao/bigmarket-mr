<script lang="ts">
	import { selectedCurrency, exchangeRatesStore } from '@bigmarket/bm-common';
	import { get } from 'svelte/store';
	import CurrencyFlagIcon from './CurrencyFlagIcon.svelte';
	import { onDestroy, onMount } from 'svelte';

	let {
		position = 'down'
	}: {
		position?: 'up' | 'down';
	} = $props();

	let isOpen = $state(false);
	let dropdownRef = $state<HTMLElement | null>(null);

	// Supported currencies (monochrome, code-based badges)
	const currencies = [
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'EUR', name: 'Euro', symbol: '€' },
		{ code: 'GBP', name: 'British Pound', symbol: '£' },
		{ code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
		{ code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
		{ code: 'AUD', name: 'Australian Dollar', symbol: '$' },
		{ code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
		{ code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
		{ code: 'INR', name: 'Indian Rupee', symbol: '₹' },
		{ code: 'SGD', name: 'Singapore Dollar', symbol: '$' }
	];

	function selectCurrency(currencyCode: string) {
		const c = currencies.find((o) => o.code === currencyCode);
		const rate = get(exchangeRatesStore).find((o) => o.currency === currencyCode);
		let symbol = c?.symbol ?? '$';
		if (rate?.symbol) symbol = rate.symbol ?? '$';
		selectedCurrency.set(
			c ? { ...c, flag: c.code, symbol } : { code: 'USD', name: 'US Dollar', flag: 'USD', symbol }
		);
		isOpen = false;
	}

	function handleKeydown(event: KeyboardEvent, currencyCode: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectCurrency(currencyCode);
		}
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="relative z-50 text-left" bind:this={dropdownRef}>
	<!-- Selected Currency Button (monochrome, consistent with header controls) -->
	<button
		id="currency-button"
		class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-900"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-label="Select currency"
		aria-controls="currency-menu"
	>
		<span
			class="inline-flex h-6 min-w-8 items-center justify-center rounded-sm bg-gray-100 px-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
		>
			{$selectedCurrency.code}
		</span>
		<span class="text-xs text-gray-500 dark:text-gray-400">{$selectedCurrency.symbol}</span>
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			id="currency-menu"
			role="listbox"
			aria-labelledby="currency-button"
			class="absolute z-[999] {position === 'up'
				? 'bottom-full mb-2'
				: 'mt-2'} w-60 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
		>
			{#each currencies as currency (currency.code)}
				<div
					class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 focus-visible:outline-none dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-900"
					onclick={() => selectCurrency(currency.code)}
					onkeydown={(e) => handleKeydown(e, currency.code)}
					role="option"
					aria-selected={$selectedCurrency.code === currency.code}
					tabindex="0"
				>
					<div class="flex h-5 w-8 items-center justify-center">
						<CurrencyFlagIcon code={currency.code} />
					</div>
					<div class="flex-1">
						<div class="text-sm font-medium text-gray-700 dark:text-gray-200">{currency.name}</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							{currency.code}
							{currency.symbol}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
