<script lang="ts">
  import { Countdown } from '@bigmarket/bm-ui';

	let {
		currentBurnHeight,
		startBurnHeight,
		stopBurnHeight
	} = $props<{
		currentBurnHeight: number;
		startBurnHeight: number;
		stopBurnHeight: number;
	}>();

  // current Stacks burn block height from your session store
  const fmtNumber = (amount: number | undefined) => {
    if (amount === 0) return '0';
    if (amount) return new Intl.NumberFormat().format(amount);
  };

  // derived values with sane clamping
  let total = $derived(Math.max(0, stopBurnHeight - startBurnHeight));
  let elapsedBlocks = $derived(Math.min(Math.max(currentBurnHeight - startBurnHeight, 0), total));
  let rawProgress = $derived(total === 0 ? 0 : (elapsedBlocks / total) * 100);
  let progress = $derived(Math.max(0, Math.min(rawProgress, 100)));

  // phases for styling & copy
  let phase = $derived(
    currentBurnHeight < startBurnHeight ? 'not-started' : currentBurnHeight >= stopBurnHeight ? 'completed' : 'running'
  );
</script>

<div class="my-5 w-full select-none">
  <!-- Header line: labels -->
  <!-- <div class="mb-2 flex items-end justify-between text-xs text-neutral-600 dark:text-neutral-300">
		<div class="space-x-2">
			<span class="font-medium">Start:</span>
			<span class="tabular-nums">{fmtNumber(startBurnHeight)}</span>
		</div>
		<div class="space-x-2 text-right">
			<span class="font-medium">End:</span>
			<span class="tabular-nums">{fmtNumber(stopBurnHeight)}</span>
		</div>
	</div> -->

  <!-- Track -->
  <div
    class="relative h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(progress)}
    aria-label="Market cooldown progress"
  >
    <!-- Filled bar -->
    <div
      class="h-full rounded-full transition-[width] duration-500 ease-out"
      class:animate-[pulse_2s_ease-in-out_infinite]={phase === 'not-started'}
      style={`width:${progress}%;
				background-image: linear-gradient(to right, rgb(99 102 241), rgb(56 189 248), rgb(16 185 129));
				filter: saturate(${phase === 'completed' ? 0.9 : 1});`}
    ></div>

    <!-- optional candy stripes while running -->
    {#if phase === 'running'}
      <div
        class="absolute inset-0"
        style="
					background-image: repeating-linear-gradient(
						-45deg,
						rgba(255,255,255,0.25) 0,
						rgba(255,255,255,0.25) 8px,
						transparent 8px,
						transparent 16px
					);
					mask-image: linear-gradient(to right, black ${progress}%, transparent ${progress}%);
					-webkit-mask-image: linear-gradient(to right, black ${progress}%, transparent ${progress}%);
					animation: slide 12s linear infinite;
				"
      ></div>
    {/if}

    <!-- Current marker (tiny pin) -->
    <div
      class="pointer-events-none absolute -top-1.5 h-6 w-0.5 rounded bg-neutral-700 dark:bg-neutral-200"
      style={`left: calc(${progress}% - 1px);`}
      aria-hidden="true"
    ></div>
  </div>

  <!-- Caption / status -->
  <div class="mt-2 flex w-full flex-col items-center justify-between text-xs">
    <div class="text-neutral-600 dark:text-neutral-300">
      {#if phase === 'not-started'}
        <span class="font-medium">Starts in</span>
        <span class="tabular-nums">
          {fmtNumber(Math.max(startBurnHeight - currentBurnHeight, 0))} blocks
        </span>
      {:else if phase === 'running'}
        <span class="">Progress:</span>
        <span class="font-medium tabular-nums">{Math.round(progress)}%</span>
        <span class="mx-2 text-neutral-400 dark:text-neutral-500">•</span>
        <span class="tabular-nums">{fmtNumber(elapsedBlocks)}</span>/<span class="tabular-nums"
          >{fmtNumber(total)}</span
        >
        <span class="ml-1">blocks</span>
      {:else}
        <span class="font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
      {/if}
    </div>

    {#if phase !== 'completed'}
      <div class="text-center">
        <!-- Your existing block->time conversion UI -->
        <Countdown endBlock={Math.max(stopBurnHeight - currentBurnHeight, 0)} scaleFactor={1} />
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes slide {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 256px 0;
    }
  }
</style>
