<script lang="ts">
	import { fmtMicroToStx, fmtNumber, truncate } from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';
	import {
		bitcoinMode,
		disconnectWallet,
		isLoggedIn,
		showOnRampModal,
		userReputationStore,
		userWalletStore,
		getBtcAddress,
		getStxAddress,
		allowedTokenStore,
		chainStore
	} from '@bigmarket/bm-common';
	import { resolve } from '$app/paths';
	import { daoLink } from '$lib/core/tools/site';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import { ConnectButton } from '@bigmarket/bm-ui';

	const { menuPlacement = 'bottom' }: { menuPlacement?: 'top' | 'bottom' } = $props();

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
		return $userWalletStore.sBTCBalance ?? 0;
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
	const weightedKarma = $derived($userReputationStore.userReputationData?.weightedReputation ?? 0);

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
		if (typeof window === 'undefined') return { name: 'TESTNET', color: 'orange' as const };
		const network = appConfig.VITE_NETWORK;
		switch (network) {
			case 'mainnet':
				return { name: 'MAINNET', color: 'emerald' as const };
			case 'testnet':
				return { name: 'TESTNET', color: 'orange' as const };
			case 'devnet':
				return { name: 'DEVNET', color: 'blue' as const };
			default:
				return { name: 'TESTNET', color: 'orange' as const };
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

	function networkDotClass(color: 'emerald' | 'orange' | 'blue') {
		if (color === 'emerald') return 'bg-emerald-500';
		if (color === 'blue') return 'bg-sky-500';
		return 'bg-orange-500';
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

	const panelAnchor = $derived(
		menuPlacement === 'top' ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
	);
</script>

<div class="relative flex items-center" bind:this={dropdownRef}>
	{#if isLoggedIn()}
		<button
			type="button"
			class="inline-flex min-w-0 max-w-[min(100%,20rem)] items-center gap-2 border-b-2 bg-transparent px-1 py-3 text-left transition-[color,border-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-200 sm:px-2 {isOpen
				? 'border-zinc-900 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50'
				: 'border-zinc-300 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-400 dark:hover:text-zinc-50'}"
			onclick={() => (isOpen = !isOpen)}
			aria-expanded={isOpen}
			aria-haspopup="true"
		>
			<span
				class="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-sm font-semibold tabular-nums tracking-tight"
			>
				<span
					class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
					aria-hidden="true"
					title="Connected"
				></span>
				<span class="min-w-0 truncate [font-variant-caps:small-caps] normal-case" title={showStacksAddress ? stxAddress : (btcAddress || getBtcAddress() || '')}>
					{truncate(showStacksAddress ? stxAddress : (btcAddress || getBtcAddress() || ''), 3)}
				</span>
				<span class="shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true">·</span>
				<span class="shrink-0">{showStacksAddress ? 'STX' : 'BTC'}</span>
				<span class="shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true">·</span>
				<span class="shrink-0 whitespace-nowrap">{weightedKarma} Karma</span>
			</span>
		</button>

		{#if isOpen}
			<div
				class="absolute right-0 z-[1000] w-[min(19rem,calc(100vw-2rem))] border border-zinc-200 bg-white/95 shadow-sm backdrop-blur-md motion-safe:transition motion-safe:duration-150 dark:border-zinc-700 dark:bg-zinc-950/95 {panelAnchor}"
				role="region"
				aria-label="Wallet menu"
			>
				<div class="max-h-[min(24rem,70vh)] divide-y divide-zinc-200 overflow-y-auto overscroll-contain dark:divide-zinc-700">
					<div class="px-4 py-3">
						<p class="text-xs font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">Wallet</p>
						<p
							class="mt-1 break-all font-mono text-xs leading-relaxed text-zinc-900 dark:text-zinc-100"
							title={showStacksAddress ? stxAddress : (btcAddress?.toUpperCase() ?? '')}
						>
							{showStacksAddress ? stxAddress : (btcAddress?.toUpperCase() ?? '')}
						</p>
					</div>

					<div class="divide-y divide-zinc-100 px-4 text-sm dark:divide-zinc-800">
						<div class="flex items-center justify-between gap-3 py-2">
							<span class="text-xs font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">STX</span>
							<span class="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
								{showStacksAddress
									? fmtMicroToStx(getStxBalanceMicro(), 6)
									: `${fmtMicroToStx(getBtcBalanceMicro(), 8)} BTC`}
							</span>
						</div>
						{#if !bigAllowed}
							<div class="flex items-center justify-between gap-3 py-2">
								<span class="text-xs font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">BIG</span>
								<span class="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
									{fmtMicroToStx(getBalance(bigToken), 6)}
								</span>
							</div>
						{/if}
						{#each allowedTokens as token (token.token)}
							{#if token.sip10Data?.symbol !== 'STX'}
								<div class="flex items-center justify-between gap-3 py-2">
									<span class="text-xs font-semibold tracking-tight text-zinc-500 dark:text-zinc-400"
										>{token.sip10Data?.symbol}</span
									>
									<span class="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
										{fmtMicroToStx(getBalance(token.token) || 0, token.sip10Data?.decimals)}
									</span>
								</div>
							{/if}
						{/each}
					</div>

					<div class="flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-400">
						<span>Network</span>
						<span class="inline-flex items-center gap-1.5 tabular-nums text-zinc-900 dark:text-zinc-200">
							<span class="h-1.5 w-1.5 shrink-0 rounded-full {networkDotClass(getCurrentNetwork().color)}"></span>
							Stacks · {getCurrentNetwork().name}
						</span>
					</div>

					<nav class="flex flex-col" aria-label="Wallet actions">
						<a
							href={resolve('/reputation')}
							class="border-b border-zinc-100 px-4 py-2.5 text-sm font-semibold tracking-tight text-zinc-700 underline-offset-4 transition-colors hover:bg-zinc-50 hover:text-zinc-950 hover:underline dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50"
							onclick={() => (isOpen = false)}
						>
							Reputation Hub
						</a>
						<a
							href={resolve('/reputation/leader-board')}
							class="border-b border-zinc-100 px-4 py-2.5 text-sm font-semibold tracking-tight text-zinc-700 underline-offset-4 transition-colors hover:bg-zinc-50 hover:text-zinc-950 hover:underline dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50"
							onclick={() => (isOpen = false)}
						>
							Top Traders
						</a>
						<a
							href={resolve(daoLink as '/')}
							class="border-b border-zinc-100 px-4 py-2.5 text-sm font-semibold tracking-tight text-zinc-700 underline-offset-4 transition-colors hover:bg-zinc-50 hover:text-zinc-950 hover:underline dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50"
							onclick={() => (isOpen = false)}
						>
							Governance
						</a>
						<a
							href={resolve('/settings')}
							class="border-b border-zinc-100 px-4 py-2.5 text-sm font-semibold tracking-tight text-zinc-700 underline-offset-4 transition-colors hover:bg-zinc-50 hover:text-zinc-950 hover:underline dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50"
							onclick={() => (isOpen = false)}
						>
							Settings
						</a>
						<div
							class="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5 text-sm font-semibold tracking-tight text-zinc-700 dark:border-zinc-800 dark:text-zinc-400"
						>
							<span>Block height</span>
							<span class="font-mono tabular-nums text-zinc-900 dark:text-zinc-200">{fmtNumber(blockHeight)}</span>
						</div>
					</nav>

					<div class="px-4 py-2">
						<button
							type="button"
							class="w-full py-2 text-left text-sm font-semibold tracking-tight text-red-700 underline-offset-4 transition-colors hover:underline dark:text-red-400"
							onclick={disWallet}
						>
							Disconnect
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<ConnectButton label="CONNECT WALLET" onConnectWallet={handleConnect} />
	{/if}
</div>
