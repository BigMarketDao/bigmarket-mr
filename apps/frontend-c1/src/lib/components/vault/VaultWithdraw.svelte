<script lang="ts">
	import {
		appConfigStore,
		requireAppConfig,
		walletState
	} from '@bigmarket/bm-common';
	import VaultWithdrawBridge from './VaultWithdrawBridge.svelte';
	import VaultWithdrawBridgeOut from './VaultWithdrawBridgeOut.svelte';
	import VaultWithdrawStacks from './VaultWithdrawStacks.svelte';
	import VaultRelayAdmin from './VaultRelayAdmin.svelte';
	import type { WalletAccount } from '@bigmarket/bm-types';

	type ControllerChain = 'evm' | 'stacks';

	let chain = $state<ControllerChain>(
		$walletState.status === 'connected' && $walletState.chain === 'stacks' ? 'stacks' : 'evm'
	);

	const evmConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'ethereum'
	);
	const stacksConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'stacks'
	);

	const appConfig = $derived(requireAppConfig($appConfigStore));

	// ETH address for relay bridge-out step
	const ethAddress = $derived(
		$walletState.accounts.find((a: WalletAccount) => a.type === 'eth')?.address ?? ''
	);
</script>

<div class="w-full space-y-5">
	<!-- Chain selector -->
	<div class="grid grid-cols-2 gap-3">
		<!-- Ethereum card -->
		<button
			type="button"
			onclick={() => (chain = 'evm')}
			class="group flex flex-col gap-1.5 rounded-lg border-2 p-3 text-left transition-all {chain ===
			'evm'
				? 'border-green-500 bg-green-50/60 dark:border-green-500/70 dark:bg-green-900/10'
				: 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900/40 dark:hover:border-neutral-600'}"
		>
			<div class="flex items-center justify-between">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
					<polygon points="12,2 20,12 12,22 4,12" fill="#627EEA" opacity="0.85" />
					<polygon points="12,2 20,12 12,14.5" fill="#C0CBF6" />
					<polygon points="12,2 4,12 12,14.5" fill="white" opacity="0.9" />
					<polygon points="12,14.5 20,12 12,22" fill="#8197EE" />
					<polygon points="12,14.5 4,12 12,22" fill="#C0CBF6" opacity="0.8" />
				</svg>
				<span
					class="h-2 w-2 rounded-full {evmConnected
						? 'bg-green-500'
						: 'bg-neutral-300 dark:bg-neutral-600'}"
					title={evmConnected ? 'MetaMask connected' : 'MetaMask not connected'}
				></span>
			</div>
			<span
				class="text-sm font-semibold {chain === 'evm'
					? 'text-green-700 dark:text-green-400'
					: 'text-neutral-700 dark:text-neutral-300'}"
			>
				Ethereum
			</span>
			<span class="text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
				{evmConnected ? 'MetaMask connected' : 'Requires MetaMask'}
			</span>
		</button>

		<!-- Stacks card (coming soon) -->
		<button
			type="button"
			onclick={() => (chain = 'stacks')}
			class="group flex flex-col gap-1.5 rounded-lg border-2 p-3 text-left transition-all {chain ===
			'stacks'
				? 'border-green-500 bg-green-50/60 dark:border-green-500/70 dark:bg-green-900/10'
				: 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900/40 dark:hover:border-neutral-600'}"
		>
			<div class="flex items-center justify-between">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
					<circle cx="12" cy="12" r="11" fill="#FF5500" />
					<text
						x="12"
						y="16.5"
						text-anchor="middle"
						font-size="11"
						font-weight="bold"
						fill="white"
						font-family="sans-serif">S</text
					>
				</svg>
				<span
					class="h-2 w-2 rounded-full {stacksConnected
						? 'bg-green-500'
						: 'bg-neutral-300 dark:bg-neutral-600'}"
					title={stacksConnected ? 'Stacks wallet connected' : 'Stacks wallet not connected'}
				></span>
			</div>
			<span
				class="text-sm font-semibold {chain === 'stacks'
					? 'text-green-700 dark:text-green-400'
					: 'text-neutral-700 dark:text-neutral-300'}"
			>
				Stacks
			</span>
			<span class="text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
				{stacksConnected ? 'Hiro wallet connected' : 'Requires Hiro wallet'}
			</span>
		</button>
	</div>

	<!-- Context panel -->
	{#if chain === 'evm'}
		{#if evmConnected}
			<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
				Sign a withdrawal with MetaMask. The vault verifies your secp256k1 signature and releases
				USDCx to your mapped Stacks address, from where AllBridge bridges it back to Ethereum.
			</p>
		{/if}
		<VaultWithdrawBridge />

		{#if evmConnected && ethAddress}
			<VaultWithdrawBridgeOut />
		{/if}

		{#if evmConnected && ethAddress && appConfig.VITE_NETWORK !== 'mainnet'}
			<div
				class="rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3 dark:border-amber-700/50 dark:bg-amber-900/10"
			>
				<p class="mb-2 text-[11px] text-amber-700 dark:text-amber-400">
					Testnet: AllBridge is unavailable. Move relay USDCx to any Stacks address manually:
				</p>
				<VaultRelayAdmin />
			</div>
		{/if}
	{:else}
		{#if stacksConnected}
			<p class="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
				Withdraw USDCx from your vault balance to any Stacks address. Your wallet authorises the
				transaction directly — no relayer or bridge required.
			</p>
		{/if}
		<VaultWithdrawStacks />
	{/if}
</div>
