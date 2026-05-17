<script lang="ts">
  import { chainStore } from '@bigmarket/bm-common';
  import { type PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import { dateOfResolution } from '@bigmarket/bm-utilities';

	const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>();
</script>

<svelte:head>
  <title>Market Volumes</title>
  <meta name="description" content="View prediction market details and participate" />
</svelte:head>

<!-- Collapsible Resolution Criteria -->
{#if market}
  <div class="mt-8">
    <details
      class="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
    >
      <summary
        class="flex cursor-pointer items-center justify-between gap-2 rounded-lg p-4 text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span class="text-sm font-medium">Resolution Criteria</span>
        </div>
        <svg
          class="h-5 w-5 text-muted-foreground transition duration-300 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>

      <div class="border-t border-border p-4">
        <div class="max-w-none text-sm text-muted-foreground">
          {#if market.unhashedData.criterionSources?.criteria}
            {@html market.unhashedData.criterionSources?.criteria}
          {:else}
            <p>This market will be resolved based on verifiable public information.</p>
          {/if}

          <!-- Resolution Timeline -->
          <div class="mt-4 border-t border-border pt-4">
            <h3 class="mb-4 text-sm font-medium text-foreground">
              Resolution Timeline
            </h3>
            <div class="relative">
              <!-- Timeline Line -->
              <div class="absolute top-4 left-0 h-0.5 w-full bg-muted"></div>

              <!-- Timeline Steps -->
              <div class="relative grid grid-cols-3 gap-4">
                <!-- Start -->
                <div class="text-center">
                  <div class="flex flex-col items-center">
                    <div
                      class="relative z-10 mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-success-soft"
                    >
                      <svg
                        class="h-5 w-5 text-success"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div class="text-sm font-medium text-foreground">
                      Market Started
                    </div>
                    <div class="mt-1 tabular-nums text-xs text-muted-foreground">
                      {dateOfResolution($chainStore.stacks.burn_block_height, market)?.startOffChain}
                    </div>
                  </div>
                </div>

                <!-- Trading Closes -->
                <div class="text-center">
                  <div class="flex flex-col items-center">
                    <div
                      class="relative z-10 mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-info-soft"
                    >
                      <svg
                        class="h-5 w-5 text-info"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div class="text-sm font-medium text-foreground">
                      Trading Closes
                    </div>
                    <div class="mt-1 tabular-nums text-xs text-muted-foreground">
                      {dateOfResolution($chainStore.stacks.burn_block_height, market)?.closeOffChain}
                    </div>
                  </div>
                </div>

                <!-- Resolution -->
                <div class="text-center">
                  <div class="flex flex-col items-center">
                    <div
                      class="relative z-10 mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-warning-soft"
                    >
                      <svg
                        class="h-5 w-5 text-warning"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <div class="text-sm font-medium text-foreground">Resolution</div>
                    <div class="mt-1 tabular-nums text-xs text-muted-foreground">
                      {dateOfResolution($chainStore.stacks.burn_block_height, market)?.resolvesOffChain}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Resolution Sources -->
          <div class="mt-4 border-t border-border pt-4">
            <h3 class="mb-3 text-sm font-medium text-foreground">
              Resolution Sources
            </h3>
            <div class="space-y-3">
              <!-- Oracle Info -->
              {#if market.marketType === 2}
                <div class="flex items-start gap-3 rounded-lg bg-muted p-3">
                  <div
                    class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-community-soft"
                  >
                    <svg
                      class="h-4 w-4 text-community"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-foreground">
                      Oracle Resolution
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      This market will be resolved using verified oracle data.
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Resolution Agent -->
              <!-- Resolution Method -->
              <div class="flex items-start gap-3 rounded-lg bg-muted p-3">
                <div
                  class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-info-soft"
                >
                  <svg
                    class="h-4 w-4 text-info"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-foreground">
                    Resolution Method
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {#if market.marketType === 2}
                      This market will be resolved using oracle data.
                    {:else}
                      This market will be resolved by a verified resolution agent.
                    {/if}
                  </div>
                </div>
              </div>

              <!-- External Sources -->
              {#if market.unhashedData.criterionSources?.sources}
                <div class="flex items-start gap-3 rounded-lg bg-muted p-3">
                  <div
                    class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-success-soft"
                  >
                    <svg
                      class="h-4 w-4 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-foreground">
                      External Sources
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {@html market.unhashedData.criterionSources?.sources}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </details>
  </div>
{:else}
  <div class="text-muted-foreground">Loading</div>
{/if}
