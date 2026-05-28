<script lang="ts">
	import { walletState } from '@bigmarket/bm-common';
	import VaultWithdrawBridge from './VaultWithdrawBridge.svelte';
	import VaultWithdrawStacks from './VaultWithdrawStacks.svelte';
	import MappedSweepPanel from './MappedSweepPanel.svelte';
	import VaultRelayAdmin from './VaultRelayAdmin.svelte';
	import type { WalletAccount } from '@bigmarket/bm-types';

	type ControllerChain = 'evm' | 'stacks';

	let showWithdrawDebug = $state(false);

	// Auto-select Stacks if already connected, otherwise default to EVM
	let chain = $state<ControllerChain>(
		$walletState.status === 'connected' && $walletState.chain === 'stacks' ? 'stacks' : 'evm'
	);

	const evmConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'ethereum'
	);
	const stacksConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'stacks'
	);

	// ETH address for MappedSweepPanel — needed to sweep mapped balance back to vault
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

		<!-- Debug toggle -->
		<div class="flex justify-end">
			<button
				type="button"
				onclick={() => (showWithdrawDebug = !showWithdrawDebug)}
				class="flex items-center gap-1 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
				title="Toggle relay debug panels"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					fill="currentColor"
					class="h-3 w-3 {showWithdrawDebug ? 'text-amber-500' : ''}"
				>
					<path
						fill-rule="evenodd"
						d="M6.455 1.45A.5.5 0 0 1 6.952 1h2.096a.5.5 0 0 1 .497.45l.186 1.858a4.996 4.996 0 0 1 1.466.848l1.703-.769a.5.5 0 0 1 .639.206l1.047 1.814a.5.5 0 0 1-.14.656l-1.517 1.09a5.026 5.026 0 0 1 0 1.694l1.516 1.09a.5.5 0 0 1 .141.656l-1.047 1.814a.5.5 0 0 1-.639.206l-1.703-.768a4.996 4.996 0 0 1-1.466.847l-.186 1.858a.5.5 0 0 1-.497.45H6.952a.5.5 0 0 1-.497-.45l-.186-1.858a4.996 4.996 0 0 1-1.466-.848l-1.703.769a.5.5 0 0 1-.639-.206L1.414 10.86a.5.5 0 0 1 .14-.656l1.517-1.09a5.025 5.025 0 0 1 0-1.694L1.554 6.33a.5.5 0 0 1-.14-.656L2.46 3.86a.5.5 0 0 1 .639-.206l1.703.769a4.996 4.996 0 0 1 1.466-.848L6.455 1.45ZM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class={showWithdrawDebug ? 'text-amber-500' : ''}>debug</span>
			</button>
		</div>

		{#if showWithdrawDebug}
			<div
				class="space-y-3 rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3 dark:border-amber-700/50 dark:bg-amber-900/10"
			>
				<p class="text-[11px] text-amber-700 dark:text-amber-400">
					Debug: manually sweep the mapped address or relay into the vault / a Stacks address.
				</p>
				{#if evmConnected && ethAddress}
					<MappedSweepPanel sourceChain="evm" sourceAddress={ethAddress} />
				{/if}
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
