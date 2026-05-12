<script lang="ts">
	import { fmtMicroToStx, fmtNumber, truncate } from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';
	import {
		bitcoinMode,
		disconnectWallet,
		isLoggedIn,
		showOnRampModal,
		userWalletStore,
		getBtcAddress,
		getStxAddress,
		allowedTokenStore,
		chainStore,
		walletState
	} from '@bigmarket/bm-common';
	import { resolve } from '$app/paths';
	import { daoLink } from '$lib/core/tools/site';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import { ConnectButton } from '@bigmarket/bm-ui';
	import { Crown, Power, Trophy, Vote, Settings, CreditCard, Blocks } from 'lucide-svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	function getTokenBalanceMicro(tokenContract: string, tokenBalances: unknown): number {
		if (!tokenBalances || typeof tokenBalances !== 'object') return 0;
		const ft = (tokenBalances as { fungible_tokens?: Record<string, { balance?: string }> })
			.fungible_tokens;
		if (!ft) return 0;
		for (const [key, val] of Object.entries(ft)) {
			const contractOnly = key.split('::')[0];
			if (contractOnly === tokenContract) {
				const b = val?.balance;
				return b ? parseInt(b, 10) : 0;
			}
		}
		return 0;
	}

	function getStxBalanceMicro(): number {
		return $userWalletStore.walletBalances?.stacks?.amount ?? 0;
	}

	function getBtcBalanceMicro(): number {
		const ks = $userWalletStore.sBTCBalance ?? 0;
		return ks;
	}

	let isOpen = $state(false);
	let dropdownRef = $state<HTMLElement | null>(null);
	let showStacksAddress = $state(true);
	let blockHeight = $state($chainStore.stacks.burn_block_height);
	let stxAddress = $state('');
	let btcAddress = $state('');
	let bigAllowed = $state(false);

	const allowedTokens = $derived($allowedTokenStore ?? []);
	const bigToken = $derived(
		`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}`
	);

	$effect(() => {
		showStacksAddress = !$bitcoinMode;
	});

	$effect(() => {
		blockHeight = $chainStore.stacks.burn_block_height ?? 0;
	});

	const disWallet = async () => {
		await disconnectWallet();
		if (typeof window === 'undefined') return;
		window.location.reload();
	};

	function getCurrentNetwork() {
		if (typeof window === 'undefined') return { name: 'TESTNET', color: 'orange' };
		const network = appConfig.VITE_NETWORK;
		switch (network) {
			case 'mainnet':
				return { name: 'MAINNET', color: 'emerald' };
			case 'testnet':
				return { name: 'TESTNET', color: 'orange' };
			case 'devnet':
				return { name: 'DEVNET', color: 'blue' };
			default:
				return { name: 'TESTNET', color: 'orange' };
		}
	}

	const handleConnect = () => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		showOnRampModal.set(!$showOnRampModal);
	};

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	function getBalance(token: string) {
		const tokenBalances = $userWalletStore.tokenBalances;
		return getTokenBalanceMicro(token, tokenBalances) || 0;
	}

	onMount(() => {
		if (isLoggedIn() && typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
		}
		if (isLoggedIn()) {
			btcAddress = getBtcAddress();
			stxAddress = getStxAddress();
		}
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('click', handleClickOutside);
			}
		};
	});
</script>

