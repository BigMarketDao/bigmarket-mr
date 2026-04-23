<script lang="ts">
  import { SlotModal } from "@bigmarket/bm-ui";
  import type { MarketCategory, PredictionMarketCreateEvent } from "@bigmarket/bm-types";
  import { estimateBitcoinBlockTime, fmtNumber, getResolutionMessage, isCooling, isDisputeRunning, isFinalisable, isPostCooling, isResolved, isResolving, isRunning, mapToMinMaxStringsFormatted } from "@bigmarket/bm-utilities";
  import { getStxAddress } from "@bigmarket/sip18-forum";
  import { Currency, Eye } from "lucide-svelte";
	import { onMount } from "svelte";

  const resolveMarketsScalar = () => {
    console.log("resolveMarketsScalar");
  }
	const { market, selectedCurrency, currentBurnHeight, disputeWindowLength, marketVotingDuration, isCoordinator } = $props<{
		market: Array<PredictionMarketCreateEvent>;
		selectedCurrency: Currency;
		currentBurnHeight: number;
		disputeWindowLength: number;
		marketVotingDuration: number;
		isCoordinator: boolean;
	}>();

  let showModal = $state(false);

  let endOfCooling = $derived((market.marketData?.marketStart || 0) + (market.marketData?.marketDuration || 0) + (market.marketData?.coolDownPeriod || 0));
  let endOfMarket = $derived((market.marketData?.marketStart || 0) + (market.marketData?.marketDuration || 0));
  let endOfDispute = $derived((market.marketData?.resolutionBurnHeight || 0) + disputeWindowLength);
  let current = $derived(currentBurnHeight);
  let votingWindow = $derived(marketVotingDuration);
  let endOfVotingWindow = $derived(votingWindow + (market.marketData?.resolutionBurnHeight || 0));

  const isBinaryMarket = () => {
    return market.marketType === 1;
  };

  const isCategoricalMarket = () => {
    return market.marketType === 1 && market.marketData.categories.length > 2;
  };

  const isScalarMarket = () => {
    return market.marketType === 2;
  };
  const openModal = () => {
    showModal = true;
  };

  const closeModal = () => {
    showModal = false;
  };

  onMount(() => {
    const forumId = market?.unhashedData?.forumMessageId;
  });
</script>

