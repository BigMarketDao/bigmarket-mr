<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createMarketAI,
		estimateBitcoinBlockTime,
		MARKET_BINARY_OPTION
	} from '@bigmarket/bm-utilities';
	import {
		daoOverviewStore,
		getStxAddress,
		isLoggedIn,
		selectedCurrency
	} from '@bigmarket/bm-common';
	import {
		type MarketCategoricalOption,
		type ScalarMarketDataItem,
		type StoredOpinionPoll,
		type TokenPermissionEvent
	} from '@bigmarket/bm-types';
	import { ArrowRight, Lightbulb, Loader2, Plus, Target, Zap } from 'lucide-svelte';
	import { fmtMicroToStx, fmtNumber } from '@bigmarket/bm-utilities';
	import { PageContainer } from '@bigmarket/bm-ui';
	import {
		aiMarket,
		allowedTokenStore,
		exchangeRatesStore,
		chainStore
	} from '@bigmarket/bm-common';
	import { Banner } from '@bigmarket/bm-ui';
	import { BTCUSD, ETHUSD, STXUSD, SUIUSD, TONUSD } from '@bigmarket/bm-utilities';
	import { generateScalarMarketData } from '@bigmarket/sdk/dist/chains/stacks';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		daoConfigStore,
		requireAppConfig,
		requireDaoConfig
	} from '@bigmarket/bm-common';
	import CreateMarket from '@bigmarket/bm-create-market';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let txId: string = $state('');
	let showAIURL = $state(true);
	let canCreate = $state(false);
	let examplePoll: StoredOpinionPoll = $state({} as StoredOpinionPoll);
	let componentKey = $state(0);
	let errorMessage: string = $state('');
	let running = $state(false);
	let source: string = $state('');
	let suggestion: string = $state(
		`make a market that asks if the  price of bitcoin will be above or below  112,221.81 USD in 2 hours from now at 16:30 on Sept 29th 2025`
	);
	// Step-by-step UI state
	let forceStep = $state(0);
	let inited = $state(false);
	let newMarketDuration = $state(1500);

	const handlePollSubmission = (data: string) => {
		txId = data;
	};

	const handleRegeneration = (template: StoredOpinionPoll, myStep: number) => {
		const tokenEvent = template.token
			? $allowedTokenStore.find((o) => o.token === template.token)
			: $allowedTokenStore[0];
		const data = generateScalarMarketData(
			getStxAddress(),
			daoConfig.VITE_DAO_DEPLOYER,
			daoConfig.VITE_DAO_TREASURY,
			appConfig.VITE_NETWORK,
			appConfig.VITE_PUBLIC_APP_NAME,
			appConfig.VITE_PUBLIC_APP_VERSION,
			$selectedCurrency,
			$chainStore.stacks.burn_block_height,
			$exchangeRatesStore,
			template.priceFeedId || BTCUSD,
			tokenEvent!,
			template.criterionDays.duration,
			template.criterionDays.coolDown
		);
		handleGeneration(data, myStep);
	};

	const quickMarket = async (chain: string) => {
		const data: StoredOpinionPoll = generateScalarMarketData(
			getStxAddress(),
			daoConfig.VITE_DAO_DEPLOYER,
			daoConfig.VITE_DAO_TREASURY,
			appConfig.VITE_NETWORK,
			appConfig.VITE_PUBLIC_APP_NAME,
			appConfig.VITE_PUBLIC_APP_VERSION,
			$selectedCurrency,
			$chainStore.stacks.burn_block_height,
			$exchangeRatesStore,
			chain,
			$allowedTokenStore[0],
			2000,
			144
		);
		handleGeneration(data, 0);
	};

	const handleGeneration = async (data: StoredOpinionPoll, myStep: number) => {
		examplePoll = data;
		if (examplePoll.marketType === 2) {
			examplePoll.marketTypeDataScalar = examplePoll.outcomes as ScalarMarketDataItem[];
			examplePoll.marketTypeDataCategorical = [] as MarketCategoricalOption[];
		} else {
			examplePoll.marketTypeDataScalar = [] as ScalarMarketDataItem[];
			examplePoll.marketFee = data.marketFee / 100;
		}
		console.log('handleGeneration', myStep);
		//forceStep = myStep;
		//componentKey++;
	};

	const setupExample = async (allowedTokens: Array<TokenPermissionEvent>) => {
		examplePoll = {
			name: '',
			description: '',
			liquidity: $daoOverviewStore.contractData.marketInitialLiquidity,
			criterionSources: { sources: [], criteria: '' },
			category: 'meme',
			criterionDays: {
				coolDown: 72,
				duration: 72,
				startHeight: $chainStore.stacks.burn_block_height
			},
			logo: 'https://bigmarket.ai/holding_image.png',
			token: allowedTokens[0].token,
			priceFeedId: undefined,
			treasury: getStxAddress(),
			social: {
				twitter: {
					projectHandle: 'Stacks'
				},
				discord: {
					serverId: '1306302974515089510'
				},
				website: {
					url: 'https://www.stacks.co/'
				}
			},
			createdAt: new Date().getTime(),
			proposer: getStxAddress(),
			marketType: 1,
			marketTypeDataCategorical: MARKET_BINARY_OPTION,
			marketFee: 2,
			objectHash: '',
			processed: false,
			signature: '',
			publicKey: '',
			featured: true
		};
	};

	const prompt = async (mechanism: number) => {
		await handlePromptMarket({ mechanism, source, suggestion });
	};

	const handlePromptMarket = async (market: {
		mechanism: number;
		source: string;
		suggestion: string;
	}) => {
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			if (!isLoggedIn()) {
				//loginStacksFromHeader(document);
				return;
			}
		}
		running = true;
		let llmMarket;
		if (
			(!market.suggestion || market.suggestion.trim().length === 0) &&
			(!market.source || market.source.trim().length === 0)
		) {
			errorMessage = 'Please enter a news source or a suggestion';
		} else {
			try {
				llmMarket = await createMarketAI(appConfig.VITE_BIGMARKET_API, getStxAddress(), market);
				aiMarket.set(llmMarket);
				examplePoll = llmMarket;
				if (llmMarket.outcomes && llmMarket.outcomes.length === 2) {
					examplePoll.marketType = 1;
					examplePoll.marketTypeDataCategorical = MARKET_BINARY_OPTION;
				}
				if (examplePoll.criterionDays.duration < 15) {
					examplePoll.criterionDays.duration = 15;
				}
				if (examplePoll.criterionDays.coolDown < 15) {
					examplePoll.criterionDays.coolDown = 15;
				}
				const index = $allowedTokenStore.findIndex((o) => o.token === examplePoll.token);
				if (index < 0) {
					examplePoll.token = $allowedTokenStore[0].token;
				}
				examplePoll.marketFee = llmMarket.marketFee / 100; // convert bips to percentage
				componentKey++;
			} catch (err) {
				if (err instanceof Error) {
					errorMessage = err.message;
				} else {
					errorMessage = 'An unknown error occurred';
				}
				errorMessage = err as string;
			}
		}
		running = false;
	};

	onMount(async () => {
		canCreate = await stacks.canCreateMarket(appConfig.VITE_BIGMARKET_API, getStxAddress());
		setupExample($allowedTokenStore);
		inited = true;
	});
