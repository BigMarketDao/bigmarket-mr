<script lang="ts">
  import LogoDisplay from './LogoDisplay.svelte';
  import type { StoredOpinionPoll } from '@bigmarket/bm-types';
  import type { ValidationResult } from './app/validation';
  import { validateOnInteraction } from './app/validation';
  import { daoOverviewStore } from '@bigmarket/bm-common';

  // export let template: StoredOpinionPoll;
  // export let validation: ValidationResult;
  // export let userHasInteracted: Record<string, boolean>;
  // export let treasuryEditable: boolean;
  // export let toggleTreasuryEditable: () => void;
  // export let handleInput: (e: Event) => void;
  // export let showValidationSummary: boolean;
  // export let allFieldsValid: boolean;
  // export let testIdPrefix: string = 'market-mgt:main';

  const { template, validation, userHasInteracted, treasuryEditable, toggleTreasuryEditable, handleInput, showValidationSummary, allFieldsValid, testIdPrefix = 'market-mgt:main' } = $props<{
		template: StoredOpinionPoll;
		validation: ValidationResult;
		userHasInteracted: Record<string, boolean>;
    treasuryEditable: boolean;
    toggleTreasuryEditable: () => void;
    handleInput: (e: Event) => void;
    showValidationSummary: boolean;
    allFieldsValid: boolean;
    testIdPrefix: string;
 }>();


  let componentKey = $state(0);
</script>

<!-- {#if showValidationSummary && !allFieldsValid}
	<div class="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
		<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Please complete all required fields</p>
	</div>
{/if} -->

<div class="space-y-6">
  <!-- Title & Description -->
  <div
    class="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800"
  >
    <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
      Market Title & Description
    </h3>
    <div class="space-y-5">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Market Title</label
        >
        <input
          id="title"
          data-testid={`${testIdPrefix}:title`}
          class="mt-2 block w-full rounded border px-3 py-2 text-sm text-gray-900
                 placeholder-gray-500 shadow-sm focus:ring-1 focus:ring-orange-500/20 focus:outline-none
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                 {validation.errors.title
            ? 'border-red-300 focus:border-red-500 dark:border-red-600'
            : 'border-gray-300 focus:border-orange-500 dark:border-gray-700'}"
          placeholder="Enter a clear, concise title"
          bind:value={template.name}
          onfocus={() => (userHasInteracted.title = true)}
          oninput={() => validateOnInteraction('title', template.name, userHasInteracted)}
        />
        {#if validation.errors.title}
          <p
            data-testid={`${testIdPrefix}:error:title`}
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {validation.errors.title}
          </p>
        {/if}
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Market Description</label
        >
        <textarea
          id="description"
          data-testid={`${testIdPrefix}:description`}
          rows="4"
          class="mt-2 block w-full rounded border px-3 py-2 text-sm text-gray-900
                 placeholder-gray-500 shadow-sm focus:ring-1 focus:ring-orange-500/20 focus:outline-none
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                 {validation.errors.description
            ? 'border-red-300 focus:border-red-500 dark:border-red-600'
            : 'border-gray-300 focus:border-orange-500 dark:border-gray-700'}"
          placeholder="Describe what this market predicts and why it matters..."
          bind:value={template.description}
          onfocus={() => (userHasInteracted.description = true)}
          oninput={() =>
            validateOnInteraction('description', template.description, userHasInteracted)}
        ></textarea>
        {#if validation.errors.description}
          <p
            data-testid={`${testIdPrefix}:error:description`}
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {validation.errors.description}
          </p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Logo, Treasury, Fee -->
  <div
    class="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800"
  >
    <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
      Market Branding & Treasury
    </h3>
    <div class="space-y-5">
      <!-- Logo -->
      <div>
        <label for="logo" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Market Image URL</label
        >
        <input
          id="logo"
          data-testid={`${testIdPrefix}:logo`}
          class="mt-2 block w-full rounded border px-3 py-2 text-sm text-gray-900
                 placeholder-gray-500 shadow-sm focus:ring-1 focus:ring-orange-500/20 focus:outline-none
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                 {validation.errors.logo
            ? 'border-red-300 focus:border-red-500 dark:border-red-600'
            : 'border-gray-300 focus:border-orange-500 dark:border-gray-700'}"
          placeholder="https://example.com/image.jpg"
          bind:value={template.logo}
          onfocus={() => (userHasInteracted.logo = true)}
          onblur={() => componentKey++}
          oninput={() => validateOnInteraction('logo', template.logo, userHasInteracted)}
        />
        {#if validation.errors.logo}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.logo}</p>
        {/if}
        {#key componentKey}
          <div class="mt-3" data-testid={`${testIdPrefix}:logo-preview`}>
            <LogoDisplay logo={template.logo} />
          </div>
        {/key}
      </div>

      <!-- Treasury -->
      <div>
        <label for="treasury" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Market Creator Treasury Address
        </label>
        <div class="mt-2 space-y-2">
          <div class="flex items-center gap-2">
            <input
              id="treasury"
              data-testid={`${testIdPrefix}:treasury`}
              class="block w-full rounded border px-3 py-2 text-sm text-gray-900
                     placeholder-gray-500 shadow-sm focus:ring-1 focus:ring-orange-500/20 focus:outline-none
                     dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                     {validation.errors.treasury
                ? 'border-red-300 focus:border-red-500 dark:border-red-600'
                : 'border-gray-300 focus:border-orange-500 dark:border-gray-700'}
                     {!treasuryEditable ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}"
              placeholder="Enter treasury address"
              bind:value={template.treasury}
              disabled={!treasuryEditable}
              onfocus={() => (userHasInteracted.treasury = true)}
              oninput={() =>
                validateOnInteraction('treasury', template.treasury, userHasInteracted)}
            />
            <button
              type="button"
              data-testid={`${testIdPrefix}:treasury-toggle`}
              class="rounded border px-3 py-2 text-xs font-medium transition-colors
                     {treasuryEditable
                ? 'border-orange-300 bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200'}"
              onclick={toggleTreasuryEditable}
            >
              {treasuryEditable ? 'Lock' : 'Edit'}
            </button>
          </div>
          {#if validation.errors.treasury}
            <p
              data-testid={`${testIdPrefix}:error:treasury`}
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {validation.errors.treasury}
            </p>
          {/if}
        </div>
      </div>

      <!-- Fee -->
      <div>
        <label for="market-fee" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Market Fee (max {($daoOverviewStore.contractData?.marketFeeBipsMax || 1000) /
            100}%)
        </label>
        <input
          type="number"
          id="market-fee"
          data-testid={`${testIdPrefix}:fee`}
          class="mt-2 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-500 shadow-sm focus:border-orange-500
                 focus:ring-1 focus:ring-orange-500/20 focus:outline-none
                 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          placeholder="2"
          bind:value={template.marketFee}
          oninput={handleInput}
        />
        {#if validation.errors.marketFee}
          <p
            data-testid={`${testIdPrefix}:error:marketFee`}
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {validation.errors.marketFee}
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
