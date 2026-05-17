<!-- SlippageSlider.svelte -->
<script lang="ts">
	let {
		slippage = 0.02,
		setSlippage,
		label = 'Slippage Tolerance',
		min = 0,
		max = 0.6,
		step = 0.05,
		inputId = 'slippage-input',
	} = $props<{
		slippage: number;
		setSlippage: (s: number) => void;
		label?: string;
		min?: number;
		max?: number;
		step?: number;
		inputId?: string;
	}>();
	let slippageValue = $state(slippage);

	$effect(() => {
		slippageValue = slippage;
	});
</script>

<div class="form-control w-full">
	<label for={inputId} class="mb-2 flex items-center justify-between">
		<span class="text-sm font-medium text-[var(--color-card-foreground)]">{label}</span>
		<span class="text-sm text-[var(--color-muted-foreground)]">{(slippage * 100).toFixed(1)}%</span>
	</label>
	<input
		id={inputId}
		class="range range-primary w-full"
		type="range"
		{min}
		{max}
		{step}
		bind:value={slippageValue}
		oninput={() => setSlippage(slippageValue)}
	/>
</div>
