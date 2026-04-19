<script lang="ts">
	import type { Snippet } from 'svelte';

	type Level = 1 | 2 | 3 | 4 | 5 | 6;
	type Align = 'left' | 'center' | 'right';

	let {
		level: levelProp = 3,
		className = '',
		align = 'left',
		noMargin = false,
		children
	}: {
		level?: Level;
		className?: string;
		align?: Align;
		noMargin?: boolean;
		children?: Snippet;
	} = $props();

	function toLevel(n: number | undefined): Level {
		if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5 || n === 6) return n;
		return 3;
	}

	const level = $derived(toLevel(levelProp));

	const base = 'font-semibold tracking-tight text-zinc-900 dark:text-zinc-100';

	const sizes: Record<Level, string> = {
		1: 'text-3xl md:text-4xl leading-tight',
		2: 'text-2xl md:text-3xl leading-tight',
		3: 'text-xl md:text-2xl leading-snug',
		4: 'text-lg md:text-xl leading-snug',
		5: 'text-base md:text-lg leading-normal',
		6: 'text-sm md:text-base leading-normal'
	};

	const margins: Record<Level, string> = {
		1: 'mb-4',
		2: 'mb-3',
		3: 'mb-2',
		4: 'mb-2',
		5: 'mb-1.5',
		6: 'mb-1'
	};

	const alignCls = $derived(
		align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
	);
</script>

<svelte:element
	this={`h${level}`}
	class={`${base} ${sizes[level]} ${noMargin ? '' : margins[level]} ${alignCls} ${className}`}
>
	{@render children?.()}
</svelte:element>
