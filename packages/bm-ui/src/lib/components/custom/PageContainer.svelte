<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen bg-white dark:bg-gray-900">
	<div class="mx-auto w-full max-w-7xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8 lg:py-12 dark:text-white">
		{@render children?.()}
	</div>
</div>
