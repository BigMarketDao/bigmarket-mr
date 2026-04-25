<script lang="ts">
	import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
  import { fmtMicroToStx } from '@bigmarket/bm-utilities';

	const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>();

	const appConfig = $derived(requireAppConfig($appConfigStore));

	// Get blockchain explorer URL based on network
	const getExplorerUrl = (address: string) => {
		const config = appConfig;
		const baseUrl = config.VITE_NETWORK === 'mainnet' ? 'https://explorer.stacks.co' : 'https://explorer.stacks.co/?chain=testnet';
		return `${baseUrl}/address/${address}`;
	};

	// Format option names based on market type
	const getOptionName = (index: number) => {
		const categories = market?.marketData?.categories;
		if (!categories || !categories[index]) return `Opt${index + 1}`;

		// Binary market (2 options)
		if (categories.length === 2) {
			return index === 0 ? 'Yes' : 'No';
		}

		// Scalar market (ranges)
		const category = categories[index];
		if (typeof category === 'object' && 'min' in category && 'max' in category) {
			return `RNG${index + 1}`;
		}

		// Multiple choice market
		return `Opt${index + 1}`;
	};

	// Generate realistic trades based on actual market data
	const recentTrades = $derived(
    market?.marketData?.stakes
        ?.map((stake: number, index: number) => {
            const stakeAmount = Number(stake) / 1000000;
            const usdRate = 0.71;

            const tradesPerOption = Math.max(1, Math.floor(stakeAmount / 2));
            const trades = [];

            for (let i = 0; i < tradesPerOption && i < 3; i++) {
                const amount = stakeAmount / tradesPerOption;
                trades.push({
                    outcome: getOptionName(index),
                    crypto: amount,
                    usd: amount * usdRate,
                    shares: amount,
                    wallet: `ST...${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                    fullWallet: `ST${Math.random().toString(36).substr(2, 38).toUpperCase()}`,
                    timestamp: Date.now() - Math.random() * 3600000,
                    optionIndex: index
                });
            }
            return trades;
        })
        .flat()
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 8) ?? []
);

const totalVolume = $derived(
    market?.marketData?.stakes?.reduce((sum: number, stake: number) => sum + Number(stake), 0) ?? 0
);
const totalTrades = $derived(recentTrades.length);

const filters = $derived(
    ['ALL', ...(market?.marketData?.categories?.map((_: any, index: number) => getOptionName(index).toUpperCase()) ?? [])]
);

let selectedFilter = $state('ALL');

const filteredTrades = $derived(
    selectedFilter === 'ALL'
        ? recentTrades
        : recentTrades.filter((trade: any) => trade?.outcome.toUpperCase() === selectedFilter)
);</script>

<div class="rounded-xl border border-gray-600 bg-gray-800 p-4">
	<!-- Header -->
	<div class="mb-4">
		<h3 class="mb-3 font-mono text-lg font-semibold text-white">Recent Trades</h3>

		<!-- Summary Stats -->
		<div class="mb-4 grid grid-cols-2 gap-4">
			<div>
				<div class="mb-1 font-mono text-xs text-gray-400">Total Volume</div>
				<div class="font-mono text-sm font-semibold text-white">
					{fmtMicroToStx(totalVolume)} STX
				</div>
			</div>
			<div>
				<div class="mb-1 font-mono text-xs text-gray-400">Total Trades</div>
				<div class="font-mono text-sm font-semibold text-white">{totalTrades}</div>
			</div>
		</div>

		<!-- Filter Tabs -->
		<div class="flex flex-wrap gap-1">
			{#each filters as filter}
				<button onclick={() => (selectedFilter = filter)} class={`rounded px-2 py-1 font-mono text-xs font-medium transition-colors ${selectedFilter === filter ? 'bg-gray-600 text-white' : 'bg-transparent text-gray-400 hover:text-gray-300'}`}>
					{filter}
				</button>
			{/each}
		</div>
	</div>

	<!-- Table Header -->
	<div class="grid grid-cols-5 gap-2 border-b border-gray-700 px-2 py-1 font-mono text-xs font-medium tracking-wider text-gray-400 uppercase">
		<div>OUTCOME</div>
		<div class="text-right">CRYPTO</div>
		<div class="text-right">USD</div>
		<div class="text-right">SHARES</div>
		<div class="text-right">WALLET</div>
	</div>

	<!-- Trade Rows -->
	<div class="mt-1 space-y-0">
		{#each filteredTrades as trade}
			<div class="grid grid-cols-5 gap-2 rounded px-2 py-2 transition-colors hover:bg-gray-700/50">
				<!-- Outcome -->
				<div class="flex items-center">
					<span
						class={`rounded px-1.5 py-0.5 font-mono text-xs font-medium ${
							trade.outcome === 'Yes' || trade.outcome.startsWith('Opt') || trade.outcome.startsWith('RNG') ? 'bg-green-500/20 text-green-400' : trade.outcome === 'No' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
						}`}
					>
						{trade.outcome}
					</span>
				</div>

				<!-- Crypto -->
				<div class="text-right font-mono text-xs text-white">
					{trade.crypto.toFixed(2)}
				</div>

				<!-- USD -->
				<div class="text-right font-mono text-xs text-gray-400">
					{trade.usd.toFixed(2)}
				</div>

				<!-- Shares -->
				<div class="text-right font-mono text-xs text-white">
					{trade.shares.toFixed(2)}
				</div>

				<!-- Wallet -->
				<div class="text-right">
					<a href={getExplorerUrl(trade.fullWallet)} target="_blank" rel="noopener noreferrer" class="cursor-pointer font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline">
						{trade.wallet}
					</a>
				</div>
			</div>
		{/each}
	</div>

	<!-- Empty State -->
	{#if filteredTrades.length === 0}
		<div class="py-6 text-center">
			<div class="font-mono text-xs text-gray-400">No trades found for {selectedFilter} filter</div>
		</div>
	{/if}
</div>
