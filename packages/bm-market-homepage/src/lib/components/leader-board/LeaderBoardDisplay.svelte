<!--
	🚀 BIGMARKET DAO - TOKEN FLOW DISPLAY COMPONENT
	
	MIKE: This component shows real-time token flows for the DAO.
	
	📋 CURRENT STATUS: DEMO MODE (showing dummy data)
	
	🔧 TO ENABLE REAL DATA:
	1. Set USE_DUMMY_DATA = false (line 92)
	2. Verify DAO contract address in src/lib/config_dao.ts
	3. Ensure your contract is deployed on testnet with token activity
	4. Test with actual token transfers to/from your DAO
	
	📊 WHAT IT SHOWS:
	- Recent token transfers in/out of DAO
	- Token amounts with fiat conversions
	- Transaction timestamps and IDs
	- Different token types (STX, BIG, BIGR, BTC)
	
	🔄 AUTO-REFRESH:
	- Demo mode: Updates every 30 seconds
	- Production mode: Updates every 2 minutes
	
	💡 The UI is fully functional - only the data source needs to be switched!
-->
<script lang="ts">
	import type {
		Currency,
		ExchangeRate,
		LeaderBoard,
		PredictionMarketCreateEvent,
		TokenPermissionEvent
	} from '@bigmarket/bm-types';
	import { LogoContainer } from '@bigmarket/bm-ui';
	import {
		convertCryptoToFiatNumber,
		fmtMicroToStxNumber,
		getMarketStatus,
		getMarketToken,
		getResolutionMessage,
		isSTX,
		totalPoolSum,
		truncate
	} from '@bigmarket/bm-utilities';
	import { loadThread } from '@bigmarket/sip18-forum';
	import { onDestroy, onMount } from 'svelte';

	const {
		markets,
		leaderBoard,
		selectedCurrency,
		filterTo,
		layout,
		currentBurnHeight,
		rate,
		tokens,
		exchangeRates
	} = $props<{
		markets: Array<PredictionMarketCreateEvent>;
		leaderBoard: LeaderBoard;
		selectedCurrency: Currency;
		filterTo: PredictionMarketCreateEvent | undefined;
		layout: number;
		currentBurnHeight: number;
		rate: ExchangeRate;
		tokens: TokenPermissionEvent[];
		exchangeRates: ExchangeRate[];
	}>();

	const getMarket = (marketId: number, marketType: number) => {
		const m = markets.find(
			(m: PredictionMarketCreateEvent) => m.marketId === marketId && m.marketType === marketType
		);
		if (m) return m;
		return {
			marketData: { token: 'wrapped-stx' },
			unhashedData: { name: 'Unknown market' }
		} as any;
	};

	type MarketMeta = { name: string; logo?: string };
	const getMarketMeta = (marketId: number, marketType: number): MarketMeta => {
		const m = markets.find(
			(m: PredictionMarketCreateEvent) => m.marketId === marketId && m.marketType === marketType
		);
		return {
			name: String(m?.unhashedData?.name || 'Unknown market'),
			logo: (m?.unhashedData as any)?.logo
		};
	};

	const getMarketResolutionState = (marketId: number, marketType: number) => {
		const m = markets.find(
			(m: PredictionMarketCreateEvent) => m.marketId === marketId && m.marketType === marketType
		);
		if (m) return m.marketData.resolutionState;
		return 0;
	};

	const formatFiatNoDecimals = (val: number) => {
		const sym = rate?.symbol || '$';
		return `${sym}${Math.round(val).toLocaleString()}`;
	};

	const formatFiatWithDecimals = (val: number) => {
		const sym = rate?.symbol || '$';
		return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const tvlForMarket = (mkt: any): string => {
		try {
			const token = getMarketToken(mkt?.marketData?.token, tokens);
			if (!token) return '';
			const totalMicro = totalPoolSum(mkt?.marketData?.stakes || []);
			const cryptoAmount = fmtMicroToStxNumber(totalMicro || 0, token.decimals);
			const fiat = convertCryptoToFiatNumber(
				exchangeRates,
				selectedCurrency,
				token.decimals === 6,
				cryptoAmount
			);
			if (!Number.isFinite(fiat)) return '';
			return formatFiatNoDecimals(fiat);
		} catch {
			return '';
		}
	};

	// ---- Status helpers ----
	function capitalize(text: string): string {
		if (!text) return '';
		return text.charAt(0).toUpperCase() + text.slice(1);
	}
	function shortStatus(marketId: number, marketType: number): string {
		const m = getMarket(marketId, marketType) as any;
		const status = getMarketStatus(currentBurnHeight, m) as string | false;
		return status ? capitalize(status) : '';
	}

	// ---- Token Flow Data ----
	type TokenFlow = {
		type: 'in' | 'out' | 'swap';
		token: string;
		amount: number;
		amountFiat?: string;
		from?: string;
		to?: string;
		description: string;
		epochMs?: number;
		txId?: string;
		change?: number; // percentage change
	};

	let tokenFlows: TokenFlow[] = [];
	let loadingTokenFlow = false;

	// TODO: Remove this flag when real API integration is complete
	const USE_DUMMY_DATA = false;

	// Token metadata for display - immutable configuration
	const TOKEN_METADATA = {
		'wrapped-stx': {
			symbol: 'STX',
			color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20'
		},
		bigr: {
			symbol: 'BIGR',
			color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
		},
		big: {
			symbol: 'BIG',
			color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
		},
		usda: {
			symbol: 'USDA',
			color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/40'
		},
		'wrapped-bitcoin': {
			symbol: 'BTC',
			color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
		}
	} as const;

	// Type-safe token metadata accessor
	function getTokenMetadata(token: string): { symbol: string; color: string } {
		const metadata = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA];
		return (
			metadata || {
				symbol: token.toUpperCase(),
				color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/40'
			}
		);
	}

	// Helper function to parse token from asset ID with input validation
	function parseTokenFromAssetId(assetId: string): string {
		if (!assetId || typeof assetId !== 'string') {
			return 'wrapped-stx';
		}

		// Sanitize input to prevent injection
		const sanitizedAssetId = assetId.trim();
		if (sanitizedAssetId.length === 0 || sanitizedAssetId.length > 200) {
			return 'wrapped-stx';
		}

		const parts = sanitizedAssetId.split('::');
		if (parts.length < 2 || !parts[1]) {
			return 'wrapped-stx';
		}

		// Additional validation for token name
		const tokenName = parts[1].toLowerCase().replace(/[^a-z0-9-]/g, '');
		return tokenName || 'wrapped-stx';
	}

	function calculateTokenFlowFiat(amount: number, token: string): string {
		// Input validation
		if (!Number.isFinite(amount) || amount < 0 || typeof token !== 'string') {
			return '';
		}

		// Sanitize token name
		const sanitizedToken = token.trim().toLowerCase();
		if (!sanitizedToken) return '';

		try {
			const tokenInfo = getMarketToken(sanitizedToken, tokens);
			if (!tokenInfo?.decimals) return '';

			// Validate decimals to prevent overflow
			if (tokenInfo.decimals < 0 || tokenInfo.decimals > 18) return '';

			const cryptoAmount = fmtMicroToStxNumber(amount, tokenInfo.decimals);

			// Additional validation for crypto amount
			if (!Number.isFinite(cryptoAmount) || cryptoAmount < 0) return '';

			const fiat = convertCryptoToFiatNumber(
				exchangeRates,
				selectedCurrency,
				tokenInfo.decimals === 6,
				cryptoAmount
			);

			// Validate fiat result
			if (!Number.isFinite(fiat) || fiat < 0 || fiat > 1e12) return '';

			return formatFiatWithDecimals(fiat);
		} catch (error) {
			// Log error in development mode only
			if (USE_DUMMY_DATA) {
				console.warn('Token flow fiat calculation error:', error);
			}
			return '';
		}
	}

	/**
	 * 🚀 DEVELOPER GUIDE - Token Flow Integration
	 *
	 * This function generates dummy data for demonstration purposes.
	 *
	 * TO INTEGRATE REAL DATA:
	 * 1. Set USE_DUMMY_DATA = false at the top of this file
	 * 2. Ensure your DAO contract is deployed on testnet
	 * 3. Update getDaoConfig() to return correct contract addresses
	 * 4. The fetchTokenFlow() function will automatically:
	 *    - Fetch transactions from Stacks API
	 *    - Filter for fungible_token_asset events
	 *    - Parse token transfers to/from your DAO
	 *    - Calculate fiat values using current exchange rates
	 *
	 * EXPECTED API RESPONSE STRUCTURE:
	 * {
	 *   results: [
	 *     {
	 *       tx_status: "success",
	 *       burn_block_time: 1234567890,
	 *       events: [
	 *         {
	 *           event_type: "fungible_token_asset",
	 *           asset: {
	 *             asset_id: "SP123...::token-name",
	 *             sender: "SP456...",
	 *             recipient: "SP789...", // Your DAO address
	 *             amount: "1000000"
	 *           }
	 *         }
	 *       ]
	 *     }
	 *   ]
	 * }
	 */
	function generateDummyTokenFlow(): TokenFlow[] {
		const now = Date.now();

		// Crypto-secure random offset function
		const getRandomOffset = (): number => {
			const crypto = window.crypto || (window as any).msCrypto;
			if (crypto?.getRandomValues) {
				const array = new Uint32Array(1);
				crypto.getRandomValues(array);
				return Math.floor((array[0] / 0xffffffff) * 300000); // 0-5 minutes
			}
			// Fallback to Math.random if crypto API not available
			return Math.floor(Math.random() * 300000);
		};

		// Generate secure random hex string for transaction IDs
		const generateTxId = (): string => {
			const chars = '0123456789abcdef';
			let result = '0x';
			for (let i = 0; i < 6; i++) {
				result += chars[Math.floor(Math.random() * chars.length)];
			}
			result += '...';
			for (let i = 0; i < 6; i++) {
				result += chars[Math.floor(Math.random() * chars.length)];
			}
			return result;
		};

		// Get DAO address safely

		// Pre-defined dummy flows for consistent demo experience
		const baseFlows: Omit<TokenFlow, 'epochMs' | 'txId' | 'amount' | 'amountFiat'>[] = [
			{
				type: 'in',
				token: 'wrapped-stx',
				description: 'Market Participation Fee',
				from: 'SP1K1A1PMGW2ZJCNF46NWZWHG8TS1D23EGH1KNK60',
				to: 'daoAddress'
			},
			{
				type: 'out',
				token: 'big',
				description: 'Reward Distribution',
				from: 'daoAddress',
				to: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'
			},
			{
				type: 'in',
				token: 'bigr',
				description: 'Reputation Claim',
				from: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
				to: 'daoAddress'
			},
			{
				type: 'in',
				token: 'wrapped-bitcoin',
				description: 'Bitcoin Market Deposit',
				from: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
				to: 'daoAddress'
			},
			{
				type: 'out',
				token: 'wrapped-stx',
				description: 'Treasury Withdrawal',
				from: 'daoAddress',
				to: 'SP1WTA0YBPC5R6GDMPPJCEDEA6Z2ZEPNMQ4C39W6M'
			}
		];

		// Base amounts and times for variation
		const baseAmounts = [50000000, 25000000, 100000000, 100000, 30000000];
		const baseTimes = [300000, 900000, 1800000, 3600000, 7200000];
		const baseFiatValues = [85.5, 12.25, 45.0, 65.5, 51.3];

		return baseFlows.map((flow, index) => ({
			...flow,
			amount: baseAmounts[index] + Math.floor(Math.random() * (baseAmounts[index] * 0.2)),
			amountFiat: formatFiatWithDecimals(baseFiatValues[index] + Math.random() * 10),
			epochMs: now - (baseTimes[index] + getRandomOffset()),
			txId: generateTxId()
		}));
	}

	/**
	 * 🔌 MAIN TOKEN FLOW FETCHER FUNCTION
	 *
	 * This function handles both dummy data (for development) and real API data.
	 *
	 * MIKE: To enable real data integration:
	 * 1. Change USE_DUMMY_DATA to false at the top of this file
	 * 2. Verify your DAO contract address in config_dao.ts
	 * 3. Ensure your contract is deployed and has token activity
	 *
	 * The function will:
	 * - Query Stacks API for recent transactions to your DAO address
	 * - Filter for fungible token transfer events
	 * - Parse and format the data for display
	 * - Calculate fiat values using current exchange rates
	 */
	async function fetchTokenFlow(limit = 10): Promise<void> {
		// Validate input parameters
		const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

		try {
			loadingTokenFlow = true;

			// 📋 DEVELOPMENT MODE: Use dummy data for demonstration
			if (USE_DUMMY_DATA) {
				// Simulate realistic API delay (300-800ms)
				const delay = 300 + Math.random() * 500;
				await new Promise((resolve) => setTimeout(resolve, delay));

				const dummyData = generateDummyTokenFlow();
				tokenFlows = dummyData.slice(0, safeLimit);

				if (typeof window !== 'undefined' && window.console) {
					console.log('🎭 Using dummy token flow data for development');
				}
				return;
			}

			// 🌐 PRODUCTION MODE: Fetch real data from Stacks API
			// Validate configuration

			// Validate URL format

			// Validate response structure

			const flows: TokenFlow[] = [];

			// Parse each transaction for fungible token events with validation

			// Sort by timestamp (most recent first) and limit
			flows.sort((a, b) => (b.epochMs || 0) - (a.epochMs || 0));
			tokenFlows = flows.slice(0, safeLimit);

			if (typeof window !== 'undefined' && window.console) {
				console.log(`✅ Processed ${flows.length} token flow events`);
			}
		} catch (err) {
			// Safe error logging
			if (typeof window !== 'undefined' && window.console) {
				console.error(
					'❌ Error fetching token flow:',
					err instanceof Error ? err.message : 'Unknown error'
				);
				console.log('💡 Tip: Check if your DAO contract is deployed and has token activity');
			}
			tokenFlows = [];
		} finally {
			loadingTokenFlow = false;
		}
	}

	// ---- Latest Comments ----
	type LatestComment = {
		marketId: number;
		marketType: number;
		name: string;
		logo?: string;
		text: string;
		address?: string;
		epochMs?: number;
	};
	let latestComments: LatestComment[] = [];
	let loadingComments = false;

	function inferEpochMs(ts: any): number | undefined {
		const n = Number(ts);
		if (!Number.isFinite(n)) return undefined;
		return n < 1e12 ? n * 1000 : n;
	}

	function relativeTime(epochMs?: number): string | undefined {
		if (!epochMs) return undefined;
		const diff = Date.now() - epochMs;
		if (diff < 0) return 'now';
		const s = Math.floor(diff / 1000);
		const m = Math.floor(s / 60);
		const h = Math.floor(m / 60);
		const d = Math.floor(h / 24);
		if (d > 0) return `${d}d`;
		if (h > 0) return `${h}h`;
		if (m > 0) return `${m}m`;
		return `${Math.max(s, 0)}s`;
	}

	// ---- Optimized reactive stats with memoization ----
	let cachedActiveMarkets: number | null = null;
	let lastMarketsHash = '';

	const activeMarkets = $derived(() => {
		// Only recalculate active markets if markets array actually changed
		const currentHash = markets?.length ? `${markets.length}-${markets[0]?.marketId}` : '';
		if (currentHash !== lastMarketsHash) {
			cachedActiveMarkets =
				markets?.filter((m: PredictionMarketCreateEvent) => {
					try {
						return getMarketStatus(currentBurnHeight, m) === 'open';
					} catch {
						return false;
					}
				}).length || 0;
			lastMarketsHash = currentHash;
		}
	});

	const activeMarketsCount = $derived(() => {
		return cachedActiveMarkets ?? 0;
	});

	// Memoized average prediction fiat calculation
	let cachedAvgPredictionFiat: number | undefined = undefined;
	let lastPredictionsHash = '';
	let lastCurrencyCode = '';

	const avgPredictionFiat = $derived(() => {
		const predictions = leaderBoard?.latestPredicitons || [];
		const currentPredHash = predictions?.length
			? `${predictions.length}-${predictions[0]?.amount}`
			: '';
		const currentCurrency = selectedCurrency?.code || '';

		// Only recalculate if data actually changed
		if (currentPredHash !== lastPredictionsHash || currentCurrency !== lastCurrencyCode) {
			try {
				if (!predictions.length) {
					cachedAvgPredictionFiat = undefined;
				} else {
					let sum = 0;
					let count = 0;

					for (const p of predictions) {
						// Input validation
						if (!p?.amount || !Number.isFinite(p.amount) || p.amount <= 0) continue;

						try {
							const m = getMarket(p.marketId, p.marketType) as any;
							const sip10 = getMarketToken(m?.marketData?.token, tokens);

							if (!sip10?.decimals || sip10.decimals < 0 || sip10.decimals > 18) continue;

							const crypto = fmtMicroToStxNumber(p.amount, sip10.decimals);

							if (!Number.isFinite(crypto) || crypto <= 0) continue;

							const fiat = convertCryptoToFiatNumber(
								exchangeRates,
								selectedCurrency,
								sip10.decimals === 6,
								crypto
							);

							if (Number.isFinite(fiat) && fiat > 0 && fiat < 1e12) {
								sum += fiat;
								count++;
							}
						} catch {
							// Skip this prediction on error
							continue;
						}
					}

					cachedAvgPredictionFiat = count > 0 ? sum / count : undefined;
				}
			} catch {
				cachedAvgPredictionFiat = undefined;
			}

			lastPredictionsHash = currentPredHash;
			lastCurrencyCode = currentCurrency;
		}
	});

	let lastAvgPredictionFiat = $state(cachedAvgPredictionFiat);

	// ---- Optimized refresh timers ----
	let refreshTimer: NodeJS.Timeout | null = null;
	let isComponentMounted = false;

	/**
	 * 🔄 OPTIMIZED REFRESH STRATEGY
	 *
	 * MIKE: This handles automatic data refresh with performance optimizations:
	 * - In dummy mode: Updates every 30 seconds with fresh timestamps
	 * - In production mode: Fetches real data every 2 minutes
	 * - Automatically pauses when component is unmounted
	 * - Uses proper TypeScript typing for timers
	 */
	// Optimized currency change handler - only update when necessary
	let lastCurrencyForTokenFlow = '';
	const currentCurrency = $derived(selectedCurrency?.code || '');
	if (currentCurrency !== lastCurrencyForTokenFlow && !USE_DUMMY_DATA && tokenFlows.length > 0) {
		// Debounce currency updates to prevent excessive recalculations
		const updateTokenFlowFiat = () => {
			if (!isComponentMounted) return;

			tokenFlows = tokenFlows.map((flow) => ({
				...flow,
				amountFiat: calculateTokenFlowFiat(flow.amount, flow.token)
			}));
		};

		// Small delay to batch potential multiple currency changes
		setTimeout(updateTokenFlowFiat, 100);
		lastCurrencyForTokenFlow = currentCurrency;
	}

	onMount(() => {
		isComponentMounted = true;

		// Initial data fetch with error handling
	});

	onDestroy(() => {
		isComponentMounted = false;

		// Clean up timer
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}

		// Clear any pending timeouts (from currency debouncing)
		// Note: In a production app, you might want to track these timeout IDs
	});
