<script lang="ts">
	import { browser } from '$app/environment';
	import { Banner } from '@bigmarket/bm-ui';
	// import { CLAIMING_TIER, LIQUIDITY_TIER } from '@bigmarket/bm-common';
	import { connectWallet } from '@bigmarket/bm-common';
	import { fmtMicroToStx, fmtMicroToStxNumber, truncate } from '@bigmarket/bm-utilities';
	import { showTxModal } from '@bigmarket/bm-common';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import {
		daoConfigStore,
		requireDaoConfig,
		requireDaoGoveranceClient
	} from '$lib/stores/config/daoConfigStore';
	import { stacks } from '@bigmarket/sdk';
	import { getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import { watchTransaction } from '@bigmarket/bm-common';
	import { Wallet } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fetchUserBalances } from '$lib/core/app/loaders/walletLoaders';

	let { fiatPerStx = 0 }: { fiatPerStx?: number } = $props();
	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	const client = $derived(requireDaoGoveranceClient($daoConfigStore));
	let suggestedAmount = $state(20);
	let stxBalance = $state(0);
	let errorMessage = $state<string | undefined>(undefined);
	let walletConnected = $state(false);
	let txId = $state<string | undefined>(undefined);

	const hasBalance = $derived(
		suggestedAmount && fiatPerStx && stxBalance
			? +suggestedAmount * fiatPerStx < fmtMicroToStxNumber(stxBalance)
			: false
	);

	const connect = async () => {
		await connectWallet();
		window.location.reload();
	};

	const provideLiquidity = async () => {
		if (!browser) return;
		if (typeof window === 'undefined') return;
		errorMessage = undefined;
		if (!isLoggedIn()) {
			errorMessage = 'Please connect your wallet';
			return;
		}
		if (!suggestedAmount || suggestedAmount <= 0) {
			errorMessage = `Amount is required`;
			return;
		}
		const mult = Number(`1e${6}`);
		const actual = suggestedAmount * fiatPerStx;
		const microStxAmount = Math.round(parseFloat(String(actual)) * mult);
		const response = await client.contributeLiquidity(getStxAddress(), microStxAmount);
		if (response.success && response.txid) {
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
			const bals = await fetchUserBalances(
				appConfig.VITE_STACKS_API,
				appConfig.VITE_MEMPOOL_API,
				getStxAddress(),
				'',
				''
			);
			//const bigContract = `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}::bmg-token`;
			//bigBalance = Number(bals?.tokenBalances?.fungible_tokens[bigContract]?.balance || 0);
			stxBalance = Number(bals?.tokenBalances?.stx.balance || 0);
			walletConnected = true;
		}
	});
</script>

<div class="space-y-4">
	<!-- Purchase Widget -->
	<div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
		<div class="space-y-5">
			<!-- Header -->
			<div class="text-center">
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">Reputation Boost</h2>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Help us build the DAO by providing liquidity
				</p>
			</div>

			<!-- Current Stage Stats -->
			<div class="grid grid-cols-1 gap-3">
				<div class="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-center">
					<div class="text-xs text-gray-600 dark:text-gray-400">Suggested Amount</div>
					<div class="text-lg font-bold text-gray-900 dark:text-white">${suggestedAmount}</div>
				</div>
			</div>

			{#if !isLoggedIn()}
				<div class="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 text-center">
					<Wallet class="mx-auto mb-3 h-8 w-8 text-orange-500" />
					<h3 class="mb-2 font-semibold text-gray-900 dark:text-white">Connect Your Wallet</h3>
					<p class="mb-3 text-xs text-gray-600 dark:text-gray-400">Connect to participate</p>
					<button
						onclick={() => connect()}
						class="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
					>
						Connect Wallet
					</button>
				</div>
			{:else if !walletConnected}
				<div class="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 text-center">
					<Wallet class="mx-auto mb-3 h-8 w-8 text-orange-500" />
					<h3 class="mb-2 font-semibold text-gray-900 dark:text-white">
						Retrieving current token balances
					</h3>
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
									bind:value={suggestedAmount}
									oninput={() => (suggestedAmount = +suggestedAmount)}
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
										{Math.sqrt(suggestedAmount * fiatPerStx).toFixed(2)} BIG-R (Level 4)
									</span>
								</div>
								<div class="h-px bg-gray-300 dark:bg-gray-600"></div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-gray-600 dark:text-gray-400">You will transfer:</span>
									<span class="font-bold text-gray-900 dark:text-white">
										{#if suggestedAmount > 0 && fiatPerStx > 0}{(
												suggestedAmount * fiatPerStx
											).toFixed(6)}{:else if suggestedAmount > 0}{suggestedAmount}{/if} STX
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
						<Banner
							bannerType="info"
							message={`Transaction pending. <a href="${stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId)}" target="_blank">Track transaction</a>`}
						/>
					{/if}

					<button
						onclick={provideLiquidity}
						disabled={!hasBalance}
						class="w-full cursor-pointer rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/50 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300"
					>
						Continue
					</button>
					<p class="text-center text-xs text-gray-600 dark:text-gray-400">
						Tokens available for voting immediately. Transfers unlock after sale ends.
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Token Info -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<div class="space-y-4">
			<h3 class="text-base font-bold text-gray-900 dark:text-white">BIG Token Information</h3>

			<!-- Distribution -->

			<!-- Technical Details -->
			<div class="space-y-2">
				<div class="text-sm font-medium text-gray-900 dark:text-white">Earned via reputation</div>
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
