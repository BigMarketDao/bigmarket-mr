<script lang="ts">
  import { Banner } from '@bigmarket/bm-ui';
  import { aiMarket, bitcoinMode, daoOverviewStore } from '@bigmarket/bm-common';
  import { isLoggedIn, allowedTokenStore } from '@bigmarket/bm-common';
  import { onMount } from 'svelte';

  import CategorySelection from './CategorySelection.svelte';
  import LiquiditySelection from './LiquiditySelection.svelte';
  import MarketTypeSelection from './MarketTypeSelection.svelte';
  import TokenSelection from './TokenSelection.svelte';
  import CriteriaSelectionDays from './CriteriaSelectionDays.svelte';
  import CriteriaSelectionSources from './CriteriaSelectionSources.svelte';
  import { confirmPoll, getSignature } from './app/market_creation';
  import { validatePoll, type ValidationResult } from './app/validation';
  import { showTxModal, requireAppConfig, requireDaoConfig, appConfigStore, daoConfigStore } from '@bigmarket/bm-common';
  import type {
    StoredOpinionPoll,
    CriterionSources,
    MarketCategoricalOption,
    ScalarMarketDataItem,
  } from '@bigmarket/bm-types';
  import type { MarketTypeContainer } from '@bigmarket/bm-types';
  import MainInformation from './MainInformation.svelte';

  const { examplePoll, onPollSubmit, onRegenerate, forceStep } = $props<{
    examplePoll: StoredOpinionPoll;
    onPollSubmit: (data: any) => void;
		onRegenerate: (data: any) => void;
    forceStep: number;
	}>();

  const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let validation: ValidationResult = $state({ isValid: true, errors: {} });
  let template: StoredOpinionPoll = $derived({ ...examplePoll }) ;
  let errorMessage = $state('');
  let isSubmitting = $state(false);
  let isWaitingForTransaction = $state(false);
  let currentStep = $derived(forceStep);

  let inited = $state(false);
  let isBitcoinMarket = $derived($bitcoinMode);
  let sessionStoreReady = $derived(Boolean(
    $daoOverviewStore.contractData?.marketInitialLiquidity !== undefined &&
      $daoOverviewStore.contractData?.marketFeeBipsMax !== undefined,
  ));

  // run validation reactively
  //$: validation = validatePoll(template);
  let allFieldsValid = $derived(validation.isValid);

  // Interaction tracking (per-field)
  let userHasInteracted: Record<string, boolean> = {
    title: false,
    description: false,
    treasury: false,
    logo: false,
    twitter: false,
    discord: false,
    website: false,
  };

  let showValidationSummary = $state(false);
  let treasuryEditable = $state(false);

  const toggleTreasuryEditable = () => {
    treasuryEditable = !treasuryEditable;
  };

  const steps = [
    {
      title: 'Main',
      description: 'Title, description, and image',
      fields: ['title', 'description', 'logo', 'treasury', 'marketFee'],
    },
    {
      title: 'Resolution',
      description: 'When and how the market resolves',
      fields: ['criteria', 'sources'],
    },
    {
      title: 'Market',
      description: 'Binary, categorical, or scalar market',
      fields: ['marketType', 'options', 'priceFeed', 'ranges', 'liquidity', 'category', 'token'],
    },
    {
      title: 'Create',
      description: 'Sign the data and submit transaction',
      fields: [],
    },
  ];
  const totalSteps = steps.length;

  function isValid(): boolean {
    const result = validatePoll(template, $daoOverviewStore.contractData?.marketFeeBipsMax || 1000);
    //   const stepFields = steps[stepIndex].fields;
    //   const stepErrors = stepFields.filter((f) => result.errors[f]);
    return result.isValid;
  }

  const nextStep = async () => {
    const all = validatePoll(template, $daoOverviewStore.contractData?.marketFeeBipsMax || 1000);
    const stepFields = steps[currentStep].fields;

    const stepHasErrors = stepFields.some((f) => all.errors[f]);
    validation = all;
    showValidationSummary = true;

    if (!stepHasErrors && currentStep < totalSteps - 1) {
      currentStep++;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    if (currentStep > 0) currentStep--;
  };

  const handleMarketTypeUpdate = async (update: MarketTypeContainer) => {
    if (update.marketType !== undefined) template.marketType = update.marketType;
    if (update.marketTypeDataCategorical !== undefined)
      template.marketTypeDataCategorical = update.marketTypeDataCategorical;
    if (update.marketTypeDataScalar !== undefined)
      template.marketTypeDataScalar = update.marketTypeDataScalar;
    if (update.priceFeedId !== undefined) template.priceFeedId = update.priceFeedId;
  };

  const handleCriterionUpdate = (duration: number, coolDown: number, startHeight: number) => {
    template.criterionDays = { duration, coolDown, startHeight };
    if (template.marketType === 2) onRegenerate(template, 1);
    currentStep = 1;
    nextStep();
  };

  function regenerate() {
    if (template.marketType === 2) onRegenerate(template, 2);
    currentStep = 2;
    nextStep();
  }

  function handleTokenChange() {
    if (template.marketType === 2) onRegenerate(template, 2);
    template.liquidity =
      $allowedTokenStore.find((o) => o.token === template.token)?.minLiquidity || 0;
    currentStep = 2;
    nextStep();
  }

  const handleCriterionSourcesUpdate = (data: CriterionSources) => {
    template.criterionSources = { ...data };
  };

  const handleSelectToken = (newToken: string) => {
    template.token = newToken;
  };

  const handleSelectCategory = (newCategory: string) => {
    template.category = newCategory;
  };

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const fee = Number(target.value) || 0;
    template.marketFee = fee;
    //const maxFee = $sessionStore?.daoOverview?.contractData?.marketFeeBipsMax || 1000;
    // errorMessage = !isValidMarketFee(fee) ? `Market fee must be between 0 and ${maxFee / 100}%` : '';
  }

  const openSigRequest = async () => {
    if (!isLoggedIn()) {
      errorMessage = 'Wallet not connected. Please connect your wallet and try again.';
      return;
    }
    isSubmitting = true;

    try {
      const { dataHash, poll } = await getSignature(appConfig, daoConfig, template, $daoOverviewStore);
      aiMarket.set(poll);
      if (!dataHash) {
        errorMessage = 'Data hash is required but not available';
        return;
      }
      const tokenEvent = $allowedTokenStore.find((o) => o.token === template.token);
      if (!tokenEvent) {
        errorMessage = 'Token not found';
        return;
      }
      const response = await confirmPoll(appConfig, daoConfig, dataHash, template, $daoOverviewStore, tokenEvent);
      if (response!.success) {
        showTxModal(response!.txid || 'Unable to process right now');
        onPollSubmit(response!.txid || '');
      } else {
        errorMessage = response!.error || 'Unable to process right now';
      }
    } catch (err: any) {
      errorMessage = err;
    }
    isSubmitting = false;
    isWaitingForTransaction = false;
  };

  onMount(async () => {
    template = { ...examplePoll };
    if (!examplePoll.marketTypeDataCategorical) {
      template.marketTypeDataCategorical = [] as MarketCategoricalOption[];
    }
    if (!examplePoll.marketTypeDataScalar) {
      template.marketTypeDataScalar = [] as ScalarMarketDataItem[];
    }
    template.liquidity =
      $allowedTokenStore.find((o) => o.token === template.token)?.minLiquidity || 0;
    currentStep = forceStep || 0;
    inited = true;
  });
