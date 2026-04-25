<script lang="ts">
  import { chainStore } from '@bigmarket/bm-common';
  import type { CriterionDays } from '@bigmarket/bm-types';
  import { ParaContainer } from '@bigmarket/bm-ui';
  import { Banner } from '@bigmarket/bm-ui';
  import { BannerSlot } from '@bigmarket/bm-ui';
  import type { ValidationResult } from './app/validation';

  // export let onCriteriaUpdate: (duration: number, coolDown: number, startHeight: number) => void;
  // export let marketType: number;
  // export let criteriaDays: CriterionDays;
  // export let validation: ValidationResult;
  // export let testIdPrefix: string = 'market-mgt:critdayssel';

  const { onCriteriaUpdate, marketType, criteriaDays, validation, testIdPrefix = 'market-mgt:critsourcesel' } = $props<{
		onCriteriaUpdate: (duration: number, coolDown: number, startHeight: number) => void;
		marketType: number;
		criteriaDays: CriterionDays;
    validation: ValidationResult
		testIdPrefix: string ;
	}>();


  let hasTouched = false;
  let duration = $derived(criteriaDays.duration ?? 144);
  let coolDown = $derived(criteriaDays.coolDown ?? 72);

  let selectedDate: string = $state(''); // ISO string from date picker

  let currentBlockHeight = $derived(($chainStore.stacks.burn_block_height ?? 0) + 1);
  const BLOCK_TIME_SECONDS = 600; // 10 minutes

  function handleDateChange(e: Event) {
    hasTouched = true;
    const input = e.target as HTMLInputElement;
    selectedDate = input.value;

    const now = new Date();
    const target = new Date(selectedDate);
    const diffSeconds = (target.getTime() - now.getTime()) / 1000;

    duration = Math.max(Math.floor(diffSeconds / BLOCK_TIME_SECONDS), 1);

    if (currentBlockHeight > 0) {
      onCriteriaUpdate(duration, coolDown, currentBlockHeight);
    }
  }

  function handleCooldownChange(e: Event) {
    hasTouched = true;
    coolDown = parseInt((e.target as HTMLSelectElement).value, 10) || 0;

    if (currentBlockHeight > 0) {
      onCriteriaUpdate(duration, coolDown, currentBlockHeight);
    }
  }
  // For display
  const resolutionDateLabel = $derived(
  selectedDate
    ? new Date(selectedDate).toLocaleString()
    : criteriaDays.earliest_resolution_date
      ? criteriaDays.earliest_resolution_date
      : (() => {
          const totalBlocks = criteriaDays.duration + criteriaDays.coolDown;
          const totalSeconds = totalBlocks * BLOCK_TIME_SECONDS;
          const resolutionTimestamp = Date.now() + totalSeconds * 1000;

          return new Date(resolutionTimestamp).toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        })()
);
  // 🔸 Utility: format cooldown for banner
  function formatCooldown(blocks: number): string {
    if (blocks < 72) {
      const hours = (blocks * 10) / 60; // each block ≈ 10 minutes
      return `${hours.toFixed(1)} hours`;
    } else {
      const days = blocks / 144;
      return `${days.toFixed(2)} days`;
    }
  }
  function toLocalDatetimeInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  let minDatetime = $derived(toLocalDatetimeInputValue(new Date()));

  const coolDownOptions = [
    { label: 'minimum', value: 11 },
    { label: '4 hours', value: 24 },
    { label: '¼ day', value: 36 },
    { label: '½ day', value: 72 },
    { label: '¾ day', value: 108 },
    ...Array.from({ length: 5 }, (_, i) => ({
      label: `${i + 1} days`,
      value: (i + 1) * 144,
    })),
  ];
</script>

<!-- 🔸 Replaced duration dropdown with a date picker -->
{#if $chainStore.stacks.burn_block_height !== undefined}
  <div data-testid={`${testIdPrefix}:ready`} class="hidden"></div>
{/if}

<div class="space-y-6" data-testid={testIdPrefix}>
  <div>
    <label for="duration" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Market Close Date
    </label>
    <input
      type="datetime-local"
      data-testid={`${testIdPrefix}:close-datetime`}
      id="duration"
      class="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
				text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
				dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      onchange={handleDateChange}
      bind:value={selectedDate}
      min={minDatetime}
    />

    {#if validation.errors.duration}
      <p
        data-testid={`${testIdPrefix}:error:duration`}
        class="mt-1 text-sm text-red-600 dark:text-red-400"
      >
        {validation.errors.duration}
      </p>
    {/if}

    <p
      data-testid={`${testIdPrefix}:duration-blocks`}
      class="mt-1 text-xs text-gray-500 dark:text-gray-400"
    >
      ≈ {duration} Bitcoin blocks
    </p>
  </div>
</div>

<div>
  <label for="coolDown" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Cool Down Duration
  </label>
  <select
    id="coolDown"
    data-testid={`${testIdPrefix}:cooldown-select`}
    class="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
             text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
             dark:border-gray-700 dark:bg-gray-800 dark:text-white"
    onchange={handleCooldownChange}
    bind:value={coolDown}
  >
    {#each coolDownOptions as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  {#if validation.errors.coolDown}
    <p
      data-testid={`${testIdPrefix}:error:coolDown`}
      class="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {validation.errors.coolDown}
    </p>
  {/if}
  <p
    data-testid={`${testIdPrefix}:cooldown-blocks`}
    class="mt-1 text-xs text-gray-500 dark:text-gray-400"
  >
    {coolDown} blocks (~ {formatCooldown(coolDown)})
  </p>
</div>

{#if marketType === 1}
  <div
    data-testid={`${testIdPrefix}:summary`}
    class="grid grid-cols-1 gap-6 rounded-sm border-2 border-amber-600"
  >
    <div>
      <div class="bg-muted/30 space-y-3 rounded-xl">
        <!-- <BannerSlot bannerType="info"> -->
        <div class="p-5 gap-y-4 flex flex-col text-gray-500 dark:text-gray-200">
          <div>Resolves <span class="inline-block font-thin">{resolutionDateLabel}</span></div>
          <div>
            Duration (bitcoin blocks): <span class="inline-block font-thin"
              >{duration} (~ {(duration / 144).toFixed(2)} days)</span
            >
          </div>
          <div>
            Cooldown (bitcoin blocks): <span class="inline-block font-thin"
              >{coolDown} (~ {formatCooldown(coolDown)})</span
            >
          </div>
        </div>
        <!-- </BannerSlot> -->
      </div>
    </div>
  </div>
{/if}
