<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen bg-background">
	<div class="mx-auto w-full max-w-7xl px-4 py-8 text-foreground sm:px-6 lg:px-8 lg:py-12">
		{@render children?.()}
	</div>
</div>
