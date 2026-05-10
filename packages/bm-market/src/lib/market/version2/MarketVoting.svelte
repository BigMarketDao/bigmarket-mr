<script lang="ts">
  import { onMount } from 'svelte';
  import DaoVotingPowerInput from './do-vote/DaoVotingPowerInput.svelte';
  import { showTxModal } from '@bigmarket/bm-common';
  import { Banner, BlockHeightProgressBar, Panel, ParaContainer } from '@bigmarket/bm-ui';
  import { chainStore, isLoggedIn, daoOverviewStore, allowedTokenStore, getStxAddress } from '@bigmarket/bm-common';
  import { appConfigStore, daoConfigStore, requireDaoConfig, requireAppConfig } from '@bigmarket/bm-common';
  import { watchTransaction } from '@bigmarket/bm-common';
  import type { MarketVotingVoteEvent, PredictionMarketCreateEvent, ResolutionVote, Sip10Data } from '@bigmarket/bm-types';
  import { fetchMarketsVotes, fmtMicroToStx, fullBalanceInSip10Token, getGovernanceToken, isSTX } from '@bigmarket/bm-utilities';
  import { stacks } from '@bigmarket/sdk';
	import { getTransaction } from '@bigmarket/bm-utilities';

  const daoConfig = $derived(requireDaoConfig($daoConfigStore));
  const appConfig = $derived(requireAppConfig($appConfigStore));
  const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>();

  let resolutionVote: ResolutionVote|undefined = $state(undefined);
  let marketVotes: Array<MarketVotingVoteEvent> = $state([]);
  let myVotes: Array<MarketVotingVoteEvent> = $state([]);
  let myVotesAmount: number = $state(0);
  let currentBurnHeight = $derived($chainStore.stacks.burn_block_height);
  let startVoting = $state(0);
  let endVoting = $state(0);
  let totalBalanceUstx = $state(0);
  let votingPower = $state(0);
  let votedPower = $state(0);
  let txVoting = $state(false);
  let showTable = false;
  let sip10Data: Sip10Data| undefined = $state(undefined);

  let errorMessage: string | undefined = $state(undefined);
  let txId: string | undefined = $state(undefined);

  function handleVotingTypeChange(newTxVoting: boolean) {
    txVoting = newTxVoting;
  }

  function handleVotingPowerChange(amountIn: string) {
    const amount = Number(amountIn);
    if (amount > totalBalanceUstx) {
      errorMessage = 'Maximum voting power is ' + fmtMicroToStx(totalBalanceUstx) + ' STX';
      return;
    }
    votingPower = amount;
  }

  // const getPostConditions = async (microStxAmount: number): Promise<PostCondition[]> => {
  //   const postConditions: any = [];
  //   //if (appConfig.VITE_NETWORK !== 'mainnet') return postConditions;
  //   //const bigrPostConditionNft = await getBigRPostConditionNft(CREATE_MARKET_TIER, getStxAddress());
  //   //if (bigrPostConditionNft) postConditions.push(bigrPostConditionNft);
  //   // const formattedToken = (daoConfig.VITE_DAO_DEPLOYER + '.' + daoConfig.VITE_DAO_GOVERNANCE_TOKEN) as `${string}.${string}`;
  //   // const tokenName = 'bmg-token';
  //   // const postConditionFt = Pc.principal(getStxAddress()).willSendEq(microStxAmount).ft(formattedToken, tokenName);

  //   const formattedToken = (daoConfig.VITE_DAO_DEPLOYER +
  //     '.' +
  //     daoConfig.VITE_DAO_GOVERNANCE_TOKEN) as `${string}.${string}`;
  //   const postConditionFt = Pc.principal(getStxAddress())
  //     .willSendEq(microStxAmount)
  //     .ft(formattedToken, 'bmg-token');

  //   postConditions.push(postConditionFt);
  //   return postConditions;
  // };

  const castVote = async (vfor: number, amount: number) => {
    if (typeof window === 'undefined') return false;
    if (amount === 0) {
      errorMessage = 'please indicate how much governance token you wish to vote with';
      return;
    }
    if (!sip10Data) {
      errorMessage = 'Governance token metadata is not loaded yet';
      return;
    }
    const response = await stacks.createMarketsClient(daoConfig).castVote(vfor, amount, getStxAddress(), market, sip10Data);

    if (response.success && response?.txid) {
      showTxModal(response.txid); 
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }
  };

  const concludeVote = async () => {
    if (!isLoggedIn()) {
      //loginStacksFromHeader(document);
      return;
    }
    const response = await stacks.createMarketsClient(daoConfig).concludeVote(market);
    if (response.success && response?.txid) {
      showTxModal(response.txid);
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }
  };

  const lookupTransaction = async (txId: string) => {
    return await getTransaction(appConfig.VITE_STACKS_API, txId);
  };

  onMount(async () => {
    const duration = $derived($daoOverviewStore.contractData.marketVotingDuration);
    resolutionVote = await stacks.createContractViewDataClient().fetchResolutionVote(
      appConfig.VITE_STACKS_API,
      market.extension,
      market.marketId,
      market.extension.split('.')[0],
      daoConfig.VITE_DAO_MARKET_VOTING,
    );
    startVoting = resolutionVote.endBurnHeight - duration;
    endVoting = resolutionVote.endBurnHeight;
    marketVotes = await fetchMarketsVotes(appConfig.VITE_BIGMARKET_API, market.marketId, market.marketType);
    sip10Data = getGovernanceToken(daoConfig.VITE_DAO_DEPLOYER, daoConfig.VITE_DAO_GOVERNANCE_TOKEN, $allowedTokenStore);
    
    if (isLoggedIn()) {
      const voter = getStxAddress();
      const index = marketVotes.findIndex((o) => o.voter === voter);
      myVotes = marketVotes.filter((o) => o.voter === voter);
      if (myVotes) myVotesAmount = myVotes.reduce((sum, vote) => sum + vote.amount, 0);
      //const daoVotes = await getVotesByVoterAndMarket(market.extension, voter, market.marketId);
      totalBalanceUstx = await fullBalanceInSip10Token(
        appConfig.VITE_STACKS_API,
        getStxAddress(),
        `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}`,
      );
      votingPower = 0;
    }
    if (localStorage.getItem('resolve-market-' + market.marketId)) {
      const txIdObj = localStorage.getItem('resolve-market-' + market.marketId);
      if (txIdObj) {
        const potentialTxId = JSON.parse(txIdObj).txId;
        const tx = await lookupTransaction(potentialTxId);
        if (
          tx &&
          tx.tx_status === 'pending' &&
          tx.sender_address === getStxAddress()
        ) {
          txId = potentialTxId;
        } else {
          if (tx.sender_address === getStxAddress()) {
            localStorage.removeItem('resolve-market-' + market.marketId);
          }
        }
      }
    }
  });
