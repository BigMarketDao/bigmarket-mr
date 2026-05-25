<script lang="ts">
	import { PageContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { appConfigStore, initWallet, requireAppConfig } from '@bigmarket/bm-common';
	import VaultDeposit from '$lib/components/vault/VaultDeposit.svelte';
	import VaultWithdraw from '$lib/components/vault/VaultWithdraw.svelte';
	import VaultBalanceSummary from '$lib/components/vault/VaultBalanceSummary.svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let panel = $state<'deposit' | 'withdraw'>('deposit');

	onMount(() => {
		void initWallet(appConfig.VITE_BIGMARKET_API);
	});

	const tabBase = 'flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';
	const tabActive = 'bg-orange-500 text-white shadow-sm';
	const tabInactive =
		'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800';
</script>

<svelte:head>
	<title>BigMarket - Vault</title>
	<meta
		name="description"
		content="Deposit and withdraw USDC across Ethereum and Stacks for the BigMarket vault"
	/>
</svelte:head>

<PageContainer>
	<div class="flex w-full justify-center py-1">
		<div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="mb-6 space-y-4">
				<!-- Balance summary — visible whenever any wallet is connected -->
				<VaultBalanceSummary />

				<!-- Top-level Deposit / Withdraw tabs -->
				<div
					class="mx-auto flex gap-2 rounded-md border border-neutral-200 p-1 dark:border-neutral-600"
					role="tablist"
				>
					<button
						type="button"
						role="tab"
						aria-selected={panel === 'deposit'}
						class="{tabBase} {panel === 'deposit' ? tabActive : tabInactive}"
						onclick={() => (panel = 'deposit')}
					>
						Deposit
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={panel === 'withdraw'}
						class="{tabBase} {panel === 'withdraw' ? tabActive : tabInactive}"
						onclick={() => (panel = 'withdraw')}
					>
						Withdraw
					</button>
				</div>
			</div>
			<div class="w-full space-y-4">
				<!-- Source selector -->
				<div class="flex gap-1 rounded-md p-1 dark:border-neutral-600" role="tablist">
					{#if panel === 'deposit'}
						<div class="w-full">
							<VaultDeposit />
						</div>
					{:else}
						<div class="w-full">
							<VaultWithdraw />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</PageContainer>
