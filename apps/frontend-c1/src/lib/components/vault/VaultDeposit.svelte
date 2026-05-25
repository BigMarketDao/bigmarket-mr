<script lang="ts">
	import { walletState } from '@bigmarket/bm-common';
	import BridgeFunds from './BridgeFunds.svelte';
	import StacksVaultPanel from './StacksVaultPanel.svelte';

	type Source = 'bridge' | 'stacks';

	let source = $state<Source>(
		$walletState.status === 'connected' && $walletState.chain === 'stacks' ? 'stacks' : 'bridge'
	);

	const tabBase =
		'flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';
	const tabActive = 'bg-green-500 text-white shadow-sm';
	const tabInactive =
		'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800';
</script>

<div class="w-full space-y-4">
	<!-- Source selector -->
	<div
		class="flex gap-1 rounded-md border border-neutral-200 p-1 dark:border-neutral-600"
		role="tablist"
	>
		<button
			type="button"
			role="tab"
			aria-selected={source === 'bridge'}
			class="{tabBase} {source === 'bridge' ? tabActive : tabInactive}"
			onclick={() => (source = 'bridge')}
		>
			AllBridge
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={source === 'stacks'}
			class="{tabBase} {source === 'stacks' ? tabActive : tabInactive}"
			onclick={() => (source = 'stacks')}
		>
			Stacks wallet
		</button>
	</div>

	{#if source === 'bridge'}
		<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
			Bridge USDC or USDT from Ethereum to Stacks. USDCx lands on your mapped custody address and
			can then be moved to your vault.
		</p>
		<BridgeFunds initialFlow="deposit" locked />
	{:else}
		<!-- Unified Stacks panel: shared balances, direct + relay paths -->
		<StacksVaultPanel />
	{/if}
</div>
