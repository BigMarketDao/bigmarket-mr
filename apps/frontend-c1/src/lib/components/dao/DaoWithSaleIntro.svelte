<script lang="ts">
	import { BarChart3, TrendingUp, Zap, DollarSign, Code } from 'lucide-svelte';

	let {
		stages,
		currentStage = 0
	}: {
		stages: any[];
		currentStage?: number;
	} = $props();
</script>

<div class="">
	<!-- Main Hero -->
	<div class="max-w-3xl">
		<h1 class="text-5xl leading-tight font-bold text-gray-900 lg:text-6xl dark:text-white">
			Own the Future of
			<span class="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent"> Prediction Markets </span>
		</h1>
		<p class="mt-6 text-xl leading-relaxed text-gray-600 dark:text-gray-400">
			The first prediction market protocol where <strong class="text-gray-900 dark:text-white">community predictions drive treasury investments</strong>. Your token doesn't just govern—it captures value from crowd wisdom.
		</p>
	</div>

	<!-- Modern Sale Timeline -->
	<div class="space-y-8">
		<div>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Sale Timeline</h2>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Early bird pricing - price increases each stage</p>
		</div>

		<div class="relative">
			<!-- Progress Background Line -->
			<div class="absolute top-6 right-6 left-6 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
			<!-- Active Progress Line -->
			<div class="absolute top-6 left-6 h-1 rounded-full bg-orange-500 transition-all duration-700 ease-out" style="width: calc({((currentStage + 1) / 6) * 100}% - 3rem);"></div>

			<!-- Timeline Stages -->
			<div class="relative grid grid-cols-6 gap-2">
				{#each stages as stageItem, index}
					<div class="flex flex-col items-center gap-3">
						<!-- Stage Circle with Smart Contract State -->
						<div
							class="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 {index === currentStage
								? 'border-orange-500 bg-orange-500 text-white shadow-lg'
								: index < currentStage
									? 'border-green-500 bg-green-500 text-white'
									: 'border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'}"
						>
							{#if index === currentStage}
								<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></div>
							{:else if index < currentStage}
								<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{:else}
								<span class="text-sm font-semibold">{index + 1}</span>
							{/if}
						</div>

						<!-- Stage Details -->
						<div class="space-y-1 text-center">
							<div class="text-sm font-bold text-gray-900 dark:text-white">
								${stageItem.price / 100}
							</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">
								{((stageItem.tokensSold / stageItem.maxSupply) * 100).toFixed(0)}% sold
							</div>
							{#if index === currentStage}
								<span class="inline-block rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white"> Active </span>
							{:else if index < currentStage}
								<span class="inline-block rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white"> Complete </span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Algorithmic Treasury Section -->
	<div class="space-y-8">
		<div>
			<h2 class="text-3xl font-bold text-gray-900 dark:text-white">
				Revolutionary <span class="text-orange-500">Treasury Algorithm</span>
			</h2>
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">The world's first prediction market that converts crowd wisdom into treasury alpha. When markets close, collective intelligence automatically drives treasury positioning.</p>
		</div>

		<!-- Algorithm Flow -->
		<div class="relative">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
				<!-- Step 1 -->
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 shadow-lg dark:bg-gray-800">
						<BarChart3 class="h-8 w-8 text-orange-500" />
					</div>
					<h3 class="mb-2 text-lg font-bold text-gray-900 dark:text-white">Market Closes</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">Community predictions recorded on-chain</p>
				</div>

				<!-- Step 2 -->
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 shadow-lg dark:bg-gray-800">
						<Zap class="h-8 w-8 text-orange-500" />
					</div>
					<h3 class="mb-2 text-lg font-bold text-gray-900 dark:text-white">Signal Generated</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">Algorithm analyzes prediction patterns</p>
				</div>

				<!-- Step 3 -->
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 shadow-lg dark:bg-gray-800">
						<TrendingUp class="h-8 w-8 text-orange-500" />
					</div>
					<h3 class="mb-2 text-lg font-bold text-gray-900 dark:text-white">Treasury Hedge</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">Automatic asset swaps based on signals</p>
				</div>

				<!-- Step 4 -->
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 shadow-lg dark:bg-gray-800">
						<DollarSign class="h-8 w-8 text-orange-500" />
					</div>
					<h3 class="mb-2 text-lg font-bold text-gray-900 dark:text-white">Profits to DAO</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">Returns benefit entire ecosystem</p>
				</div>
			</div>
		</div>

		<!-- Code Example -->
		<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
			<div class="mb-2 flex items-center gap-2">
				<Code class="h-4 w-4 text-gray-500 dark:text-gray-400" />
				<span class="text-sm text-gray-600 dark:text-gray-400">Smart Contract Evidence:</span>
			</div>
			<code class="font-mono text-sm text-green-600 dark:text-green-400"> execute-hedge(market-id, predicted-index) → perform-swap-hedge() → treasury.swap-tokens() </code>
		</div>
	</div>

	<!-- Multiple Revenue Streams -->
	<div class="space-y-8">
		<div>
			<h2 class="text-3xl font-bold text-gray-900 dark:text-white">Multiple Revenue Streams</h2>
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">BIG token holders benefit from every aspect of the platform</p>
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			<div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
					<DollarSign class="h-6 w-6 text-orange-500" />
				</div>
				<h3 class="mb-3 text-lg font-bold text-gray-900 dark:text-white">Protocol Fees</h3>
				<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Earn from every trade on the platform. DAO controls fee rates (currently 2-5% per transaction).</p>
				<div class="font-mono text-xs text-orange-500">dao-fee-bips → treasury</div>
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
					<TrendingUp class="h-6 w-6 text-orange-500" />
				</div>
				<h3 class="mb-3 text-lg font-bold text-gray-900 dark:text-white">Treasury Alpha</h3>
				<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Algorithmic hedge fund profits from crowd-signal-driven strategies. Transparent on-chain execution.</p>
				<div class="font-mono text-xs text-orange-500">hedge-PnL → dao-treasury</div>
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
					<Zap class="h-6 w-6 text-orange-500" />
				</div>
				<h3 class="mb-3 text-lg font-bold text-gray-900 dark:text-white">Cross-Chain Growth</h3>
				<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Future revenue from Bitcoin, Solana (Zeus Network), and multi-chain trading expansion.</p>
				<div class="font-mono text-xs text-orange-500">multi-chain fees → DAO</div>
			</div>
		</div>
	</div>
</div>
