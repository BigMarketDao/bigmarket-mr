<script lang="ts">
	let { code }: { code: string } = $props();
	const cls = 'h-4 w-6 text-gray-500 dark:text-gray-400';
</script>

{#if code === 'USD'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M1 3h22M1 5h22M1 7h22M1 9h22M1 11h22M1 13h22" />
		<rect x="1" y="1" width="9" height="7" fill="currentColor" opacity="0.1" />
	</svg>
{:else if code === 'EUR'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<circle cx="12" cy="8" r="2" fill="none" />
		<path d="M8 8h8" />
	</svg>
{:else if code === 'GBP'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M12 1v14M1 8h22" />
		<path d="M6 3l12 10M18 3L6 13" />
	</svg>
{:else if code === 'JPY'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<circle cx="12" cy="8" r="4" fill="none" />
	</svg>
{:else if code === 'CNY'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M7 4l2 2 2-2 2 2 2-2" />
		<path d="M12 6v6" />
	</svg>
{:else if code === 'AUD'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M1 8h22" />
		<path d="M12 1v14" />
		<circle cx="6" cy="5" r="1" />
	</svg>
{:else if code === 'CAD'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M8 4v8M16 4v8M12 3l-2 2h4l-2-2z" />
	</svg>
{:else if code === 'CHF'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M12 4v8M8 8h8" />
	</svg>
{:else if code === 'INR'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M1 4h22M1 8h22M1 12h22" />
	</svg>
{:else if code === 'SGD'}
	<svg class={cls} viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1">
		<rect x="1" y="1" width="22" height="14" rx="1" />
		<path d="M1 8h22" />
	</svg>
{:else}
	<span
		class="inline-flex h-5 w-8 items-center justify-center rounded-sm bg-gray-100 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400"
		>{code}</span>
{/if}
