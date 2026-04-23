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
		border-zinc-100/70
		dark:bg-zinc-900
		p-4

		shadow-[0_6px_20px_rgba(0,0,0,0.06)]
		transition-colors duration-200

		hover:border-zinc-300
		hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]

		bg-zinc-900
		dark:shadow-[0_6px_20px_rgba(0,0,0,0.5)]
		dark:hover:border-zinc-700
		`,
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
