<script lang="ts">
	let { href, label, active, external = false } = $props<{
		href: string;
		label: string;
		active: boolean;
		external?: boolean;
	}>();
</script>

<a
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	data-sveltekit-preload-data={external ? undefined : 'hover'}
	data-sveltekit-preload-code={external ? undefined : 'hover'}
	class={`rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors duration-200 ${
		active
			? 'bg-primary/20 text-foreground hover:bg-primary/25 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20'
			: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
	}`}
	aria-current={active ? 'page' : undefined}
>
	{label}
</a>