<div class="relative flex items-center gap-3" bind:this={dropdownRef}>
	{#if isLoggedIn()}
		<button
			class="inline-flex h-10 min-w-[160px] items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-900"
			onclick={() => (isOpen = !isOpen)}
		>
			<div class="flex items-center space-x-3">
				<div class="relative">
					<div class="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500"></div>
				</div>

				<div class="flex flex-col items-start">
					{#if $walletState.chain === 'stacks'}
						<div class="flex items-center space-x-2">
							<span class="text-sm font-semibold dark:text-gray-100">
								{truncate(showStacksAddress ? stxAddress : (getBtcAddress()?.toUpperCase() ?? ''))}
							</span>
							<span
								class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400"
							>
								{showStacksAddress ? 'STX' : 'BTC'}
							</span>
						</div>
					{:else}
						<div class="flex items-center space-x-2">
							<span class="text-sm font-semibold dark:text-gray-100">
								{truncate($walletState.activeAccount?.address)}
							</span>
							<span
								class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400"
							>
								{#if $walletState.chain === 'solana'}SOL{:else if $walletState.chain === 'ethereum'}ETH{:else}???{/if}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</button>

		{#if isOpen}
			<div
				class=" absolute top-full right-0 z-50 mt-2 w-80 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
			>
				<div class="max-h-80 space-y-3 overflow-y-auto p-4">
					<div class="space-y-3 p-4">
						<div class="space-y-1">
							<div class="text-xs text-gray-500 dark:text-gray-400">Connected wallet</div>
							<div class="flex items-center justify-between">
								{#if $walletState.chain === 'stacks'}
									<div
										class="max-w-[14rem] font-mono text-[10px] text-gray-900 dark:text-gray-100"
										title={showStacksAddress ? stxAddress : (btcAddress?.toUpperCase() ?? '')}
									>
										{showStacksAddress ? stxAddress : (btcAddress?.toUpperCase() ?? '')}
									</div>
								{:else}
									<div
										class="max-w-[14rem] font-mono text-[10px] text-gray-900 dark:text-gray-100"
										title={$walletState.activeAccount?.address}
									>
										{$walletState.activeAccount?.address}
									</div>
								{/if}
							</div>
						</div>

						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-500 dark:text-gray-400">STX</span>
								<div class="flex items-center gap-1.5">
									<CreditCard class="h-3 w-3 text-gray-400 dark:text-gray-500" />
									<span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
										{showStacksAddress
											? `${fmtMicroToStx(getStxBalanceMicro(), 6)}`
											: `${fmtMicroToStx(getBtcBalanceMicro(), 8)} BTC`}
									</span>
								</div>
							</div>
						</div>
						{#if !bigAllowed}
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-xs text-gray-500 dark:text-gray-400">BIG</span>
									<div class="flex items-center gap-1.5">
										<CreditCard class="h-3 w-3 text-gray-400 dark:text-gray-500" />
										<span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
											{fmtMicroToStx(getBalance(bigToken), 6)}
										</span>
									</div>
								</div>
							</div>
						{/if}
						{#each allowedTokens as token (token.token)}
							{#if token.sip10Data?.symbol !== 'STX'}
								<div class="space-y-1">
									<div class="flex items-center justify-between">
										<span class="text-xs text-gray-500 dark:text-gray-400"
											>{token.sip10Data?.symbol}</span
										>
										<div class="flex items-center gap-1.5">
											<CreditCard class="h-3 w-3 text-gray-400 dark:text-gray-500" />
											<span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
												{fmtMicroToStx(getBalance(token.token) || 0, token.sip10Data?.decimals)}
											</span>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>

					<hr class="my-3 border-gray-200 dark:border-gray-700" />
					<div class="space-y-3 px-4">
						<div class="mb-2 flex items-center justify-between">
							<div class="text-xs text-gray-500 dark:text-gray-400">Network</div>
							<span
								class="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
							>
								<div
									class="h-1.5 w-1.5 rounded-full {getCurrentNetwork().color === 'emerald'
										? 'bg-emerald-500'
										: getCurrentNetwork().color === 'orange'
											? 'bg-orange-500'
											: 'bg-blue-500'}"
								></div>
								Stacks · {getCurrentNetwork().name}
							</span>
						</div>
					</div>
					<hr class="my-3 border-gray-200 dark:border-gray-700" />

					<div class="space-y-1 px-3 py-2">
						<a
							href={resolve('/reputation')}
							class="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600"
							>
								<Trophy class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<div class="font-medium text-gray-900 dark:text-gray-100">Reputation Hub</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">Build your track record</div>
							</div>
						</a>
						<a
							href={resolve('/reputation/leader-board')}
							class="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600"
							>
								<Crown class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<div class="font-medium text-gray-900 dark:text-gray-100">Top Traders</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">See the leaderboard</div>
							</div>
						</a>
						<a
							href={resolve(daoLink as '/')}
							class="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600"
							>
								<Vote class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<div class="font-medium text-gray-900 dark:text-gray-100">Governance</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">Vote on proposals</div>
							</div>
						</a>
						<a
							href={resolve('/settings')}
							class="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600"
							>
								<Settings class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<div class="font-medium text-gray-900 dark:text-gray-100">Settings</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">Customize experience</div>
							</div>
						</a>
						<span
							class="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600"
							>
								<Blocks class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<div class="font-medium text-gray-900 dark:text-gray-100">Block height</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">{fmtNumber(blockHeight)}</div>
							</div>
						</span>
					</div>
					<hr class="my-2 border-gray-200 dark:border-gray-700" />

					<div class="p-3">
						<button
							onclick={disWallet}
							class="group w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-red-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-red-950"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 group-hover:bg-red-200 dark:bg-red-900 dark:group-hover:bg-red-800"
								>
									<Power class="h-4 w-4 text-red-600 dark:text-red-400" />
								</div>
								<div>
									<div class="font-medium">Disconnect</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										Log out anytime and take a break
									</div>
								</div>
							</div>
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<ConnectButton label="CONNECT WALLET" onConnectWallet={handleConnect} />
	{/if}
</div>
