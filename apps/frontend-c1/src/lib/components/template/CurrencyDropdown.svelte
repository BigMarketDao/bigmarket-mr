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
	<button
		id="currency-button"
		class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-label="Select currency"
		aria-controls="currency-menu"
	>
		<span
			class="inline-flex h-6 min-w-8 items-center justify-center rounded-sm bg-muted px-1.5 text-xs font-semibold text-foreground"
		>
			{$selectedCurrency.code}
		</span>
		<span class="text-xs text-muted-foreground">{$selectedCurrency.symbol}</span>
	</button>

	{#if isOpen}
		<div
			id="currency-menu"
			role="listbox"
			aria-labelledby="currency-button"
			class="absolute z-[999] {position === 'up'
				? 'bottom-full right-0 mb-2'
				: 'right-0 mt-2'} w-60 rounded-lg border border-border bg-popover p-1 shadow-lg"
		>
			{#each currencies as currency (currency.code)}
				<div
					class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none"
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
						<div class="text-sm font-medium text-popover-foreground">{currency.name}</div>
						<div class="text-xs text-muted-foreground">
							{currency.code}
							{currency.symbol}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
