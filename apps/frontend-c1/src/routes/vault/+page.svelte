<script lang="ts">
	import { PageContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { appConfigStore, initWallet, requireAppConfig, walletState } from '@bigmarket/bm-common';
	import BridgeFunds from '$lib/components/vault/BridgeFunds.svelte';
	import ManageFunds from '$lib/components/vault/ManageFunds.svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let panel = $state<'bridge' | 'manage'>('bridge');

	const stacksConnected = $derived(
		$walletState.status === 'connected' &&
			$walletState.chain === 'stacks' &&
			$walletState.accounts.some((a) => a.type === 'stx' && a.address.length > 0)
	);

	onMount(() => {
		void initWallet(appConfig.VITE_BIGMARKET_API);
	});

	function selectPanel(next: 'bridge' | 'manage') {
		if (next === 'manage' && !stacksConnected) return;
		panel = next;
	}
</script>

<svelte:head>
	<title>BigMarket - Vault</title>
	<meta
		name="description"
		content="Bridge and manage USDC across Ethereum and Stacks for BigMarket vault"
	/>
</svelte:head>

<PageContainer>
	<div class="flex w-full justify-center bg-white py-1 dark:bg-gray-900">
		<div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="mb-6 space-y-4">
				<div
					class="mx-auto flex max-w-lg gap-2 rounded-md border border-neutral-200 p-1 dark:border-neutral-600"
					role="tablist"
				>
					<button
						type="button"
						role="tab"
						aria-selected={panel === 'bridge'}
						class="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors {panel ===
						'bridge'
							? 'bg-orange-500 text-white shadow-sm'
							: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'}"
						onclick={() => selectPanel('bridge')}
					>
						Bridge funds
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={panel === 'manage'}
						aria-disabled={!stacksConnected}
						title={stacksConnected ? undefined : 'Connect a Stacks wallet to manage vault funds'}
						class="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors {panel ===
						'manage'
							? 'bg-orange-500 text-white shadow-sm'
							: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'} {!stacksConnected
							? 'cursor-not-allowed opacity-50'
							: ''}"
						onclick={() => selectPanel('manage')}
					>
						Manage vault
					</button>
				</div>

				{#if panel === 'manage' && !stacksConnected}
					<p class="mx-auto max-w-lg text-sm text-amber-800 dark:text-amber-200">
						Connect with a <strong>Stacks</strong> wallet to view balances and deposit USDCx into the
						vault.
					</p>
				{/if}
			</div>
			<div class="mx-auto flex max-w-lg gap-2 rounded-md p-1" role="tablist">
				{#if panel === 'bridge'}
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Bridge USDC or USDT between Ethereum and Stacks, then move bridged USDCx into your
						vault.
					</p>
				{:else if stacksConnected}
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Manage funds in your BigMarket vault.
					</p>
				{/if}
			</div>

			<div class="flex w-full justify-center">
				{#if panel === 'bridge'}
					<BridgeFunds />
				{:else if stacksConnected}
					<ManageFunds />
				{/if}
			</div>
		</div>
	</div>
</PageContainer>
