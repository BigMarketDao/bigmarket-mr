<!-- SlippageSlider.svelte -->
<script lang="ts">
	let { slippage, setSlippage } = $props<{
		slippage: number;
		setSlippage: (s: number) => void;
	}>(); 
	let slippageValue = $state(slippage);

</script>

<div class="mt-6 w-full">
	<label for="input1" class="mb-2 flex items-center justify-between">
		<span class="label-text text-base font-medium">Slippage Tolerance</span>
		<span class="label-text-alt text-sm text-gray-900 dark:text-gray-100">{(slippage * 100).toFixed(1)}%</span>
	</label>
	<input id="input1" class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-orange-600 dark:bg-zinc-700 dark:accent-orange-500" type="range" min="0" max="0.6" step="0.05" bind:value={slippageValue} oninput={() => setSlippage(slippageValue)} />
	<div class=" mt-1 flex w-full justify-between px-1 text-xs text-gray-900 dark:text-gray-100">
		<span>0%</span>
		<span>0.3%</span>
		<span>0.6%</span>
	</div>
</div>