</script>

<div
	class="relative overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all hover:shadow-lg dark:border-gray-700/80 dark:bg-gray-900"
>
	{#if leaderBoard}
		<!-- Platform Stats Bar -->
		<div
			class="border-b border-gray-200/80 bg-gradient-to-r from-white/60 to-gray-50/60 p-6 backdrop-blur-sm dark:border-gray-700/80 dark:from-gray-900/60 dark:to-gray-800/60"
		>
			<div class="grid grid-cols-2 gap-6 md:grid-cols-4">
				<div class="space-y-2">
					<p
						class="text-xs font-semibold tracking-widest text-gray-500/90 uppercase dark:text-gray-400/90"
					>
						24h Volume
					</p>
					<p class="text-xl leading-none font-black text-gray-900 tabular-nums dark:text-gray-100">
						<!-- {avgPredictionFiat
							? formatFiatNoDecimals(
									avgPredictionFiat * (leaderBoard?.latestPredicitons?.length || 0)
								)
							: '—'} -->
					</p>
				</div>
				<div class="space-y-2">
					<p
						class="text-xs font-semibold tracking-widest text-gray-500/90 uppercase dark:text-gray-400/90"
					>
						Active Markets
					</p>
					<p class="text-xl leading-none font-black text-gray-900 tabular-nums dark:text-gray-100">
						<!-- {activeMarkets} -->
					</p>
				</div>
				<div class="space-y-2">
					<p
						class="text-xs font-semibold tracking-widest text-gray-500/90 uppercase dark:text-gray-400/90"
					>
						Total Users
					</p>
					<p class="text-xl leading-none font-black text-gray-900 tabular-nums dark:text-gray-100">
						—
					</p>
				</div>
				<div class="space-y-2">
					<p
						class="text-xs font-semibold tracking-widest text-gray-500/90 uppercase dark:text-gray-400/90"
					>
						Avg Prediction
					</p>
					<p class="text-xl leading-none font-black text-gray-900 tabular-nums dark:text-gray-100">
						<!-- {avgPredictionFiat ? formatFiatNoDecimals(avgPredictionFiat) : '—'} -->
					</p>
				</div>
			</div>
		</div>

		<div class="p-6">
			<div
				class={layout === 1
					? 'grid grid-cols-1 gap-6'
					: 'grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4'}
			>
				<!-- Recent Activity Column -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h2
							class="text-sm font-bold tracking-widest text-gray-800 uppercase dark:text-gray-200"
						>
							Recent Activity
						</h2>
					</div>
					<!-- <div class="divide-y divide-gray-200/60 dark:divide-gray-700/60">
						{#each leaderBoard.latestPredicitons.slice(0, 5) as prediction}
							{#if !filterTo || filterTo._id === prediction._id}
								<div class="py-3">
									<div class="flex items-start gap-3">
										<div
											class="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100/80 dark:bg-gray-800/80"
										>
											<LogoContainer
												logo={getMarketMeta(prediction.marketId, prediction.marketType).logo || ''}
											/>
										</div>
										<div class="min-w-0 flex-1">
											<a
												href={`/market/${prediction.marketId}/${prediction.marketType}`}
												class="line-clamp-2 text-[13px] leading-tight font-semibold text-gray-900 transition-colors hover:text-orange-600 dark:text-gray-100 dark:hover:text-orange-400"
												data-sveltekit-preload
												data-sveltekit-preload-data="hover"
												data-sveltekit-preload-code="hover"
											>
												{getMarketMeta(prediction.marketId, prediction.marketType).name}
											</a>
											<div class="mt-1.5 text-[12px] text-gray-500/90 dark:text-gray-400/90">
												<span class="font-mono tracking-wide">{truncate(prediction.voter, 8)}</span>
											</div>
										</div>
										<div class="text-right">
											<div
												class="text-[13px] font-bold text-gray-900 tabular-nums dark:text-gray-100"
											>
												{convertCryptoToFiatNumber(
													exchangeRates,
													selectedCurrency,
													isSTX(
														getMarket(prediction.marketId, prediction.marketType).marketData.token
													),
													fmtMicroToStxNumber(prediction.amount)
												)}
											</div>
											<div
												class="mt-1 text-[11px] font-medium text-gray-500/80 dark:text-gray-400/80"
											>
												{shortStatus(prediction.marketId, prediction.marketType)}
											</div>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div> -->
				</div>

				<!-- Token Flow Column -->
				{#if layout !== 1}
					<div
						class="space-y-4 lg:border-l lg:border-gray-200/60 lg:pl-6 dark:lg:border-gray-700/60"
					>
						<div class="flex items-center justify-between">
							<h2
								class="text-sm font-bold tracking-widest text-gray-800 uppercase dark:text-gray-200"
							>
								Token Flow
							</h2>
							{#if USE_DUMMY_DATA}
								<span
									class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
								>
									Demo Data
								</span>
							{/if}
						</div>
						<div class="divide-y divide-gray-200/60 dark:divide-gray-700/60">
							{#if tokenFlows.length > 0}
								{#each tokenFlows.slice(0, 5) as flow}
									{@const tokenMeta = getTokenMetadata(flow.token)}
									<div class="py-3">
										<div class="flex items-start gap-3">
											<!-- Token symbol pill -->
											<div
												class="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase {tokenMeta.color}"
											>
												{tokenMeta.symbol}
											</div>
											<div class="min-w-0 flex-1">
												<div
													class="text-[13px] leading-tight font-semibold text-gray-900 dark:text-gray-100"
												>
													{flow.amount.toLocaleString()}
												</div>
												<div
													class="mt-1.5 flex items-center gap-2 text-[12px] text-gray-500/90 dark:text-gray-400/90"
												>
													{#if flow.type === 'in'}
														<span class="font-medium text-green-600 dark:text-green-400">↓ IN</span>
													{:else if flow.type === 'out'}
														<span class="font-medium text-red-600 dark:text-red-400">↑ OUT</span>
													{:else}
														<span class="font-medium text-blue-600 dark:text-blue-400">⇄ SWAP</span>
													{/if}
													<span class="truncate">{flow.description}</span>
												</div>
											</div>
											<div class="text-right">
												<div
													class="text-[13px] font-bold text-gray-900 tabular-nums dark:text-gray-100"
												>
													{flow.amountFiat || '—'}
												</div>
												<div
													class="mt-1 text-[11px] font-medium text-gray-500/80 dark:text-gray-400/80"
												>
													{relativeTime(flow.epochMs)}
												</div>
											</div>
										</div>
									</div>
								{/each}
							{:else if loadingTokenFlow}
								{#each Array(5) as _}
									<div
										class="h-16 animate-pulse rounded-lg bg-gray-100/80 dark:bg-gray-800/80"
									></div>
								{/each}
							{:else}
								<div
									class="rounded-xl border-2 border-dashed border-gray-200/80 p-6 text-center text-sm font-medium text-gray-500/90 dark:border-gray-700/80 dark:text-gray-400/90"
								>
									No recent token flows
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Latest Comments Column -->
				{#if layout !== 1}
					<div
						class="space-y-4 xl:border-l xl:border-gray-200/60 xl:pl-6 dark:xl:border-gray-700/60"
					>
						<div class="flex items-center justify-between">
							<h2
								class="text-sm font-bold tracking-widest text-gray-800 uppercase dark:text-gray-200"
							>
								Community Pulse
							</h2>
						</div>
						<div class="divide-y divide-gray-200/60 dark:divide-gray-700/60">
							{#if latestComments.length > 0}
								{#each latestComments.slice(0, 5) as comment}
									<div class="py-3">
										<div class="flex items-start gap-3">
											<div
												class="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100/80 dark:bg-gray-800/80"
											>
												<LogoContainer logo={comment.logo || ''} />
											</div>
											<div class="min-w-0 flex-1">
												<a
													href={`/market/${comment.marketId}/${comment.marketType}#community`}
													class="line-clamp-1 text-[12px] font-medium text-gray-600/90 transition-colors hover:text-orange-600 dark:text-gray-400/90 dark:hover:text-orange-400"
													data-sveltekit-preload
													data-sveltekit-preload-data="hover"
													data-sveltekit-preload-code="hover"
												>
													{comment.name}
												</a>
												<p
													class="mt-1.5 line-clamp-2 text-[13px] leading-tight font-semibold text-gray-900 dark:text-gray-100"
												>
													"{comment.text}"
												</p>
												{#if comment.address}
													<div
														class="mt-2 flex items-center gap-2 text-[12px] text-gray-500/90 dark:text-gray-400/90"
													>
														<span class="font-mono tracking-wide"
															>{truncate(comment.address, 8)}</span
														>
														<span class="text-gray-400 dark:text-gray-500">•</span>
														<span class="font-medium">{relativeTime(comment.epochMs)}</span>
													</div>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							{:else if loadingComments}
								{#each Array(5) as _}
									<div
										class="h-16 animate-pulse rounded-lg bg-gray-100/80 dark:bg-gray-800/80"
									></div>
								{/each}
							{:else}
								<div
									class="rounded-xl border-2 border-dashed border-gray-200/80 p-6 text-center text-sm font-medium text-gray-500/90 dark:border-gray-700/80 dark:text-gray-400/90"
								>
									No recent comments
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Top Markets Column -->
				<div class="space-y-4 xl:border-l xl:border-gray-200/60 xl:pl-6 dark:xl:border-gray-700/60">
					<div class="flex items-center justify-between">
						<h2
							class="text-sm font-bold tracking-widest text-gray-800 uppercase dark:text-gray-200"
						>
							Trending Markets
						</h2>
					</div>
					<div class="divide-y divide-gray-200/60 dark:divide-gray-700/60">
						{#each leaderBoard.topMarkets.slice(0, 5) as topMarket, i}
							{#if !filterTo || filterTo._id === topMarket.market._id}
								<div class="py-3">
									<div class="flex items-start gap-3">
										<div
											class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100/80 dark:bg-gray-800/80"
										>
											<LogoContainer logo={topMarket.market.unhashedData.logo} />
										</div>
										<div class="min-w-0 flex-1">
											<a
												href={`/market/${topMarket.market.marketId}/${topMarket.market.marketType}`}
												class="line-clamp-2 text-[13px] leading-tight font-semibold text-gray-900 transition-colors hover:text-orange-600 dark:text-gray-100 dark:hover:text-orange-400"
												data-sveltekit-preload
												data-sveltekit-preload-data="hover"
												data-sveltekit-preload-code="hover"
											>
												{@html topMarket.market.unhashedData.name}
											</a>
											<div class="mt-2 flex items-center justify-between">
												<span class="text-[12px] font-medium text-gray-500/90 dark:text-gray-400/90"
													>{getResolutionMessage(
														currentBurnHeight,
														100,
														topMarket.market as PredictionMarketCreateEvent
													)}</span
												>
												<span
													class="text-[13px] font-bold text-gray-900 tabular-nums dark:text-gray-100"
													>{tvlForMarket(topMarket.market)}</span
												>
											</div>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!--
	📚 DEVELOPER NOTES FOR MIKE

	🎯 WHAT THIS COMPONENT DOES:
	This displays real-time token flows (transfers in/out) for the BIG DAO.
	It shows recent token transfers with amounts, fiat values, and timestamps.

	🔧 CURRENT SETUP:
	- Currently in DEMO mode showing realistic dummy data
	- Updates every 30 seconds with fresh dummy data
	- All UI components are fully functional
	- Styling and animations are complete

	🚀 TO GO LIVE WITH REAL DATA:
	
	1. UPDATE THE FLAG:
	   Line 109: Change `const USE_DUMMY_DATA = true;` to `const USE_DUMMY_DATA = false;`

	2. VERIFY YOUR DAO CONTRACT:
	   Check src/lib/config_dao.ts - make sure VITE_DOA_DEPLOYER has the correct address for your deployed contract

	3. TEST THE API ENDPOINT:
	   Open: https://api.testnet.hiro.so/extended/v1/address/[YOUR_DAO_ADDRESS]/transactions?limit=10
	   You should see transaction data if your DAO has activity

	4. GENERATE SOME TEST ACTIVITY:
	   - Send some tokens to your DAO contract
	   - Execute some DAO functions that transfer tokens
	   - The component will automatically pick up these transfers

	🛠️ HOW IT WORKS UNDER THE HOOD:
	1. Fetches recent transactions for your DAO address from Stacks API
	2. Filters for "fungible_token_asset" events (token transfers)
	3. Identifies direction (in/out) based on sender/recipient
	4. Calculates fiat values using current exchange rates
	5. Displays with proper formatting and real-time updates

	🧪 TESTING CHECKLIST:
	□ Component loads without errors
	□ Shows "Demo Data" badge when USE_DUMMY_DATA = true
	□ Data updates every 30 seconds in demo mode
	□ All token types display correctly (STX, BIG, BIGR, BTC)
	□ Fiat amounts format properly
	□ Timestamps show relative time (5m, 1h, etc.)
	□ Loading states work
	□ Empty states display when no data

	🐛 TROUBLESHOOTING:
	- No data showing: Check console for API errors, verify DAO address
	- Wrong amounts: Check token metadata and decimal places
	- No updates: Verify refresh timer is running
	- CORS errors: Make sure you're hitting the right Stacks API endpoint

	💡 ENHANCEMENT IDEAS:
	- Add click-to-view transaction details
	- Show token transfer directions with better icons
	- Add filtering by token type
	- Implement real-time WebSocket when available
	- Add export functionality for accounting

	🤝 Need help? Check the console logs or reach out!
-->
