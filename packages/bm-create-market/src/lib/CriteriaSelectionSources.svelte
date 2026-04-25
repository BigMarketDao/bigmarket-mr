<script lang="ts">
  import { Profanity } from '@2toad/profanity';
  import { ExternalLink, Plus, X } from 'lucide-svelte';
  import type { CriterionSources } from '@bigmarket/bm-types';
  import type { ValidationResult } from './app/validation';

  // export let onCriteriaSourcesUpdate: (data: CriterionSources) => void;
  // export let criteriaSources: CriterionSources;
  // export let validation: ValidationResult;
  // export let testIdPrefix: string = 'market-mgt:critsourcesel';
	const { onCriteriaSourcesUpdate, criteriaSources, validation, testIdPrefix = 'market-mgt:critsourcesel' } = $props<{
		onCriteriaSourcesUpdate: (data: CriterionSources) => void;
		criteriaSources: CriterionSources;
		validation: ValidationResult;
		testIdPrefix: string ;
	}>();

  // Local working copy so the form is responsive and we can sanitize safely
  let localCriterion: CriterionSources = $derived({ ...criteriaSources });

  // If parent updates props (step navigation / regenerate), sync them in.
  // This avoids the bug where local state becomes stale.
  $effect(() => {
    if (criteriaSources) {
      localCriterion = { ...criteriaSources };
    }
  });

  // "Ready marker" for tests
  let ready = $state(true);

  let currentSource = $state('');
  const profanity = new Profanity();

  const sanitizeInput = (input: string): string =>
    input
      .trim()
      .replace(/[<>'"&]/g, '')
      .slice(0, 1000);

  const normalizeUrlLike = (input: string): string => sanitizeInput(profanity.censor(input));

  function emitUpdate(next: CriterionSources) {
    // Ensure stable shape
    const normalized: CriterionSources = {
      criteria: next.criteria ?? '',
      sources: (next.sources ?? []).filter(Boolean),
    };
    localCriterion = normalized;
    onCriteriaSourcesUpdate(normalized);
  }

  function addSource() {
    const raw = currentSource?.trim();
    if (!raw) return;

    const sanitized = normalizeUrlLike(raw);

    const sources = [...(localCriterion.sources ?? [])];
    if (sources.includes(sanitized)) {
      currentSource = '';
      return;
    }

    sources.push(sanitized);
    currentSource = '';
    emitUpdate({ ...localCriterion, sources });
  }

  function updateSource(index: number, newValue: string) {
    const sources = [...(localCriterion.sources ?? [])];
    sources[index] = sanitizeInput(newValue);
    emitUpdate({ ...localCriterion, sources });
  }

  function removeSource(index: number) {
    const sources = (localCriterion.sources ?? []).filter((_, i) => i !== index);
    emitUpdate({ ...localCriterion, sources });
  }

  function changeCriteria(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value;
    emitUpdate({ ...localCriterion, criteria: sanitizeInput(value) });
  }

  function onSourceKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSource();
    }
  }
</script>

<div class="space-y-6" data-testid={testIdPrefix}>
  {#if ready}
    <div data-testid={`${testIdPrefix}:ready`} class="hidden"></div>
  {/if}

  <div>
    <label for="criteria" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Resolution Criteria
    </label>
    <textarea
      id="criteria"
      data-testid={`${testIdPrefix}:criteria`}
      rows="4"
      class="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm
             focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none
             dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
      placeholder="Describe how this market should be resolved..."
      bind:value={localCriterion.criteria}
      oninput={changeCriteria}
    ></textarea>

    {#if validation.errors.criteria}
      <p
        data-testid={`${testIdPrefix}:error:criteria`}
        class="mt-1 text-sm text-red-600 dark:text-red-400"
      >
        {validation.errors.criteria}
      </p>
    {/if}
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      <div class="flex items-center gap-2">
        <ExternalLink class="h-4 w-4 text-gray-500" />
        Resolution Sources
      </div>
    </label>

    <div class="my-3 space-y-3">
      <div class="flex gap-2">
        <input
          type="text"
          data-testid={`${testIdPrefix}:source-input`}
          class="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
                 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          placeholder="https://example.com"
          bind:value={currentSource}
          onkeydown={onSourceKeydown}
        />
        <button
          type="button"
          data-testid={`${testIdPrefix}:source-add`}
          class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium
                 text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-orange-500/50 focus:outline-none
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          onclick={addSource}
          disabled={!currentSource.trim()}
          aria-disabled={!currentSource.trim()}
        >
          <Plus class="mr-2 -ml-1 h-4 w-4" /> Add
        </button>
      </div>

      {#if validation.errors.sources}
        <p
          data-testid={`${testIdPrefix}:error:sources`}
          class="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {validation.errors.sources}
        </p>
      {/if}

      {#if (localCriterion.sources?.length ?? 0) > 0}
        <div class="my-4 space-y-2" data-testid={`${testIdPrefix}:sources-list`}>
          {#each localCriterion.sources ?? [] as source, index (source + ':' + index)}
            <div
              class="flex items-center gap-2"
              data-testid={`${testIdPrefix}:source-row:${index}`}
            >
              <input
                type="text"
                data-testid={`${testIdPrefix}:source:${index}`}
                class="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm
                       focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none
                       dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                value={source}
                oninput={(e) => updateSource(index, (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                data-testid={`${testIdPrefix}:source-remove:${index}`}
                class="inline-flex items-center rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-500 shadow-sm
                       hover:bg-gray-50 focus:ring-2 focus:ring-orange-500/50 focus:outline-none
                       dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                onclick={() => removeSource(index)}
                aria-label="Remove source"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Optional computed summary for tests/debugging -->
  <div data-testid={`${testIdPrefix}:summary`} class="hidden">
    criteriaLength:{(localCriterion.criteria ?? '').length}
    sourcesCount:{(localCriterion.sources ?? []).length}
  </div>
</div>
