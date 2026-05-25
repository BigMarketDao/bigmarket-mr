<script lang="ts">
	import BridgeFunds from './BridgeFunds.svelte';

	type Destination = 'bridge' | 'stacks';

	let destination = $state<Destination>('bridge');

	const tabBase = 'flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';
	const tabActive = 'bg-green-500 text-white shadow-sm';
	const tabInactive =
		'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800';
</script>

<div class="w-full space-y-4">
	<!-- Destination selector -->
	<div
		class="flex gap-1 rounded-md border border-neutral-200 p-1 dark:border-neutral-600"
		role="tablist"
	>
		<button
			type="button"
			role="tab"
			aria-selected={destination === 'bridge'}
			class="{tabBase} {destination === 'bridge' ? tabActive : tabInactive}"
			onclick={() => (destination = 'bridge')}
		>
			AllBridge
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={destination === 'stacks'}
			title="Coming soon"
			class="{tabBase} {destination === 'stacks'
				? tabActive
				: tabInactive} cursor-not-allowed opacity-50"
			disabled
		>
			Stacks wallet
		</button>
	</div>

	{#if destination === 'bridge'}
		<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
			Bridge USDCx from Stacks back to Ethereum as USDC via AllBridge.
		</p>
		<BridgeFunds initialFlow="withdraw" locked />
	{:else}
		<div
			class="rounded-md border border-neutral-200 bg-neutral-50/60 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
		>
			<p class="text-sm text-neutral-600 dark:text-neutral-400">
				Direct withdrawal from vault to a Stacks address is coming soon.
			</p>
		</div>
	{/if}
</div>
