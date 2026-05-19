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
		'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[4px] px-2.5 text-xs font-semibold tracking-wide transition-colors duration-200',
		'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none',
		selected
			? 'bg-primary/20 text-foreground hover:bg-primary/25 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20'
			: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
	].join(' ')}
>
	<span class="capitalize">
		{@render body()}
	</span>
</button>