</script>

<svelte:head>
	<title>Create Market | BigMarket</title>
	<meta name="description" content="Create prediction markets at bigmarket.ai" />
</svelte:head>

<div class="min-h-screen bg-background">
	{#if canCreate}
		<PageContainer>
			<!-- Main Content: Mobile-first responsive grid -->
			<div class="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
				<div class="grid gap-4 md:grid-cols-1 lg:grid-cols-5 lg:gap-8">
					<!-- Left Side: Create Market Form (3 columns width - 3/5) -->
					<div class="order-1 lg:order-1 lg:col-span-3">
						<div
							class="rounded-xl border border-border bg-card shadow-sm"
						>
							<div class="border-b border-border px-6 py-4">
								<h2 class="text-xl font-semibold text-foreground">Create Market</h2>
								<p class="mt-1 mb-5 text-sm text-muted-foreground">
									Fill out the form below to create your prediction market. You'll need to supply
									some liquidity to get the market rolling - ensure you have enough balance in the
									markets token to cover this!
								</p>
								<p class="mt-1 flex justify-between text-sm text-muted-foreground">
									<span>Bitcoin Height: {fmtNumber($chainStore.stacks.burn_block_height)}</span>
									<span
										>Bitcoin Price: {$exchangeRatesStore[0]?.currency || ''}
										{fmtNumber($exchangeRatesStore[0]?.fifteen || 0)}</span
									>
								</p>
							</div>

							<div class="p-6">
								<!-- Form content without height restrictions -->
								{#if txId}
									<div class="mb-6">
										<Banner
											bannerType="warning"
											message={`Market is being set up on chain - <a href=${stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId)} target="_blank">see transaction</a>!`}
										/>
									</div>
								{/if}

								{#if errorMessage}
									<div class="mb-6">
										<Banner bannerType="danger" message={errorMessage} />
									</div>
								{/if}

								{#if inited}
									{#key componentKey}
										<CreateMarket
											{examplePoll}
											onPollSubmit={handlePollSubmission}
											onRegenerate={(data: StoredOpinionPoll) => handleRegeneration(data, 0)}
											{forceStep}
										/>
									{/key}
								{/if}
							</div>
						</div>
					</div>

					<!-- Right Sidebar: Information Panels (2 columns width - 2/5) -->
					<div class="order-2 space-y-6 lg:order-2 lg:col-span-2">
						<!-- Title and Subtitle moved here -->
						<div class="text-center lg:text-left">
							<h1
								class="mb-3 text-3xl leading-tight font-bold text-foreground lg:text-4xl"
							>
								Create Your Own
								<span
									class="block text-primary"
								>
									Prediction Market
								</span>
							</h1>
							<p class="mb-6 text-base leading-relaxed text-muted-foreground">
								Launch your own market on Bitcoin L2. Set the terms, define outcomes, and let the
								community trade on your insights.
							</p>
						</div>

						<!-- 3. THIRD: Quick Start Templates -->
						<div
							class="rounded-lg border border-border bg-card p-4 shadow-sm"
						>
							<div class="mb-4 flex items-center gap-2">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
								>
									<Zap class="h-4 w-4 text-primary" />
								</div>
								<span class="text-lg font-medium text-foreground"
									>Scalar Market Templates</span
								>
							</div>
							<p class="mb-4 text-sm text-muted-foreground">
								Generate pre-configured markets instantly for popular cryptocurrencies
							</p>
							<div class="flex justify-between py-3">
								<div>Duration (blocks):</div>
								<input
									class="mx-5 grow rounded border border-border bg-background p-1 tabular-nums text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									type="number"
									bind:value={newMarketDuration}
								/>
							</div>
							<div class="flex justify-between py-3">
								Ends: {estimateBitcoinBlockTime(
									$chainStore.stacks.burn_block_height + newMarketDuration,
									$chainStore.stacks.burn_block_height
								)}
							</div>
							<!-- <div class="my-5"><Banner bannerType="warning" message={`Disabled until new Pyth Oracle connected`} /></div> -->
							<div class="grid grid-cols-5 gap-3">
								<button
									class="inline-flex transform cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									onclick={(e) => {
										e.preventDefault();
										quickMarket(BTCUSD);
									}}
								>
									BTC
								</button>
								<button
									class="inline-flex transform cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									onclick={(e) => {
										e.preventDefault();
										quickMarket(STXUSD);
									}}
								>
									STX
								</button>
								<button
									class="inline-flex transform cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									onclick={(e) => {
										e.preventDefault();
										quickMarket(ETHUSD);
									}}
								>
									ETH
								</button>
								<button
									class="inline-flex transform cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									onclick={(e) => {
										e.preventDefault();
										quickMarket(SUIUSD);
									}}
								>
									SUI
								</button>
								<button
									class="inline-flex transform cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									onclick={(e) => {
										e.preventDefault();
										quickMarket(TONUSD);
									}}
								>
									TON
								</button>
							</div>
						</div>

						<!-- 1. FIRST: AI Market Generation - Prominent Styling -->
						<div
							class="rounded-xl border border-border bg-card p-6 shadow-lg"
						>
							<div class="mb-6 flex items-center gap-3">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg"
								>
									<Lightbulb class="h-6 w-6 text-primary-foreground" />
								</div>
								<div>
									<h3 class="text-2xl font-bold text-foreground">
										AI Market Generator
									</h3>
									<p class="text-sm text-muted-foreground">
										Create markets instantly with AI assistance
									</p>
								</div>
							</div>

							<!-- Mode Toggle -->
							<div class="mb-6 flex items-center justify-center sm:justify-start">
								<div class="rounded-lg bg-muted p-1">
									<button
										type="button"
										class="rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {showAIURL
											? 'bg-card text-foreground shadow-sm'
											: 'text-muted-foreground hover:text-foreground'}"
										onclick={(e) => {
											e.preventDefault();
											showAIURL = !showAIURL;
										}}
									>
										From URL
									</button>
									<button
										type="button"
										class="rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {!showAIURL
											? 'bg-card text-foreground shadow-sm'
											: 'text-muted-foreground hover:text-foreground'}"
										onclick={(e) => {
											e.preventDefault();
											showAIURL = !showAIURL;
										}}
									>
										From Idea
									</button>
								</div>
							</div>

							<div class="space-y-4">
								{#if showAIURL}
									<div class="space-y-4">
										<div>
											<label
												for="ai-url-input"
												class="mb-2 block text-sm font-medium text-foreground"
											>
												News URL
											</label>
											<input
												id="ai-url-input"
												type="text"
												class="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
												placeholder="https://example.com/news-article..."
												bind:value={source}
											/>
										</div>
										<button
											class="inline-flex w-full transform cursor-pointer items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
											onclick={(e) => {
												e.preventDefault();
												prompt(2);
											}}
											disabled={running || !source || source.trim().length === 0}
										>
											{#if running}
												<Loader2 class="mr-2 h-4 w-4 animate-spin" />
												Generating Market...
											{:else}
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M13 10V3L4 14h7v7l9-11h-7z"
													/>
												</svg>
												Generate from URL
											{/if}
										</button>
									</div>
								{:else}
									<div class="space-y-4">
										<div>
											<label
												for="ai-idea-input"
												class="mb-2 block text-sm font-medium text-foreground"
											>
												Market Idea
											</label>
											<textarea
												id="ai-idea-input"
												rows="2"
												class="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
												placeholder="Describe your market idea in detail..."
												bind:value={suggestion}
											></textarea>
										</div>
										<button
											class="inline-flex w-full transform cursor-pointer items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
											onclick={(e) => {
												e.preventDefault();
												prompt(1);
											}}
											disabled={running || !suggestion || suggestion.trim().length === 0}
										>
											{#if running}
												<Loader2 class="mr-2 h-4 w-4 animate-spin" />
												Generating Market...
											{:else}
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
													/>
												</svg>
												Generate from Idea
											{/if}
										</button>
									</div>
								{/if}

								<!-- Help Text -->
								<div
									class="mt-4 rounded-lg border border-info-border bg-info-soft p-3"
								>
									<p class="text-xs text-info">
										💡 <strong>Tip:</strong>
										{showAIURL
											? 'Paste a news article URL to generate a market based on current events.'
											: 'Describe your market idea in detail for better AI generation results.'}
									</p>
								</div>
							</div>
						</div>

						<!-- 2. SECOND: Compact Stats Card -->
						<div
							class="rounded-lg border border-border bg-card p-4 shadow-sm"
						>
							<h3 class="mb-4 text-lg font-medium text-foreground">
								Market Creation Overview
							</h3>
							<div class="grid grid-cols-3 gap-4">
								<div class="text-center">
									<div
										class="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
									>
										<Zap class="h-4 w-4 text-primary" />
									</div>
									<p class="text-lg font-semibold text-foreground">
										{fmtMicroToStx($daoOverviewStore.contractData?.marketInitialLiquidity || 0)}
									</p>
									<p class="text-xs text-muted-foreground">Creation Fee</p>
								</div>

								<div class="text-center">
									<div
										class="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
									>
										<Target class="h-4 w-4 text-primary" />
									</div>
									<p class="text-lg font-semibold text-foreground">
										0-{$daoOverviewStore.contractData?.marketFeeBipsMax / 100}%
									</p>
									<p class="text-xs text-muted-foreground">Market Fee</p>
								</div>

								<div class="text-center">
									<div
										class="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-success-soft"
									>
										<Lightbulb class="h-4 w-4 text-success" />
									</div>
									<p class="text-lg font-semibold text-foreground">AI</p>
									<p class="text-xs text-muted-foreground">Available</p>
								</div>
							</div>
						</div>

						<!-- 4. FOURTH: How-to Guide with Collapsible FAQ -->
						<div
							class="rounded-lg border border-border bg-card shadow-sm"
						>
							<div class="border-b border-border p-4">
								<h3 class="text-lg font-medium text-foreground">
									How to Use This Form
								</h3>
							</div>

							<div class="divide-y divide-border">
								<details class="p-4 transition-colors hover:bg-muted/50">
									<summary
										class="flex cursor-pointer items-center justify-between font-medium text-foreground"
									>
										<span>What are the different market types?</span>
										<svg
											class="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</summary>
									<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
										Binary: Simple Yes/No questions. Categorical: Multiple choice options. Scalar:
										Price range predictions with oracle feeds.
									</p>
								</details>

								<details class="p-4 transition-colors hover:bg-muted/50">
									<summary
										class="flex cursor-pointer items-center justify-between font-medium text-foreground"
									>
										<span>How do I set resolution criteria?</span>
										<svg
											class="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</summary>
									<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
										Provide clear criteria and reliable sources. The AI agent will use these to
										resolve your market automatically.
									</p>
								</details>

								<details class="p-4 transition-colors hover:bg-muted/50">
									<summary
										class="flex cursor-pointer items-center justify-between font-medium text-foreground"
									>
										<span>What fees do I pay?</span>
										<svg
											class="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</summary>
									<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
										One-time creation fee plus optional market fee (0-10%) that you earn from
										trading activity.
									</p>
								</details>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Help Section -->
			<div class="py-8 sm:py-16">
				<div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
					<div
						class="rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-8"
					>
						<h2 class="text-xl font-bold text-foreground sm:text-2xl">Need Help?</h2>
						<p
							class="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base"
						>
							Check out our documentation for detailed guides on creating and managing markets.
						</p>
						<a
							href="/docs"
							class="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:mt-6"
						>
							View Documentation
							<ArrowRight class="h-4 w-4" />
						</a>
					</div>
				</div>
			</div>
		</PageContainer>
	{:else}
		<!-- Landing Page - Full Width, Properly Centered -->
		<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
			<div class="w-full max-w-6xl space-y-16 py-12 text-center lg:space-y-20">
				<!-- Hero Section -->
				<div class="space-y-8">
					<div class="space-y-6">
						<h1
							class="mb-6 text-5xl font-bold tracking-tight text-foreground lg:text-7xl"
						>
							Create Your Own
							<span
								class="block text-primary"
							>
								Prediction Market
							</span>
						</h1>
						<p
							class="mx-auto max-w-4xl text-xl leading-relaxed text-muted-foreground lg:text-2xl"
						>
							Launch prediction markets on Bitcoin L2 with AI-powered generation, automated
							resolution, and earn market fees from trading activity.
						</p>
					</div>
				</div>

				<!-- Features Section -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<div
						class="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						<div
							class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg"
						>
							<Lightbulb class="h-6 w-6 text-primary-foreground" />
						</div>
						<h3 class="mb-2 text-lg font-semibold text-foreground">
							AI-Powered Generation
						</h3>
						<p class="text-sm text-muted-foreground">
							Create markets instantly with AI assistance from news URLs or market ideas
						</p>
					</div>

					<div
						class="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						<div
							class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg"
						>
							<Zap class="h-6 w-6 text-primary-foreground" />
						</div>
						<h3 class="mb-2 text-lg font-semibold text-foreground">
							Bitcoin L2 Integration
						</h3>
						<p class="text-sm text-muted-foreground">
							Built on Stacks for fast, secure, and scalable Bitcoin transactions
						</p>
					</div>

					<div
						class="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						<div
							class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg"
						>
							<Target class="h-6 w-6 text-primary-foreground" />
						</div>
						<h3 class="mb-2 text-lg font-semibold text-foreground">
							Automated Resolution
						</h3>
						<p class="text-sm text-muted-foreground">
							AI agents automatically resolve markets based on real-world data
						</p>
					</div>

					<div
						class="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						<div
							class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg"
						>
							<Plus class="h-6 w-6 text-primary-foreground" />
						</div>
						<h3 class="mb-2 text-lg font-semibold text-foreground">
							Earn Market Fees
						</h3>
						<p class="text-sm text-muted-foreground">
							Generate revenue from trading fees and market creation
						</p>
					</div>
				</div>

				<!-- How It Works Section -->
				<div class="space-y-8">
					<h2 class="text-center text-3xl font-bold text-foreground">How It Works</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
						<div class="space-y-4 text-center">
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg"
							>
								1
							</div>
							<h3 class="text-lg font-semibold text-foreground">Connect Wallet</h3>
							<p class="text-sm text-muted-foreground">
								Connect your Stacks wallet to access the platform
							</p>
						</div>
						<div class="space-y-4 text-center">
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg"
							>
								2
							</div>
							<h3 class="text-lg font-semibold text-foreground">
								Define Your Market
							</h3>
							<p class="text-sm text-muted-foreground">
								Use AI or manual creation to set market parameters
							</p>
						</div>
						<div class="space-y-4 text-center">
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg"
							>
								3
							</div>
							<h3 class="text-lg font-semibold text-foreground">Set Resolution</h3>
							<p class="text-sm text-muted-foreground">
								Choose resolution criteria and timeline
							</p>
						</div>
						<div class="space-y-4 text-center">
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg"
							>
								4
							</div>
							<h3 class="text-lg font-semibold text-foreground">Launch & Earn</h3>
							<p class="text-sm text-muted-foreground">
								Launch your market and earn fees from trading
							</p>
						</div>
					</div>
				</div>

				<!-- Market Types Showcase -->
				<div class="space-y-8">
					<h2 class="text-center text-3xl font-bold text-foreground">Market Types</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
						<div
							class="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
						>
							<h3 class="mb-3 text-xl font-semibold text-foreground">
								Binary Markets
							</h3>
							<p class="mb-4 text-sm text-muted-foreground">
								Yes/No questions with clear outcomes
							</p>
							<div class="space-y-1 text-xs text-muted-foreground">
								<p>• Will Bitcoin reach $100k by 2024?</p>
								<p>• Will the election result be called by midnight?</p>
							</div>
						</div>

						<div
							class="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
						>
							<h3 class="mb-3 text-xl font-semibold text-foreground">
								Categorical Markets
							</h3>
							<p class="mb-4 text-sm text-muted-foreground">Multiple choice outcomes</p>
							<div class="space-y-1 text-xs text-muted-foreground">
								<p>• Which team will win the championship?</p>
								<p>• What will be the next major crypto trend?</p>
							</div>
						</div>

						<div
							class="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
						>
							<h3 class="mb-3 text-xl font-semibold text-foreground">
								Scalar Markets
							</h3>
							<p class="mb-4 text-sm text-muted-foreground">
								Price ranges and numerical outcomes
							</p>
							<div class="space-y-1 text-xs text-muted-foreground">
								<p>• What will Bitcoin's price be on Dec 31?</p>
								<p>• How many users will the platform have?</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Professional Connect Section -->
				<div
					class="space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-lg"
				>
					<h2 class="text-3xl font-bold text-foreground">
						Ready to Start Creating Markets?
					</h2>
					<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
						Connect your wallet to access the AI Market Generator, create prediction markets, and
						start earning from trading fees.
					</p>

					<div class="border-t border-border pt-6">
						<div
							class="grid grid-cols-1 gap-6 text-sm text-muted-foreground md:grid-cols-3"
						>
							<div class="flex items-center justify-center space-x-2">
								<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>Secure wallet connection</span>
							</div>
							<div class="flex items-center justify-center space-x-2">
								<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>AI-powered market creation</span>
							</div>
							<div class="flex items-center justify-center space-x-2">
								<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>Earn from trading fees</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