</script>

{#if inited}
  {#if sessionStoreReady}
    <div data-testid="market-mgt:ready" class="hidden"></div>
  {/if}

  <div class="space-y-6 sm:space-y-8" data-testid="market-mgt:page">
    {#if errorMessage}
      <div data-testid="market-mgt:error-banner">
        <Banner bannerType="warning" message={errorMessage} />
      </div>
    {/if}

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-gray-700" data-testid="market-mgt:steps">
      <nav class="scrollbar-hide -mb-px flex space-x-4 overflow-x-auto sm:space-x-8">
        {#each steps as step, i}
          <button
            data-testid={`market-mgt:step-tab:${step.title.toLowerCase()}`}
            aria-current={i === currentStep ? 'step' : undefined}
            class="flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 {i ===
            currentStep
              ? 'border-orange-500 text-orange-600 dark:border-orange-500 dark:text-orange-500'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
            onclick={() => (currentStep = i)}
          >
            {step.title}
          </button>
        {/each}
      </nav>
    </div>

    <!-- Step content -->
    <div class="space-y-6" data-testid={`market-mgt:step-panel:${currentStep}`}>
      {#if currentStep === 0}
        <MainInformation
          {template}
          {validation}
          {userHasInteracted}
          {treasuryEditable}
          {toggleTreasuryEditable}
          {handleInput}
          {showValidationSummary}
          {allFieldsValid}
          testIdPrefix={'market-mgt:main'}
        />
      {:else if currentStep === 1}
        <CriteriaSelectionDays
          {validation}
          marketType={template.marketType}
          onCriteriaUpdate={handleCriterionUpdate}
          criteriaDays={template.criterionDays}
          testIdPrefix={'market-mgt:critdayssel'}
        />
        <CriteriaSelectionSources
          {validation}
          onCriteriaSourcesUpdate={handleCriterionSourcesUpdate}
          criteriaSources={template.criterionSources}
          testIdPrefix={'market-mgt:critsourcesel'}
        />
      {:else if currentStep === 2}
        <MarketTypeSelection
          {validation}
          {template}
          onFeedChange={regenerate}
          testIdPrefix={'market-mgt:martypesel'}
        />
        <LiquiditySelection {validation} {template} testIdPrefix={'market-mgt:liqsel'} />
        {#if !isBitcoinMarket}
          <TokenSelection
            onTokenChange={handleTokenChange}
            {validation}
            {template}
            testIdPrefix={'market-mgt:toksel'}
          />
        {/if}
        <CategorySelection onCriteriaUpdate={handleCriterionUpdate} {validation} {template} testIdPrefix={'market-mgt:catsel'} />
      {:else if currentStep === 3}
        <div
          class="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Market Creation Process
          </h3>
          <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
            You'll need to approve two transactions:
          </p>
          <ul class="list-inside list-disc space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Sign content to authorize with server</li>
            <li>Sign transaction to set up the market in the smart contract</li>
          </ul>
          <p class="my-3 text-sm text-gray-600 dark:text-gray-400">
            Allow <span class="font-extrabold">around 5 minutes</span> for the market to appear on the
            public site.
          </p>
        </div>
      {/if}
    </div>

    <!-- Nav buttons -->
    <div class="flex justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
      <button data-testid="market-mgt:prev" onclick={prevStep} disabled={currentStep === 0}>
        Previous
      </button>

      {#if currentStep < totalSteps - 1}
        <button data-testid="market-mgt:next" onclick={nextStep}>Next</button>
      {:else if isValid()}
        <button
          data-testid="market-mgt:create"
          onclick={openSigRequest}
          disabled={isWaitingForTransaction || !sessionStoreReady}
        >
          {#if !sessionStoreReady}
            Loading...
          {:else if isSubmitting}
            Signing...
          {:else if isWaitingForTransaction}
            Waiting...
          {:else}
            Create Market
          {/if}
        </button>
      {:else}
        <div data-testid="market-mgt:fix-validation">Fix validation errors</div>
      {/if}
    </div>
  </div>
{/if}
