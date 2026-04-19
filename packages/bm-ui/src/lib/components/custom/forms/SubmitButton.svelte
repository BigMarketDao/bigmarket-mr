<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = Omit<HTMLButtonAttributes, 'type' | 'class' | 'size' | 'onclick'> & {
		type?: 'button' | 'submit' | 'reset';
		size?: 'sm' | 'md' | 'lg';
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		fullWidth?: boolean;
		onClick?: (e: MouseEvent) => void;
		className?: string;
		children?: Snippet;
	};

	let {
		type = 'button',
		disabled = false,
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		onClick = () => {},
		className = '',
		children,
		...rest
	}: Props = $props();

	// Base + accessibility
	const base =
		'cursor-pointer rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/50 focus:outline-none';

	const sizes = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-12 px-6 text-base'
	} as const;

	// Light/Dark variants
	const variants = {
		primary:
			'bg-blue-600 text-white hover:bg-blue-700 ' +
			'dark:bg-blue-500 dark:hover:bg-blue-600 ' +
			'focus-visible:ring-blue-500',
		secondary:
			'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 ' +
			'dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 ' +
			'focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600',
		danger:
			'bg-red-600 text-white hover:bg-red-700 ' +
			'dark:bg-red-500 dark:hover:bg-red-600 ' +
			'focus-visible:ring-red-500',
		ghost:
			'bg-transparent text-zinc-900 hover:bg-zinc-100 ' +
			'dark:text-zinc-100 dark:hover:bg-zinc-800 ' +
			'focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600'
	} as const;
</script>

<button
	{type}
	class={`${base} ${sizes[size]} ${fullWidth ? 'w-full' : 'w-auto'} ${className}`}
	{disabled}
	aria-disabled={disabled}
	onclick={onClick}
	{...rest}
>
	{@render children?.()}
</button>
