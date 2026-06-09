<script lang="ts">
	import { goto } from '$app/navigation';
	import { allowedTokenStore } from '@bigmarket/bm-common';
	import type { UserMarketStake } from '@bigmarket/bm-types';
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
	import UserClaimHistory from './UserClaimHistory.svelte';
	import { fetchMyClaimedMarket } from '$lib/core/app/loaders/myMarketsLoaders';
	import type { PredictionMarketClaimEvent } from '@bigmarket/bm-types';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	const { market, stakes, tokens, address } = $props<{
		market: UserMarketStake;
		stakes: Array<number>;
		tokens: Array<number>;
		address: string;
	}>();

	let isLoading: boolean = $state(true);
	let showBreakdown: boolean = $state(false);
	let outcomeIndex: number = $state(0);
	let hasClaim: boolean = $state(false);
	let claimRecord = $state<PredictionMarketClaimEvent | null>(null);
	let detailedData: Array<{
		marketId: number;
		extension: string;
		userShares: Array<number>;
		userTokens: Array<number>;
		visible: boolean;
	}> = [];

	const getClazz = (outcome: number | null | undefined, index: number, align?: string) => {
		const base = `pb-2 pl-2 font-mono tabular-nums text-foreground ${align ?? ''}`;
		if (outcome === null) {
			return `${base} text-muted-foreground`;
		} else if (typeof outcome === 'number' && index === outcome) {
			return `${base} text-success`;
		} else {
			return `${base} text-destructive`;
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

	const claimWinningsInt = () => {
		try {
			goto(`/market/${market.marketId}/${market.marketType}#claiming`);
			return;
		} catch {
			// ignore
		}
	};

	const showStakingBreakdown = $derived(
		showBreakdown && (!market.marketData.concluded || !hasClaim)
	);

	const claimTxId = $derived(claimRecord?.txId);

	onMount(async () => {
		outcomeIndex = market.marketData.outcome!;
		if (market.marketData.concluded) {
			claimRecord = await fetchMyClaimedMarket(
				appConfig.VITE_BIGMARKET_API,
				market.marketId,
				market.extension,
				address
			);
			hasClaim = !!claimRecord?.txId;
		}
		isLoading = false;
	});
</script>

<tr class="border-b border-border transition-colors hover:bg-muted/50">
	<td class="px-4 py-3 align-middle">
		<a
			href={`/market/${market.marketId}/${market.marketType}`}
			class="line-clamp-2 text-[13px] leading-4 font-semibold text-foreground transition-colors hover:text-primary"
		>
			{market.marketMeta.name}
		</a>
	</td>
	<td class="px-4 py-3 align-middle">
		{#if market.marketData.concluded}
			<span
				class="inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success"
			>
				<svg class="mr-1 h-1.5 w-1.5 fill-current" viewBox="0 0 6 6"
					><circle cx="3" cy="3" r="3" /></svg
				>
				Resolved
			</span>
		{:else}
			<span
				class="inline-flex items-center rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-medium text-info"
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
						<span class="font-mono text-[11px] text-foreground tabular-nums"
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
						<span class="font-mono text-[11px] text-foreground tabular-nums"
							>{fmtMicroToStx(
								market.stakeTotal,
								getMarketToken(market.marketData.token, $allowedTokenStore).decimals
							)}</span
						>
					</a>
				</span>
			</Bulletin>
		{:else}
			<span class="font-mono text-[11px] text-foreground tabular-nums"
				>{fmtMicroToStx(
					market.stakeTotal,
					getMarketToken(market.marketData.token, $allowedTokenStore).decimals
				)}</span
			>
		{/if}
	</td>
	<td class="px-4 py-3 text-right align-middle font-mono text-[11px] text-foreground tabular-nums">
		{fmtMicroToStx(
			market.marketData.stakes.reduce((acc: number, val: number) => acc + val, 0),
			getMarketToken(market.marketData.token, $allowedTokenStore).decimals
		)}
	</td>
	<td class="px-4 py-3 align-middle text-[11px] font-medium text-foreground">
		<span
			class="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
		>
			{getMarketToken(market.marketData.token, $allowedTokenStore).symbol}
		</span>
	</td>
	<td class="flex justify-between px-2 py-3 text-right align-middle">
		{#if !isLoading}
			{#if !stakes || stakes.length === 0}
				<a
					href={`/market/${market.marketId}/${market.marketType}`}
					class="text-[11px] font-medium text-muted-foreground underline hover:text-foreground"
					>View</a
				>
			{:else if market.marketData.concluded && canUserClaim(market.marketData.outcome!, stakes!)}
				<button
					onclick={() => claimWinningsInt()}
					class="inline-flex h-11 cursor-pointer items-center rounded-md bg-primary px-3 text-[11px] font-medium text-primary-foreground transition-opacity hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 md:h-10"
					disabled={isLoading}
				>
					Claim
				</button>
			{:else if (market.claimed || hasClaim) && claimTxId}
				<Bulletin message="View claim transaction on the explorer.">
					<span>
						<a
							href={stacks.explorerTxUrl(
								appConfig.VITE_NETWORK,
								appConfig.VITE_STACKS_EXPLORER,
								claimTxId
							)}
							target="_blank"
							class="text-[11px] font-medium text-primary underline hover:text-primary/80"
						>
							View Claim
						</a>
					</span>
				</Bulletin>
			{:else}
				<a
					href={`/market/${market.marketId}/${market.marketType}`}
					class="text-[11px] font-medium text-muted-foreground underline hover:text-foreground"
					>View</a
				>
			{/if}
		{:else}
			<div class="text-muted-foreground">awaiting..</div>
		{/if}
	</td>
	<td>
		<a
			href="/"
			onclick={(e) => {
				e.preventDefault();
				showBreakdown = !showBreakdown;
			}}
			class="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>{#if !showBreakdown}<ArrowBigDown />{:else}<ArrowBigUp />{/if}</a
		>
	</td>
</tr>

{#if !isLoading && showBreakdown}
	<tr class="bg-muted/50 text-foreground">
		<td colspan="6" class="rounded border border-border p-3">
			{#if market.marketData.concluded}
				<UserClaimHistory
					marketId={market.marketId}
					extension={market.extension}
					claimer={address}
					marketData={market.marketData}
					claim={claimRecord}
				/>
			{/if}

			{#if showStakingBreakdown}
				<table class="w-full border-collapse text-[11px]">
					<thead class="mb-5">
						<tr>
							<th class="p-5 text-left font-medium text-muted-foreground">Category</th>
							<th class="p-5 text-right font-medium text-muted-foreground">Shares</th>
							<th class="p-5 text-right font-medium text-muted-foreground">Tokens</th>
							<th class="p-5 text-right font-medium text-muted-foreground">Payout</th>
						</tr>
					</thead>
					<tbody>
						{#each market.marketData.categories, index (index)}
							<tr
								class={outcomeIndex === index
									? 'border-b border-success/20 bg-success/5'
									: 'border-b border-border'}
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
										calculateExpectedPayout(market.marketData, stakes, index)?.netRefund ?? 0,
										getMarketToken(market.marketData.token, $allowedTokenStore).decimals
									)}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</td>
	</tr>
{/if}
