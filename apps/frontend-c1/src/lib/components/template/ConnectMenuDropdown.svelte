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
		chainStore,
		walletState
	} from '@bigmarket/bm-common';
	import { resolve } from '$app/paths';
	import { daoLink } from '$lib/core/tools/site';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import { ConnectButton } from '@bigmarket/bm-ui';
	import { Crown, Power, Trophy, Vote, Settings, Copy, Check } from 'lucide-svelte';
	import type { Icon } from 'lucide-svelte';
	import { scale } from 'svelte/transition';

	const TOKEN_TOOLTIPS: Record<string, string> = {
		STX: 'Used to pay for actions on BigMarket',
		BIG: 'Earn it by participating. Use it to vote.',
		sBTC: 'Bitcoin that works inside apps like BigMarket'
	};

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
	let addressCopied = $state(false);

	const allowedTokens = $derived($allowedTokenStore ?? []);
	const isTestnet = $derived(appConfig.VITE_NETWORK === 'testnet');
	const networkInfo = $derived(getCurrentNetwork());
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

	function formatBalanceDisplay(micro: number, decimals: number, suffix = ''): string {
		if (!micro) return '—';
		const formatted = fmtMicroToStx(micro, decimals);
		if (parseFloat(formatted) === 0) return '—';
		return suffix ? `${formatted} ${suffix}` : formatted;
	}

	function getFullWalletAddress(): string {
		if ($walletState.chain === 'stacks') {
			return showStacksAddress ? stxAddress : (btcAddress?.toUpperCase() ?? '');
		}
		return $walletState.activeAccount?.address ?? '';
	}

	function getNetworkDotClass(color: string): string {
		if (color === 'emerald') return 'bg-emerald-500';
		if (color === 'orange') return 'bg-orange-500';
		return 'bg-blue-500';
	}

	async function copyWalletAddress() {
		const address = getFullWalletAddress();
		if (!address || typeof navigator === 'undefined') return;
		await navigator.clipboard.writeText(address);
		addressCopied = true;
		setTimeout(() => {
			addressCopied = false;
		}, 1500);
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

{#snippet tokenRow(
	symbol: string,
	subtitle: string,
	balance: string,
	tooltip: string | undefined
)}
	<div
		class="group/token relative flex items-center justify-between rounded-md border-l-2 border-transparent px-3 py-2.5 transition duration-150 ease-out hover:border-l-accent hover:bg-black/5 dark:hover:bg-white/5"
	>
		<div class="flex flex-col gap-0.5">
			<span class="text-sm font-semibold text-foreground">{symbol}</span>
			{#if subtitle}
				<span class="text-xs text-muted-foreground">{subtitle}</span>
			{/if}
		</div>
		<span class="font-mono text-sm text-foreground">{balance}</span>
		{#if tooltip}
			<div
				class="pointer-events-none absolute bottom-full left-3 z-10 mb-1 max-w-[14rem] rounded-lg bg-popover px-2.5 py-1.5 text-xs text-popover-foreground opacity-0 shadow-md ring-1 ring-border transition-opacity duration-150 group-hover/token:opacity-100 dark:bg-card"
				role="tooltip"
			>
				{tooltip}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet navItem(
	NavIcon: typeof Icon,
	href: string,
	title: string,
	subtitle: string
)}
	<a
		{href}
		class="group/nav flex w-full cursor-pointer items-start gap-3 rounded-md border-l-2 border-transparent px-3 py-2.5 transition duration-150 ease-out hover:border-l-accent hover:bg-black/5 dark:hover:bg-white/5"
	>
		<NavIcon class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
		<div class="min-w-0 flex-1">
			<div class="text-sm font-semibold text-foreground">{title}</div>
			<div class="text-xs text-muted-foreground">{subtitle}</div>
		</div>
	</a>
{/snippet}

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
				class="absolute top-full right-0 z-50 mt-2 min-w-[300px] origin-top-right overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl dark:border-white/10"
				transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
			>
				{#if isTestnet}
					<div
						class="border-b border-border bg-warning-soft px-4 py-2 text-center text-[11px] font-medium tracking-wide text-warning dark:border-white/10"
					>
						Test mode — not real funds
					</div>
				{/if}

				<div class="max-h-[min(32rem,80vh)] overflow-y-auto">
					<!-- Layer 1 — Identity -->
					<section class="space-y-3 p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1 space-y-2">
								<div class="flex items-center gap-1.5">
									<p
										class="truncate font-mono text-sm text-muted-foreground"
										title={getFullWalletAddress()}
									>
										{truncate(getFullWalletAddress())}
									</p>
									<button
										type="button"
										class="relative shrink-0 rounded p-0.5 text-muted-foreground transition hover:text-foreground"
										aria-label="Copy wallet address"
										onclick={copyWalletAddress}
									>
										{#if addressCopied}
											<Check class="h-4 w-4 text-accent" />
										{:else}
											<Copy class="h-4 w-4" />
										{/if}
										{#if addressCopied}
											<span
												class="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-2 py-1 text-[10px] text-foreground shadow-md ring-1 ring-border dark:bg-card"
											>
												Copied!
											</span>
										{/if}
									</button>
								</div>
								{#if $walletState.chain !== 'stacks' && $walletState.activeAccount?.mappedAddress}
									<div class="space-y-0.5">
										<p class="text-[10px] text-muted-foreground">Mapped wallet</p>
										<p
											class="truncate font-mono text-xs text-muted-foreground"
											title={$walletState.activeAccount.mappedAddress}
										>
											{$walletState.activeAccount.mappedAddress}
										</p>
									</div>
								{/if}
								<p class="text-xs text-muted-foreground">
									🏅 <span class="font-medium text-accent">
										{$userReputationStore.userReputationData?.weightedReputation || 0}
									</span> Reputation pts
								</p>
							</div>
							<span
								class="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground dark:border-white/10"
							>
								<span class="h-1.5 w-1.5 rounded-full {getNetworkDotClass(networkInfo.color)}"
								></span>
								Stacks · {networkInfo.name}
							</span>
						</div>
					</section>

					<hr class="border-border dark:border-white/10" />

					<!-- Layer 2 — Token balances -->
					<section class="space-y-0.5 p-2">
						{@render tokenRow(
							'STX',
							'for transactions & fees',
							showStacksAddress
								? formatBalanceDisplay(getStxBalanceMicro(), 6)
								: formatBalanceDisplay(getBtcBalanceMicro(), 8, 'BTC'),
							TOKEN_TOOLTIPS.STX
						)}

						{#if !bigAllowed}
							{@render tokenRow(
								'BIG',
								'your platform token',
								formatBalanceDisplay(getBalance(bigToken), 6),
								TOKEN_TOOLTIPS.BIG
							)}
						{/if}

						{#each allowedTokens as token (token.token)}
							{#if token.sip10Data?.symbol !== 'STX' && token.sip10Data?.symbol !== 'BIG'}
								{@const symbol = token.sip10Data?.symbol ?? ''}
								{@render tokenRow(
									symbol,
									symbol === 'sBTC' ? 'Bitcoin on Stacks' : '',
									formatBalanceDisplay(
										getBalance(token.token) || 0,
										token.sip10Data?.decimals ?? 6
									),
									TOKEN_TOOLTIPS[symbol]
								)}
							{/if}
						{/each}
					</section>

					<hr class="border-border dark:border-white/10" />

					<!-- Layer 3 — Navigation -->
					<section class="space-y-0.5 p-2">
						{@render navItem(
							Trophy,
							resolve('/reputation'),
							'Reputation Hub',
							'Your reputation score & rewards'
						)}
						{@render navItem(
							Crown,
							resolve('/reputation/leader-board'),
							'Top Traders',
							'See the leaderboard'
						)}
						{@render navItem(Vote, resolve(daoLink as '/'), 'Governance', 'Vote on proposals')}
						{@render navItem(Settings, resolve('/settings'), 'Settings', 'Customize experience')}

						<div class="px-3 py-2 text-[11px] text-muted-foreground/70">
							Bitcoin block
							<span class="font-mono text-muted-foreground">{fmtNumber(blockHeight)}</span>
						</div>
					</section>

					<hr class="border-border dark:border-white/10" />

					<div class="p-2">
						<button
							type="button"
							onclick={disWallet}
							class="group/nav flex w-full cursor-pointer items-start gap-3 rounded-md border-l-2 border-transparent px-3 py-2.5 text-left transition duration-150 ease-out hover:border-l-destructive hover:bg-destructive/5"
						>
							<Power class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
							<div>
								<div class="text-sm font-semibold text-destructive">Disconnect</div>
								<div class="text-xs text-muted-foreground">Log out anytime and take a break</div>
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