</script>

<Panel>
  <!-- Transaction banners -->

  {#if resolutionVote}
    <!-- Vote Status -->
    <div class="space-y-2">
      <h2 class="text-lg font-semibold">
        {#if resolutionVote.concluded}
          Voting Concluded
        {:else if resolutionVote.endBurnHeight < currentBurnHeight}
          Voting Window Closed
        {:else}
          Voting In Progress
        {/if}
      </h2>
      <p class="text-sm">
        {#if resolutionVote.concluded}
          Winning outcome: <strong
            >{market.marketData.categories[market.marketData.outcome!]}</strong
          >
        {:else if resolutionVote.endBurnHeight < currentBurnHeight}
          The vote has ended. You may now conclude the result.
        {:else}
          <!-- Cast your vote before block <strong>{resolutionVote.endBurnHeight}</strong>. -->
        {/if}
      </p>
    </div>

    <!-- Vote Metadata Table (optional toggle) -->
    {#if showTable}
      <table class="mt-4 w-full border-collapse border border-zinc-200 text-sm dark:border-zinc-700">
        <thead>
          <tr>
            <th class="bg-zinc-100 px-3 py-2 text-left font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Label</th>
            <th class="bg-zinc-100 px-3 py-2 text-left font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Value</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
          <tr><td class="px-3 py-2">Proposer</td><td class="px-3 py-2">{resolutionVote.proposer}</td></tr>
          <tr><td class="px-3 py-2">End Height</td><td class="px-3 py-2">{resolutionVote.endBurnHeight}</td></tr>
          <tr><td class="px-3 py-2">Concluded</td><td class="px-3 py-2">{resolutionVote.concluded.toString()}</td></tr>
          {#if resolutionVote.concluded}
            <tr><td class="px-3 py-2">Winner</td><td class="px-3 py-2">{resolutionVote.winningCategory}</td></tr>
          {/if}
          <tr><td class="px-3 py-2">Votes For</td><td class="px-3 py-2">{resolutionVote.votes[1]}</td></tr>
          <tr><td class="px-3 py-2">Votes Against</td><td class="px-3 py-2">{resolutionVote.votes[0]}</td></tr>
        </tbody>
      </table>
    {/if}

    <!-- Voting Interface -->
    {#if totalBalanceUstx === 0}
      <div class="text-sm">
        <p>You have no governance tokens available.</p>
        <p class="mt-2">
          They may be locked in another vote. Visit the
          <a href="/dao?tab=token-sale" class="text-orange-600 underline hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">mint page</a> to mint or unlock tokens.
        </p>
      </div>
    {:else if resolutionVote.endBurnHeight >= currentBurnHeight && sip10Data}
      <DaoVotingPowerInput
        {sip10Data}
        {totalBalanceUstx}
        {votingPower}
        {txVoting}
        votingPowerChange={handleVotingPowerChange}
        votingTypeChange={handleVotingTypeChange}
      />

      <!-- Category Voting Buttons -->
      <div class="my-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each market.marketData.categories as category, index}
          <button
            onclick={() => {
              errorMessage = undefined;
              castVote(index, votingPower);
            }}
            class="mt-4 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600"
          >
            Vote: {category}
          </button>
        {/each}
      </div>

      {#if myVotes?.length > 0}
        <p class="mt-2 text-sm">
          You voted {myVotes.length} time(s) with
          <strong>{fmtMicroToStx(myVotesAmount, sip10Data.decimals)}</strong> governance tokens.
        </p>
      {/if}
      {#if txId}
        <Banner
          bannerType="warning"
          message={`Your request is processing. <a href="${stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId)}" target="_blank">View on explorer</a>`}
        />
      {/if}
      {#if errorMessage}
        <Banner bannerType="danger" message={errorMessage} />
      {/if}

      <!-- Progress bar -->
      <div class="mt-4">
        <BlockHeightProgressBar
          startBurnHeight={startVoting}
          stopBurnHeight={endVoting}
          currentBurnHeight={$chainStore.stacks.burn_block_height}
        />
      </div>
    {:else}
      <p class="text-sm">Thank you for participating in the vote.</p>
    {/if}
    <ParaContainer
      >Note: voting on proposals locks your $BIG governance tokens - <a
        class="text-blue-800 underline dark:text-blue-300"
        href={`/dispute/${market.marketId}/${market.marketType}`}>unlock them here</a
      > once voting has finished</ParaContainer
    >

    <!-- Conclude Button -->
    {#if !resolutionVote.concluded && resolutionVote.endBurnHeight < currentBurnHeight}
      <p class="mt-4 text-sm">The vote must be concluded before claims can begin.</p>
      <button
        onclick={() => {
          errorMessage = undefined;
          concludeVote();
        }}
        class="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:w-auto dark:focus:ring-offset-gray-900"
      >
        Conclude Vote
      </button>
    {/if}
  {/if}
</Panel>
