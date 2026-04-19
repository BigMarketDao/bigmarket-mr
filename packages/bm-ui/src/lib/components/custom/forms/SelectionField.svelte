<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Option {
		value: string | number;
		label: string;
		disabled?: boolean;
	}

	type Props = Omit<HTMLSelectAttributes, 'id' | 'value' | 'disabled' | 'class' | 'onchange'> & {
		id?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		value?: string | number | '';
		options?: Option[];
		error?: string;
		className?: string;
		onChange?: (e: Event) => void;
	};

	let {
		id = `select-${Math.random().toString(36).slice(2)}`,
		label = '',
		placeholder = 'Select an option…',
		disabled = false,
		required = false,
		value = $bindable<string | number | ''>(''),
		options = [],
		error = '',
		className = '',
		onChange = () => {},
		...rest
	}: Props = $props();
</script>

<div class={`w-full ${className}`}>
	{#if label}
		<label for={id} class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
			{label}{#if required}<span class="text-red-600 dark:text-red-400"> *</span>{/if}
		</label>
	{/if}

	<div class="relative">
		<select
			{id}
			bind:value
			{disabled}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? `${id}-error` : undefined}
			onchange={onChange}
			class={`block w-full appearance-none rounded-lg border bg-white text-zinc-900
              dark:bg-zinc-900 dark:text-zinc-100
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:ring-blue-500 dark:border-zinc-700'}
              px-3 py-2 pr-10 shadow-sm
              focus:border-transparent focus:ring-2 focus:outline-none
              disabled:cursor-not-allowed disabled:opacity-50`}
			{...rest}
		>
		{#each options as opt (opt.value)}
			<option class="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value={opt.value} disabled={opt.disabled}>{opt.label}</option>
		{/each}
		</select>

		<!-- Chevron -->
		<svg
			class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>

	{#if error}
		<p id={`${id}-error`} class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
	{/if}
</div>
