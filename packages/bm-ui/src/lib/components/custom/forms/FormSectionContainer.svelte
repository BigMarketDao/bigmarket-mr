<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children?: Snippet;
	}

	let { title, children }: Props = $props();
</script>

<div class="rounded-md border border-gray-200 shadow-md dark:border-gray-700">
	<div class="w-full bg-gray-100 px-4 py-3 text-left font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">{title}</div>
	<div id="poll-info" class="flex flex-col gap-y-5 px-4 py-4">
		{@render children?.()}
	</div>
</div>
