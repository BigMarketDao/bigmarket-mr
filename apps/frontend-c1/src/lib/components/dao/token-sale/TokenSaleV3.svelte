<script lang="ts">
	import { browser } from '$app/environment';
	import { Banner } from '@bigmarket/bm-ui';
	import { allowedTokenStore, daoOverviewStore, getMarketToken } from '@bigmarket/bm-common';
	import { getGovernanceToken } from '$lib/core/app/loaders/governance/tokens';
	import { connectWallet } from '@bigmarket/bm-common';
	import { fmtMicroToStx, truncate } from '@bigmarket/bm-utilities';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { daoConfigStore, requireDaoConfig, requireDaoGoveranceClient } from '$lib/stores/config/daoConfigStore';
	import { getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import { type TokenSalePurchase, type TokenSaleStage } from '@bigmarket/bm-types';
	import { Wallet } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fetchTokenSalePurchases } from '../../../core/app/loaders/governance/token-sale';
	import { showTxModal } from '@bigmarket/bm-common';
	import { watchTransaction } from '@bigmarket/bm-common';
	import { stacks } from '@bigmarket/sdk';
	import { fetchUserBalances } from '$lib/core/app/loaders/walletLoaders';

	let { fiatPerStx = 0 }: { fiatPerStx?: number } = $props();
	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	const client = $derived(requireDaoGoveranceClient($daoConfigStore));
	const daoOverview = $derived($daoOverviewStore);
	let tokenSalePurchase = $state<TokenSalePurchase | undefined>(undefined);
	let amount = $state(0);
	let txId = $state<string | undefined>(undefined);
	let errorMessage = $state<string | undefined>(undefined);
	let stacksLeading = $state(true);
	let currentStage = $state((daoOverview?.tokenSale?.currentStage || 1) - 1);
	let walletConnected = $state(isLoggedIn());
	let stxBalance = $state(0);

	const stage = $derived(daoOverview?.tokenSale?.stages[currentStage] || ({} as TokenSaleStage));
	const tokens = $derived(
		Object.keys(daoOverview?.treasuryBalances?.fungible_tokens || {}).map((token) => ({
			contract: daoConfig.VITE_DAO_TREASURY,
			token: token.split('::')[1],
			balance: daoOverview.treasuryBalances.fungible_tokens[token].balance,
			decimals: getMarketToken(token.split('::')[0]).decimals,
			symbol: getMarketToken(token.split('::')[0]).symbol
		}))
	);
	const govToken = $derived(getGovernanceToken($allowedTokenStore));
	const stageProgress = $derived(
		stage ? Math.min((stage.tokensSold / stage.maxSupply) * 100, 100) : 0
	);

	// 0.05 USD per BIG -> 1 USD = 1/0.05 BIG = 20 BIG
	// 1 USD = x STX
	// x SXT = 1 USD = 1/0.05 BIG
	// 1 STX = 1/x USD = 1/(0.05x)
	const tokensReceivedFiat = $derived(stacksLeading ? (amount / 0.05).toFixed(6) : amount);
	const tokenAmount = $derived(
		stacksLeading ? (amount || 0).toFixed(6) : (amount / (0.05 * fiatPerStx) || 0).toFixed(6)
	);

	const connect = async () => {
		await connectWallet();
		window.location.reload();
	};

	const handleChange = () => {
		stakeAmount.set(amount);
	};

	const buyTokens = async () => {
		if (!browser) return;
		if (typeof window === 'undefined') return;
		errorMessage = undefined;
		if (!isLoggedIn()) {
			errorMessage = 'Please connect your wallet';
			return;
		}
		if (!amount || amount <= 0) {
			errorMessage = `Amount is required`;
			return;
		}
		const mult = Number(`1e${govToken.decimals}`);
		const actual = stacksLeading ? amount * fiatPerStx : tokenAmount;
		const microStxAmount = Math.round(parseFloat(String(actual)) * mult);
		const response = await client.buyIdoTokens(getStxAddress(), microStxAmount);
		if (response.txid) {
			showTxModal(response.txid);
			watchTransaction(
				appConfig.VITE_BIGMARKET_API,
				appConfig.VITE_STACKS_API,
				`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`,
				response.txid
			);
		} else {
			showTxModal('Unable to process right now');
		}
	};

	onMount(async () => {
		if (isLoggedIn()) {
			tokenSalePurchase = await fetchTokenSalePurchases(getStxAddress());
			const stageMicro = (tokenSalePurchase?.amount || 0, govToken.decimals);
			stakeAmount.set(stageMicro);
			const bals = await fetchUserBalances(
				appConfig.VITE_STACKS_API,
				appConfig.VITE_MEMPOOL_API,
				getStxAddress(),
				'',
				''
			);
			stxBalance = Number(bals?.tokenBalances?.stx.balance || 0);
		}
	});
</script>

