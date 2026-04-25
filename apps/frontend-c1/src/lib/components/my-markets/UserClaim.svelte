<script lang="ts">
	import { goto } from '$app/navigation';
	import { allowedTokenStore } from '@bigmarket/bm-common';
	import type { MarketData, UserMarketStake } from '@bigmarket/bm-types';
	import { Bulletin } from '@bigmarket/bm-ui';
	import {
		calculateExpectedPayout,
		canUserClaim,
		fmtMicroToStx,
		getCategoryLabel,
		getMarketToken
	} from '@bigmarket/bm-utilities';
	import { stacks } from '@bigmarket/sdk';
	import { onMount } from 'svelte';
	import { selectedCurrency } from '@bigmarket/bm-common';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { ArrowBigDown, ArrowBigUp } from 'lucide-svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	const { market, stakes, tokens } = $props<{
		market: UserMarketStake;
		stakes: Array<number>;
		tokens: Array<number>;
	}>();

	//let stakes: Array<number> | undefined;
	// let error: string | undefined = $state(undefined);
	// let message: string | undefined = $state(undefined);
	// let txId: string | undefined = $state(undefined);
	let isLoading: boolean = $state(true);
	let showBreakdown: boolean = $state(false);
	let outcomeIndex: number = $state(0);
	// let componentKey: number = $state(0);
	let detailedData: Array<{
		marketId: number;
		extension: string;
		userShares: Array<number>;
		userTokens: Array<number>;
		visible: boolean;
	}> = [];

	const getClazz = (outcome: number | null | undefined, index: number, align?: string) => {
		console.log('index: ' + index);
		console.log('outcome: ' + outcome);
		console.log('align: ' + align);
		if (outcome === null) {
			return 'text-gray-500 pb-2 pl-2 font-mono text-gray-900  dark:text-gray-100 ' + align;
		} else if (typeof outcome === 'number' && index === outcome) {
			return 'text-green-500 pb-2 pl-2 font-mono text-gray-900  dark:text-gray-100 ' + align;
		} else {
			return 'text-red-500 pb-2 pl-2 font-mono text-gray-900  dark:text-gray-100 ' + align;
		}
	};

	const getShares = async (extension: string, marketId: number) => {
		const index = detailedData.findIndex(
			(o) => o.marketId === marketId && o.extension === extension
		);
		let userData;
		if (index > -1) {
			userData = detailedData[index];
			userData.visible = true;
			return;
		}

		//const userShares = (await fetchUserStake(getConfig().VITE_STACKS_API, marketId, extension.split('.')[0], extension.split('.')[1], address)) || ({} as UserStake);
		//const userTokens = (await fetchUserTokens(getConfig().VITE_STACKS_API, marketId, extension.split('.')[0], extension.split('.')[1], address)) || ({} as UserStake);
		const marketUserData = {
			marketId,
			extension,
			userShares: stakes,
			userTokens: tokens,
			visible: true
		};
		detailedData.push(marketUserData);
		return marketUserData;
	};

	const hideShares = async (extension: string, marketId: number) => {
		const index = detailedData.findIndex(
			(o) => o.marketId === marketId && o.extension === extension
		);
		let userData;
		if (index > -1) userData = detailedData[index];
		else return;
		userData.visible = false;
		return;
	};

	const isDetailedData = (marketId: number, extension: string) => {
		const index = detailedData.findIndex(
			(o) => o.marketId === marketId && o.extension === extension
		);
		if (index > -1) return detailedData[index].visible;
		else return false;
	};

	const claimWinningsInt = async (extension: string, marketData: MarketData, marketId: number) => {
		try {
			console.log('claimWinningsInt' + marketId + ' ' + extension + ' ' + marketData.token);
			goto(`/market/${market.marketId}/${market.marketType}#claiming`);
			return;
			// isLoading = true;
			// const sip10Data = getMarketToken(marketData.token);
			// txId = await claimWinnings(extension, marketData, marketId, sip10Data, { stakes: stakes! });
		} catch {
			// ignore
		} finally {
			// isLoading = false;
		}
	};

	onMount(async () => {
		outcomeIndex = market.marketData.outcome!;
		console.log(outcomeIndex + ' tokens -> ', tokens);
		console.log(outcomeIndex + ' shares -> ', stakes);
		isLoading = false;
	});
</script>

<tr
	class="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
