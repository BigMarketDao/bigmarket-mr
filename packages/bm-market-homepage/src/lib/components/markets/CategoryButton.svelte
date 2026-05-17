<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		selected = false,
		onChangeCategory,
		label,
		body
	}: {
		selected?: boolean;
		label: string;
		onChangeCategory: (label: string) => void;
		body: Snippet;
	} = $props();

	const handleClick = () => {
		onChangeCategory(label);
	};
</script>

<button
	type="button"
	aria-pressed={selected}
	onclick={handleClick}
	class={[
		'relative shrink-0 cursor-pointer whitespace-nowrap rounded-sm px-2 py-1.5 text-xs font-medium transition-colors md:text-sm',
		'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
		selected ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
	].join(' ')}
>
	<span class="capitalize">
		{@render body()}
	</span>
</button>
