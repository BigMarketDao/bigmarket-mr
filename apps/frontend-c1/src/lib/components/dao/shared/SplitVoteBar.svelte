<script lang="ts">
	let {
		forPct,
		againstPct
	}: {
		forPct: number;
		againstPct: number;
	} = $props();

	const forWidth = $derived(Math.max(0, Math.min(100, forPct)));
	const againstWidth = $derived(Math.max(0, Math.min(100, againstPct)));
</script>

<div class="w-full">
	<div class="mb-1 flex justify-between text-xs text-muted-foreground tabular-nums">
		<span>For {forPct.toFixed(0)}%</span>
		<span>Against {againstPct.toFixed(0)}%</span>
	</div>
	<div class="flex h-2 overflow-hidden rounded-full bg-muted">
		<div class="bg-success transition-all duration-700 ease-out" style="width: {forWidth}%"></div>
		<div
			class="bg-destructive transition-all duration-700 ease-out"
			style="width: {againstWidth}%"
		></div>
	</div>
</div>
