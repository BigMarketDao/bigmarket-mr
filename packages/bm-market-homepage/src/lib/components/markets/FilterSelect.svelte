<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';

	type Option = { value: string; label: string };

	let {
		id,
		label,
		value = $bindable(''),
		options,
		onchange,
		class: className = ''
	}: {
		id: string;
		label: string;
		value?: string;
		options: Option[];
		onchange?: (e: Event) => void;
		class?: string;
	} = $props();
</script>

<div
	class="relative h-10 w-full rounded-lg border border-border bg-background shadow-xs dark:bg-input/30 {className}"
>
	<label for={id} class="sr-only">{label}</label>
	<select
		{id}
		bind:value
		{onchange}
		class="h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg bg-transparent py-0 pr-10 pl-3 text-sm text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
	>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	<ChevronDown
		class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
		aria-hidden="true"
	/>
</div>
