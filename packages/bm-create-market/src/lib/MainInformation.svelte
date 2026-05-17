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
    class="rounded-lg border border-border bg-muted p-6"
  >
    <h3 class="mb-4 text-lg font-medium text-foreground">
      Market Title & Description
    </h3>
    <div class="space-y-5">
      <div>
        <label for="title" class="block text-sm font-medium text-foreground"
          >Market Title</label
        >
        <input
          id="title"
          data-testid={`${testIdPrefix}:title`}
          class="mt-2 block w-full rounded border bg-background px-3 py-2 text-sm text-foreground
                 placeholder:text-muted-foreground shadow-sm focus-visible:border-ring
                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
                 {validation.errors.title
            ? 'border-destructive-border focus-visible:border-destructive'
            : 'border-border'}"
          placeholder="Enter a clear, concise title"
          bind:value={template.name}
          onfocus={() => (userHasInteracted.title = true)}
          oninput={() => validateOnInteraction('title', template.name, userHasInteracted)}
        />
        {#if validation.errors.title}
          <p
            data-testid={`${testIdPrefix}:error:title`}
            role="alert"
            class="mt-1 text-sm text-destructive"
          >
            {validation.errors.title}
          </p>
        {/if}
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-foreground"
          >Market Description</label
        >
        <textarea
          id="description"
          data-testid={`${testIdPrefix}:description`}
          rows="4"
          class="mt-2 block w-full rounded border bg-background px-3 py-2 text-sm text-foreground
                 placeholder:text-muted-foreground shadow-sm focus-visible:border-ring
                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
                 {validation.errors.description
            ? 'border-destructive-border focus-visible:border-destructive'
            : 'border-border'}"
          placeholder="Describe what this market predicts and why it matters..."
          bind:value={template.description}
          onfocus={() => (userHasInteracted.description = true)}
          oninput={() =>
            validateOnInteraction('description', template.description, userHasInteracted)}
        ></textarea>
        {#if validation.errors.description}
          <p
            data-testid={`${testIdPrefix}:error:description`}
            role="alert"
            class="mt-1 text-sm text-destructive"
          >
            {validation.errors.description}
          </p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Logo, Treasury, Fee -->
  <div
    class="rounded-lg border border-border bg-muted p-6"
  >
    <h3 class="mb-4 text-lg font-medium text-foreground">
      Market Branding & Treasury
    </h3>
    <div class="space-y-5">
      <!-- Logo -->
      <div>
        <label for="logo" class="block text-sm font-medium text-foreground"
          >Market Image URL</label
        >
        <input
          id="logo"
          data-testid={`${testIdPrefix}:logo`}
          class="mt-2 block w-full rounded border bg-background px-3 py-2 text-sm text-foreground
                 placeholder:text-muted-foreground shadow-sm focus-visible:border-ring
                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
                 {validation.errors.logo
            ? 'border-destructive-border focus-visible:border-destructive'
            : 'border-border'}"
          placeholder="https://example.com/image.jpg"
          bind:value={template.logo}
          onfocus={() => (userHasInteracted.logo = true)}
          onblur={() => componentKey++}
          oninput={() => validateOnInteraction('logo', template.logo, userHasInteracted)}
        />
        {#if validation.errors.logo}
          <p role="alert" class="mt-1 text-sm text-destructive">{validation.errors.logo}</p>
        {/if}
        {#key componentKey}
          <div class="mt-3" data-testid={`${testIdPrefix}:logo-preview`}>
            <LogoDisplay logo={template.logo} />
          </div>
        {/key}
      </div>

      <!-- Treasury -->
      <div>
        <label for="treasury" class="block text-sm font-medium text-foreground">
          Market Creator Treasury Address
        </label>
        <div class="mt-2 space-y-2">
          <div class="flex items-center gap-2">
            <input
              id="treasury"
              data-testid={`${testIdPrefix}:treasury`}
              class="block w-full rounded border bg-background px-3 py-2 text-sm text-foreground
                     placeholder:text-muted-foreground shadow-sm focus-visible:border-ring
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
                     {validation.errors.treasury
                ? 'border-destructive-border focus-visible:border-destructive'
                : 'border-border'}
                     {!treasuryEditable ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}"
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
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
                     {treasuryEditable
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                : 'border-border bg-muted text-muted-foreground hover:bg-muted/80'}"
              onclick={toggleTreasuryEditable}
            >
              {treasuryEditable ? 'Lock' : 'Edit'}
            </button>
          </div>
          {#if validation.errors.treasury}
            <p
              data-testid={`${testIdPrefix}:error:treasury`}
              role="alert"
              class="mt-1 text-sm text-destructive"
            >
              {validation.errors.treasury}
            </p>
          {/if}
        </div>
      </div>

      <!-- Fee -->
      <div>
        <label for="market-fee" class="block text-sm font-medium text-foreground">
          Market Fee (max {($daoOverviewStore.contractData?.marketFeeBipsMax || 1000) /
            100}%)
        </label>
        <input
          type="number"
          id="market-fee"
          data-testid={`${testIdPrefix}:fee`}
          class="mt-2 block w-full rounded border border-border bg-background px-3 py-2 text-sm
                 text-foreground placeholder:text-muted-foreground shadow-sm focus-visible:border-ring
                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          placeholder="2"
          bind:value={template.marketFee}
          oninput={handleInput}
        />
        {#if validation.errors.marketFee}
          <p
            data-testid={`${testIdPrefix}:error:marketFee`}
            role="alert"
            class="mt-1 text-sm text-destructive"
          >
            {validation.errors.marketFee}
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