>
	<td class="px-4 py-3 align-middle">
		<a
			href={`/market/${market.marketId}/${market.marketType}`}
			class="line-clamp-2 text-[13px] leading-4 font-semibold text-gray-900 transition-colors hover:text-orange-600 dark:text-gray-100 dark:hover:text-orange-400"
		>
			{market.marketMeta.name}
		</a>
	</td>
	<td class="px-4 py-3 align-middle">
		{#if market.marketData.concluded}
			<span
				class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
			>
				<svg class="mr-1 h-1.5 w-1.5 fill-current" viewBox="0 0 6 6"
					><circle cx="3" cy="3" r="3" /></svg
				>
				Resolved
			</span>
		{:else}
			<span
				class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
			>
				<svg class="mr-1 h-1.5 w-1.5 fill-current" viewBox="0 0 6 6"
					><circle cx="3" cy="3" r="3" /></svg
				>
				Open
			</span>
		{/if}
	</td>
	<td class="px-4 py-3 text-right align-middle font-medium whitespace-nowrap">
		{#if isDetailedData(market.marketId, market.extension)}
			<Bulletin message="Click for detailed breakdown.">
				<span>
					<a
						href="/"
						onclick={(e) => {
							e.preventDefault();
							hideShares(market.extension, market.marketId);
						}}
					>
						<span class="font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100"
							>{fmtMicroToStx(
								market.stakeTotal,
								getMarketToken(market.marketData.token, $allowedTokenStore).decimals
							)}</span
						>
					</a>
				</span>
			</Bulletin>
		{:else if !market.marketData.concluded}
			<Bulletin message="Click for detailed breakdown.">
				<span>
					<a
						href="/"
						onclick={(e) => {
							e.preventDefault();
							getShares(market.extension, market.marketId);
						}}
					>
						<span class="font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100"
							>{fmtMicroToStx(
								market.stakeTotal,
								getMarketToken(market.marketData.token, $allowedTokenStore).decimals
							)}</span
						>
					</a>
				</span>
			</Bulletin>
		{:else}
			<span class="font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100"
				>{fmtMicroToStx(
					market.stakeTotal,
					getMarketToken(market.marketData.token, $allowedTokenStore).decimals
				)}</span
			>
		{/if}
	</td>
	<td
		class="px-4 py-3 text-right align-middle font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100"
	>
		{fmtMicroToStx(
			market.marketData.stakes.reduce((acc: number, val: number) => acc + val, 0),
			getMarketToken(market.marketData.token, $allowedTokenStore).decimals
		)}
	</td>
	<td class="px-4 py-3 align-middle text-[11px] font-medium text-gray-900 dark:text-gray-100">
		<span
			class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200"
		>
			{getMarketToken(market.marketData.token, $allowedTokenStore).symbol}
		</span>
	</td>
	<td class="flex justify-between px-2 py-3 text-right align-middle">
		{#if !isLoading}
			{#if !stakes || stakes.length === 0}
				<a
					href={`/market/${market.marketId}/${market.marketType}`}
					class="text-[11px] font-medium text-gray-600 underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
					>View</a
				>
			{:else if market.marketData.concluded && canUserClaim(market.marketData.outcome!, stakes!)}
				<button
					onclick={() => claimWinningsInt(market.extension, market.marketData, market.marketId)}
					class="inline-flex cursor-pointer items-center rounded-md bg-orange-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
					disabled={isLoading}
				>
					{#if isLoading}
						<svg class="mr-1 -ml-1 h-3 w-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					{/if}
					Claim
				</button>
			{:else if market.claimed}
				<Bulletin message="View claim transaction on the explorer.">
					<span>
						<a
							href={stacks.explorerTxUrl(
								appConfig.VITE_NETWORK,
								appConfig.VITE_STACKS_EXPLORER,
								market.claim.txId
							)}
							target="_blank"
							class="text-[11px] font-medium text-orange-600 underline hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
						>
							View Claim
						</a>
					</span>
				</Bulletin>
			{:else}
				<a
					href={`/market/${market.marketId}/${market.marketType}`}
					class="text-[11px] font-medium text-gray-600 underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
					>View</a
				>
			{/if}
		{:else}
			<div>awaiting..</div>
		{/if}
	</td>
	<td>
		<a
			href="/"
			onclick={(e) => {
				{
					e.preventDefault();
					showBreakdown = !showBreakdown;
				}
			}}
			>{#if !showBreakdown}<ArrowBigDown />{:else}<ArrowBigUp />{/if}</a
		>
	</td>
</tr>

{#if !isLoading && showBreakdown}
	<tr class="bg-gray-50 text-gray-900 tabular-nums dark:bg-gray-900/40 dark:text-gray-100">
		<td colspan="6" class="rounded border border-gray-100 p-3 dark:border-gray-800">
			<table class="w-full border-collapse text-[11px]">
				<thead class="mb-5">
					<tr>
						<th class="p-5 text-left font-medium text-gray-500 dark:text-gray-400">Category</th>
						<th class="p-5 text-right font-medium text-gray-500 dark:text-gray-400">Shares</th>
						<th class="p-5 text-right font-medium text-gray-500 dark:text-gray-400">Tokens</th>
						<th class="p-5 text-right font-medium text-gray-500 dark:text-gray-400">Payout</th>
					</tr>
				</thead>
				<tbody>
					{#each market.marketData.categories, index (index)}
						<tr
							class={outcomeIndex === index
								? 'border-b border-red-100 bg-green-800'
								: 'border-b border-green-600 bg-gray-800'}
						>
							<td class={getClazz(market.marketData.outcome, index, 'p-5 text-left ')}
								>{@html getCategoryLabel($selectedCurrency, index, market.marketData)}</td
							>
							<td class={getClazz(market.marketData.outcome, index, 'p-5 text-right')}
								>{fmtMicroToStx(
									stakes[index] || 0,
									getMarketToken(market.marketData.token, $allowedTokenStore).decimals
								)}</td
							>
							<td class={getClazz(market.marketData.outcome, index, 'p-5 text-right')}
								>{fmtMicroToStx(
									tokens[index] || 0,
									getMarketToken(market.marketData.token, $allowedTokenStore).decimals
								)}</td
							>
							<td class={getClazz(market.marketData.outcome, index, 'p-5 text-right')}
								>{fmtMicroToStx(
									calculateExpectedPayout(market.marketData, stakes, index)!.netRefund,
									getMarketToken(market.marketData.token, $allowedTokenStore).decimals
								)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</td>
	</tr>
{/if}

<style>
	/* tr {
    border: 1pt solid green;
  } */
</style>
