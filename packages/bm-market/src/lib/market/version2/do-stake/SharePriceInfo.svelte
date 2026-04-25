<!-- SharePriceInfo.svelte -->
<script lang="ts">
	const { cost, maxPurchase } = $props<{
		cost: number;
		maxPurchase: number;
	}>(); 

</script>

<div class="mt-1 text-xs opacity-70">
	<div>1 share = <strong>{cost} {` `}</strong></div>
	<div>max purchasable = <strong>{maxPurchase}</strong> shares</div>
</div>
