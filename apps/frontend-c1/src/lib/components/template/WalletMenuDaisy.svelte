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
		chainStore
	} from '@bigmarket/bm-common';
	import { resolve } from '$app/paths';
	import { daoLink } from '$lib/core/tools/site';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import { ConnectButton } from '@bigmarket/bm-ui';
	import { Crown, Power, Trophy, Vote, Settings, CreditCard, Blocks } from 'lucide-svelte';

	const { menuPlacement = 'bottom' }: { menuPlacement?: 'top' | 'bottom' } = $props();
	const dropdownDirClass = $derived(menuPlacement === 'top' ? 'dropdown-top' : 'dropdown-bottom');

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

	function networkBadgeClass(color: 'emerald' | 'orange' | 'blue') {
		if (color === 'emerald') return 'badge-success badge-outline';
		if (color === 'blue') return 'badge-info badge-outline';
		return 'badge-warning badge-outline';
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

<div
	class="dropdown dropdown-end {dropdownDirClass}"
	class:dropdown-open={isOpen}
	bind:this={dropdownRef}
>
	{#if isLoggedIn()}
		<button
			type="button"
			tabindex="0"
			class="btn btn-outline btn-sm min-h-10 min-w-[160px] justify-between border-base-300 shadow-sm"
			onclick={() => (isOpen = !isOpen)}
		>
			<span class="flex items-center gap-2">
				<span class="h-2.5 w-2.5 shrink-0 rounded-full bg-success animate-pulse"></span>
				<span class="font-semibold">
					{truncate(showStacksAddress ? stxAddress : (getBtcAddress()?.toUpperCase() ?? ''))}
				</span>
				<span class="badge badge-ghost badge-sm">{showStacksAddress ? 'STX' : 'BTC'}</span>
			</span>
		</button>

		<div
			tabindex="-1"
			class="dropdown-content rounded-box border border-base-300 bg-base-100 z-[1000] mt-2 w-80 shadow-lg"
		>
			<div class="max-h-80 overflow-y-auto p-4">
				<div class="space-y-3">
					<div class="space-y-1">
						<p class="text-xs text-base-content/60">Connected wallet</p>
						<p
							class="font-mono text-[10px] leading-snug text-base-content break-all"
							title={showStacksAddress ? stxAddress : (btcAddress?.toUpperCase() ?? '')}
						>
							{showStacksAddress ? stxAddress : (btcAddress?.toUpperCase() ?? '')}
						</p>
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="text-xs text-base-content/60">STX</span>
						<div class="flex items-center gap-1.5">
							<CreditCard class="text-base-content/50 h-3 w-3" />
							<span class="text-sm font-semibold">
								{showStacksAddress
									? `${fmtMicroToStx(getStxBalanceMicro(), 6)}`
									: `${fmtMicroToStx(getBtcBalanceMicro(), 8)} BTC`}
							</span>
						</div>
					</div>

					{#if !bigAllowed}
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs text-base-content/60">BIG</span>
							<div class="flex items-center gap-1.5">
								<CreditCard class="text-base-content/50 h-3 w-3" />
								<span class="text-sm font-semibold">{fmtMicroToStx(getBalance(bigToken), 6)}</span>
							</div>
						</div>
					{/if}

					{#each allowedTokens as token (token.token)}
						{#if token.sip10Data?.symbol !== 'STX'}
							<div class="flex items-center justify-between gap-2">
								<span class="text-xs text-base-content/60">{token.sip10Data?.symbol}</span>
								<div class="flex items-center gap-1.5">
									<CreditCard class="text-base-content/50 h-3 w-3" />
									<span class="text-sm font-semibold">
										{fmtMicroToStx(getBalance(token.token) || 0, token.sip10Data?.decimals)}
									</span>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<div class="divider my-2"></div>

				<div class="mb-2 flex items-center justify-between px-1">
					<span class="text-xs text-base-content/60">Network</span>
					<span class="badge gap-1.5 {networkBadgeClass(getCurrentNetwork().color)}">
						<span class="h-1.5 w-1.5 rounded-full bg-current opacity-80"></span>
						Stacks · {getCurrentNetwork().name}
					</span>
				</div>

				<div class="divider my-2"></div>

				<ul class="menu menu-sm rounded-box bg-base-100 p-0">
					<li>
						<a href={resolve('/reputation')} class="gap-3" onclick={() => (isOpen = false)}>
							<Trophy class="h-4 w-4" />
							<span>
								<span class="font-medium">Reputation Hub</span>
								<span class="text-xs text-base-content/60 block">Build your track record</span>
							</span>
						</a>
					</li>
					<li>
						<a href={resolve('/reputation/leader-board')} class="gap-3" onclick={() => (isOpen = false)}>
							<Crown class="h-4 w-4" />
							<span>
								<span class="font-medium">Top Traders</span>
								<span class="text-xs text-base-content/60 block">See the leaderboard</span>
							</span>
						</a>
					</li>
					<li>
						<a href={resolve(daoLink as '/')} class="gap-3" onclick={() => (isOpen = false)}>
							<Vote class="h-4 w-4" />
							<span>
								<span class="font-medium">Governance</span>
								<span class="text-xs text-base-content/60 block">Vote on proposals</span>
							</span>
						</a>
					</li>
					<li>
						<a href={resolve('/settings')} class="gap-3" onclick={() => (isOpen = false)}>
							<Settings class="h-4 w-4" />
							<span>
								<span class="font-medium">Settings</span>
								<span class="text-xs text-base-content/60 block">Customize experience</span>
							</span>
						</a>
					</li>
					<li>
						<span class="gap-3">
							<Blocks class="h-4 w-4" />
							<span>
								<span class="font-medium">Block height</span>
								<span class="text-xs text-base-content/60 block">{fmtNumber(blockHeight)}</span>
							</span>
						</span>
					</li>
				</ul>

				<div class="divider my-2"></div>

				<button type="button" class="btn btn-outline btn-error btn-block gap-2" onclick={disWallet}>
					<Power class="h-4 w-4" />
					<span class="text-start">
						<span class="font-medium block">Disconnect</span>
						<span class="text-xs font-normal opacity-80">Log out anytime and take a break</span>
					</span>
				</button>
			</div>
		</div>
	{:else}
		<ConnectButton label="CONNECT WALLET" onConnectWallet={handleConnect} />
	{/if}
</div>