<section class="w-full text-[10px] text-gray-800 dark:text-gray-200">
  <div class="">
    <div class="text-nowrap">
      <a class="capitalize" href="/" onclick={(e) => { e.preventDefault(); openModal(); }}>
        <!-- {market.unhashedData.category}
        {#if isCategoricalMarket()}Category{:else if isBinaryMarket()}Binary{:else if isScalarMarket()}Scalar{/if}
        Market  -->
        <Eye class="inline h-4 w-4 text-gray-500" /></a
      >
    </div>
  </div>
</section>
{#if showModal}
  <SlotModal onClose={closeModal}>
    {#snippet modalBody()}
    <div class="mt-5">
      <section class="mt-5 w-full text-sm">
        <div>
          {#if isRunning(current, market)}
            Market is running
          {:else if isPostCooling(current, market)}
            <span class="text-blue-600">Market has cooled</span> —
            <a
              href="/"
              onclick={() => resolveMarketsScalar()}
              class="font-bold underline"
            >
              waiting to be resolved
            </a>
          {:else if isCooling(current, market)}
            <span class="text-yellow-600">Market is cooling</span><br />
            Ends: {estimateBitcoinBlockTime(endOfCooling, current)}
            ({endOfCooling - current} blocks)
          {:else if isDisputeRunning(market)}
            <span class="text-red-600">Disputed</span><br />
            Ends: {estimateBitcoinBlockTime(endOfVotingWindow, current)}
            ({endOfVotingWindow - current} blocks)
          {:else if isResolving(market)}
            <span class="text-purple-600">Dispute window open</span><br />
            Closes: {estimateBitcoinBlockTime(endOfDispute, current)}
            ({endOfDispute - current} blocks)
          {:else if isFinalisable(current, votingWindow, market)}
            Dispute window closed
          {:else if isResolved(market)}
            Market resolved — claims are open
          {:else}
            Unknown
          {/if}
        </div>
        <table class="w-full border-collapse text-left">
          <tbody class="divide-y divide-gray-200 text-[14px] font-medium dark:divide-gray-700">
            <tr>
              <th class="w-1/3 py-2 font-medium">Start</th>
              <td class="py-2">
                {estimateBitcoinBlockTime(market.marketData?.marketStart || 0, current)}
                <span class="text-gray-500"
                  >(at block {fmtNumber(market.marketData.marketStart)})</span
                >
              </td>
            </tr>
            <tr>
              <th class="w-1/3 py-2 font-medium">Close</th>
              <td class="py-2">
                {estimateBitcoinBlockTime(endOfMarket, current)}
                <span class="text-gray-500">(in {fmtNumber(endOfMarket - current)} blocks)</span>
              </td>
            </tr>
            <tr>
              <th class="w-1/3 py-2 font-medium">End of Cooling</th>
              <td class="py-2">
                {estimateBitcoinBlockTime(endOfCooling, current)}
                <span class="text-gray-500">(in {fmtNumber(endOfCooling - current)} blocks)</span>
              </td>
            </tr>
            {#if isCoordinator(getStxAddress())}
              <tr>
                <th class="py-2 font-medium">Windows</th>
                <td class="py-2">
                  Duration: {market.marketData.marketDuration} / Cooldown {market.marketData
                    ?.coolDownPeriod} / Dispute {disputeWindowLength} blocks
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Market Fee</th>
                <td class="py-2">
                  <span class="text-gray-500">{market.marketData.marketFeeBips / 100}</span>
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Resolution State</th>
                <td class="py-2">
                  {getResolutionMessage(current, votingWindow, market)}
                  {#if (market.marketData?.resolutionBurnHeight || 0) > 0}resolved at block {market
                      .marketData.resolutionBurnHeight}{/if}
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Concluded</th>
                <td class="py-2">
                  <span class="text-gray-500">{market.marketData.concluded}</span>
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Creator</th>
                <td class="py-2">
                  <span class=" text-orange-800">{market.marketData.creator}</span>
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Treasury</th>
                <td class="py-2">
                  <span class="text-orange-800">{market.marketData.treasury}</span>
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Token:</th>
                <td class="py-2">
                  <span class="text-gray-500">{market.marketData.token}</span>
                </td>
              </tr>
              {#if market.marketType === 2}
                <tr>
                  <th class="py-2 font-medium">Price Outcome</th>
                  <td class="py-2">
                    <span class="text-gray-500">{market.marketData.priceOutcome}</span>
                  </td>
                </tr>
                <tr>
                  <th class="py-2 font-medium">Price feed id</th>
                  <td class="py-2">
                    <span class="text-gray-500">{market.marketData.priceFeedId}</span>
                  </td>
                </tr>
                <tr>
                  <th class="py-2 font-medium">Start price</th>
                  <td class="py-2">
                    <span class="text-gray-500">{market.marketData.startPrice}</span>
                  </td>
                </tr>
              {/if}
              <tr>
                <th class="py-2 font-medium">Outcome</th>
                <td class="py-2">
                  <span class="text-gray-500">{market.marketData.outcome || '?'}</span>
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Categories</th>
                <td class="py-2">
                  <span class=" font-medium text-gray-500"
                    >{mapToMinMaxStringsFormatted(selectedCurrency, market.marketData.categories)}</span
                  >
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Stakeds</th>
                <td class="py-2">
                  <span class="font-medium text-gray-500"
                    >{market.marketData.stakeTokens.join(', ')}</span
                  >
                </td>
              </tr>
              <tr>
                <th class="py-2 font-medium">Shares</th>
                <td class="py-2">
                  <span class="font-medium text-gray-500"
                    >{market.marketData.stakes.join(', ')}</span
                  >
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </section>
    </div>
    {/snippet}
  </SlotModal>
{/if}
