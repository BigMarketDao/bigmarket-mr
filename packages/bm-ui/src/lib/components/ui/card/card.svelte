<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '../../../utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		`
		group
		flex flex-col
		gap-6
		rounded-md
		border
		border-border
		bg-card
		text-card-foreground
		p-4

		transition-colors duration-200

		hover:border-border/60
		`,
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