{#if stage && tokens}
	<div class="space-y-4">
		<!-- Purchase Widget -->
		<div
			class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="space-y-5">
				<!-- Header -->
				<div class="text-center">
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">Purchase BIG Tokens</h2>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Early bird pricing - Stage {currentStage + 1} of 6
					</p>
				</div>

				<!-- Current Stage Stats -->
				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-center">
						<div class="text-xs text-gray-600 dark:text-gray-400">Current Price</div>
						<div class="text-lg font-bold text-gray-900 dark:text-white">${stage.price / 100}</div>
					</div>
					<div class="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-center">
						<div class="text-xs text-gray-600 dark:text-gray-400">Stage Progress</div>
						<div class="text-lg font-bold text-gray-900 dark:text-white">
							{stageProgress.toFixed(1)}%
						</div>
					</div>
				</div>

				{#if !walletConnected}
					<div class="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 text-center">
						<Wallet class="mx-auto mb-3 h-8 w-8 text-orange-500" />
						<h3 class="mb-2 font-semibold text-gray-900 dark:text-white">Connect Your Wallet</h3>
						<p class="mb-3 text-xs text-gray-600 dark:text-gray-400">Connect to participate</p>
						<button
							on:click={() => connect()}
							class="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
						>
							Connect Wallet
						</button>
					</div>
				{:else}
					<!-- Purchase Form -->
					<div class="space-y-4">
						<!-- Wallet Info -->
						<div class="grid grid-cols-2 gap-2">
							<div
								class="rounded border border-gray-300 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900"
							>
								<div class="text-xs text-gray-600 dark:text-gray-400">Wallet</div>
								<div class="font-mono text-xs text-gray-900 dark:text-white">
									{truncate(getStxAddress())}
								</div>
							</div>
							<div
								class="rounded border border-gray-300 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900"
							>
								<div class="text-xs text-gray-600 dark:text-gray-400">STX Balance</div>
								<div class="text-xs font-medium text-gray-900 dark:text-white">
									{fmtMicroToStx(stxBalance)}
								</div>
							</div>
						</div>

						<!-- Purchase Input -->
						<div class="space-y-3">
							<div>
								<label
									for="purchase-amount"
									class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
								>
									Purchase Amount
								</label>
								<div class="flex gap-2">
									<input
										id="purchase-amount"
										type="number"
										placeholder="Enter amount"
										bind:value={amount}
										on:change={handleChange}
										class="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
									/>
									<div
										class="flex items-center rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
									>
										USD
									</div>
								</div>
							</div>

							<!-- Purchase Summary -->
							<div class="rounded border border-orange-500/20 bg-orange-500/5 p-3">
								<div class="space-y-2">
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">You will receive:</span>
										<span class="font-bold text-gray-900 dark:text-white">
											{#if tokensReceivedFiat !== 'NaN'}{Number(
													tokensReceivedFiat
												).toLocaleString()}{/if} BIG
										</span>
									</div>
									<div class="h-px bg-gray-300 dark:bg-gray-600"></div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">You will pay:</span>
										<span class="font-bold text-gray-900 dark:text-white">
											{#if amount > 0 && fiatPerStx > 0}{(amount * fiatPerStx).toFixed(
													6
												)}{:else if amount > 0}{amount}{/if} STX
										</span>
									</div>
								</div>
							</div>
						</div>

						{#if errorMessage}
							<div
								class="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400"
							>
								{errorMessage}
							</div>
						{/if}

						{#if txId}
							<div
								class="rounded border border-green-500/30 bg-green-500/10 p-2 text-xs text-green-600 dark:text-green-400"
							>
								<Banner
									bannerType="info"
									message={`Transaction pending. <a href="${stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId)}" target="_blank">Track transaction</a>`}
								/>
							</div>
						{/if}

						<button
							on:click={buyTokens}
							class="w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/50 focus:outline-none"
						>
							Buy BIG Tokens
						</button>

						<p class="text-center text-xs text-gray-600 dark:text-gray-400">
							Tokens available for voting immediately. Transfers unlock after sale ends.
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Token Info -->
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="space-y-4">
				<h3 class="text-base font-bold text-gray-900 dark:text-white">Token Information</h3>

				<!-- Distribution -->
				<div class="space-y-3">
					<div class="text-sm font-medium text-gray-900 dark:text-white">Distribution</div>
					<div class="space-y-2">
						<div class="flex justify-between text-xs">
							<span class="text-gray-600 dark:text-gray-400">Community/IDO</span>
							<span class="font-medium text-gray-900 dark:text-white">60%</span>
						</div>
						<div class="flex justify-between text-xs">
							<span class="text-gray-600 dark:text-gray-400">Treasury</span>
							<span class="font-medium text-gray-900 dark:text-white">25%</span>
						</div>
						<div class="flex justify-between text-xs">
							<span class="text-gray-600 dark:text-gray-400">Operations</span>
							<span class="font-medium text-gray-900 dark:text-white">15%</span>
						</div>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
						<div class="flex h-full">
							<div class="w-[60%] bg-orange-500"></div>
							<div class="w-[25%] bg-gray-500"></div>
							<div class="w-[15%] bg-gray-400"></div>
						</div>
					</div>
				</div>

				<!-- Technical Details -->
				<div class="space-y-2">
					<div class="text-sm font-medium text-gray-900 dark:text-white">Technical</div>
					<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">Blockchain</span>
							<span class="font-mono text-gray-900 dark:text-white">Stacks L2</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">Standard</span>
							<span class="font-mono text-gray-900 dark:text-white">SIP-010</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">Supply</span>
							<span class="font-mono text-gray-900 dark:text-white">10M</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">Decimals</span>
							<span class="font-mono text-gray-900 dark:text-white">6</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
