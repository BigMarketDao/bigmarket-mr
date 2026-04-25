<script lang="ts">
  import type { StoredOpinionPoll, MarketCategory } from '@bigmarket/bm-types';
  import { Tag } from 'lucide-svelte';
  import type { ValidationResult } from './app/validation';
  import { chainStore, marketSystemCategoriesStore } from '@bigmarket/bm-common';

  // export let template: StoredOpinionPoll;
  // export let validation: ValidationResult;
  // export let testIdPrefix: string = 'market-mgt:catsel';

  const { template, validation, testIdPrefix = 'market-mgt:catsel' } = $props<{
		onCriteriaUpdate: (duration: number, coolDown: number, startHeight: number) => void;
		template: StoredOpinionPoll;
    validation: ValidationResult
		testIdPrefix: string ;
	}>();

  type SelectCat = { value: string; label: string; disabled?: boolean };

  // --- Fix: react to store changes (was only onMount)
  let systemCategories = $derived($marketSystemCategoriesStore ?? []);

  let displayCategories = $derived(toSelectOptions(systemCategories));

  // --- Fix: ensure template.category is always a valid *active* category (when possible)
  $effect(() => {
    if (!systemCategories || systemCategories.length === 0) {
      // Nothing to choose from yet
    } else {
      const active = systemCategories.filter((c) => c.active);
      const pool = active.length > 0 ? active : systemCategories;

      const exists = pool.some((c) => c.name === template.category);
      if (!exists) {
        template.category = pool[0].name;
      }
    }
  });

  function toSelectOptions(categories: MarketCategory[]): SelectCat[] {
    return (categories ?? []).map((category) => ({
      value: category.name,
      label: category.displayName,
      disabled: !category.active,
    }));
  }

  function onChange(e: Event) {
    template.category = (e.target as HTMLSelectElement).value;
  }
</script>

<div data-testid={testIdPrefix} class="space-y-2">
  <div data-testid={`${testIdPrefix}:ready`} class="hidden"></div>

  <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
    <div class="flex items-center gap-2">
      <Tag class="h-4 w-4 text-gray-500" />
      Market Category
    </div>
  </label>

  <p class="mb-2 text-sm text-gray-500 dark:text-gray-400" data-testid={`${testIdPrefix}:help`}>
    Which market sector will the market operate within?
  </p>

  <select
    id="category"
    data-testid={`${testIdPrefix}:select`}
    class="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
           text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
           focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white
           dark:placeholder-gray-400"
    bind:value={template.category}
    onchange={onChange}
    disabled={(displayCategories?.length ?? 0) === 0}
  >
    <!-- Fix: don't use `selected` with bind:value -->
    <option value="" disabled>Select a category</option>

    {#each displayCategories as cat (cat.value)}
      <option value={cat.value} disabled={cat.disabled}>{cat.label}</option>
    {/each}
  </select>

  {#if validation?.errors?.category}
    <p
      data-testid={`${testIdPrefix}:error:category`}
      class="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {validation.errors.category}
    </p>
  {/if}

  <div data-testid={`${testIdPrefix}:selected`} class="text-xs text-gray-500 dark:text-gray-400">
    Selected: {template.category || '(none)'}
  </div>
</div>
