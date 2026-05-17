<script lang="ts">
  import { chainStore } from '@bigmarket/bm-common';
  import { ResolutionState, type PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import { dateOfResolution } from '@bigmarket/bm-utilities';

  const { market } = $props<{
    market: PredictionMarketCreateEvent;
  }>();

  type StepState = 'completed' | 'current' | 'upcoming';

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  function containsHtml(text: string): boolean {
    return /<[a-z][\s\S]*>/i.test(text);
  }

  function getCriteriaForDisplay(m: PredictionMarketCreateEvent): string | null {
    const raw = m.unhashedData?.criterionSources?.criteria?.trim();
    if (!raw) return null;
    const plain = stripHtml(raw);
    const name = m.unhashedData?.name?.trim() ?? '';
    if (name && plain.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0) {
      return null;
    }
    if (plain.length < 10) return null;
    return raw;
  }

  function toHref(url: string): string {
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function normalizeUrlKey(url: string): string | null {
    try {
      const u = new URL(toHref(url));
      return `${u.hostname.replace(/^www\./i, '')}${u.pathname.replace(/\/$/, '')}`.toLowerCase();
    } catch {
      return null;
    }
  }

  function extractUrlsFromText(text: string): string[] {
    return text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  }

  function splitSourceList(text: string): string[] {
    return text
      .split(/[,;]|\band\b/i)
      .map((s) => s.trim().replace(/^[\s(]+|[\s).]+$/g, ''))
      .filter((s) => s.length > 1);
  }

  /** Pull named verification sources from criteria prose when the sources array is empty or stale. */
  function extractSourcesFromCriteria(criteria: string): string[] {
    const plain = stripHtml(criteria);
    const results: string[] = [];

    const prefixMatch = plain.match(
      /(?:reliable\s+sources?|resolution\s+sources?|sources?\s+used|sources?|verified\s+(?:by|using))\s*:\s*(.+)$/i,
    );
    if (!prefixMatch) return results;

    let tail = prefixMatch[1].replace(/\.\s*$/, '').trim();
    const paren = tail.match(/\(([^)]+)\)/);
    if (paren) {
      results.push(...splitSourceList(paren[1]));
      tail = tail.replace(/\([^)]+\)/, '').trim();
    }
    if (tail) {
      results.push(...splitSourceList(tail));
    }

    return results;
  }

  const OUTLET_HREF_PATTERNS: Array<[RegExp, string]> = [
    [/bbc/i, 'https://www.bbc.co.uk/news'],
    [/the\s+guardian|guardian/i, 'https://www.theguardian.com'],
    [/sky\s*news/i, 'https://news.sky.com'],
    [/reuters/i, 'https://www.reuters.com'],
    [/labour\s+party/i, 'https://labour.org.uk'],
    [/pyth/i, 'https://www.pyth.network'],
    [/wikipedia/i, 'https://www.wikipedia.org'],
  ];

  function hrefForSource(source: string): string | null {
    const trimmed = source.trim();
    if (/^https?:\/\//i.test(trimmed)) return toHref(trimmed);
    for (const [pattern, href] of OUTLET_HREF_PATTERNS) {
      if (pattern.test(trimmed)) return href;
    }
    return null;
  }

  /** Exclude AI discovery / article URLs; keep named and resolution verification sources. */
  function isDiscoveryArticleUrl(
    sourceUrl: string,
    description: string,
    criteria: string,
  ): boolean {
    const key = normalizeUrlKey(sourceUrl);
    if (!key) return false;

    const descriptionUrlKeys = new Set(
      extractUrlsFromText(description)
        .map((u) => normalizeUrlKey(u))
        .filter((k): k is string => Boolean(k)),
    );
    if (descriptionUrlKeys.has(key)) return true;

    try {
      const u = new URL(toHref(sourceUrl));
      const path = u.pathname.toLowerCase();
      if (!path.includes('/live/')) return false;

      const criteriaPlain = stripHtml(criteria).toLowerCase();
      const host = u.hostname.replace(/^www\./i, '').toLowerCase();
      const citedInCriteria =
        criteriaPlain.includes(sourceUrl.toLowerCase()) ||
        criteriaPlain.includes(host) ||
        criteriaPlain.includes(path);
      if (citedInCriteria) return false;

      const slug = path.split('/').filter(Boolean).pop() ?? '';
      const slugTokens = slug.split('-').filter((t) => t.length > 5);
      const descPlain = stripHtml(description).toLowerCase();
      if (slugTokens.length >= 2 && slugTokens.filter((t) => descPlain.includes(t)).length >= 2) {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  function getValidationSources(m: PredictionMarketCreateEvent): string[] {
    const raw = m.unhashedData?.criterionSources?.sources;
    let list: string[] = [];
    if (Array.isArray(raw)) {
      list = raw.filter((s) => typeof s === 'string' && s.trim());
    } else if (typeof raw === 'string' && raw.trim()) {
      list = [raw.trim()];
    }

    const description = m.unhashedData?.description ?? '';
    const criteria = m.unhashedData?.criterionSources?.criteria ?? '';
    const result: string[] = [];
    const seen = new Set<string>();

    const add = (s: string) => {
      const trimmed = s.trim();
      if (!trimmed) return;
      const dedupeKey = /^https?:\/\//i.test(trimmed)
        ? (normalizeUrlKey(trimmed) ?? trimmed.toLowerCase())
        : trimmed.toLowerCase();
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      result.push(trimmed);
    };

    for (const s of list) {
      if (!/^https?:\/\//i.test(s.trim())) {
        add(s);
        continue;
      }
      if (!isDiscoveryArticleUrl(s, description, criteria)) {
        add(s);
      }
    }

    for (const u of extractUrlsFromText(criteria)) {
      if (!isDiscoveryArticleUrl(u, description, criteria)) {
        add(u);
      }
    }

    for (const named of extractSourcesFromCriteria(criteria)) {
      add(named);
    }

    return result;
  }

  function stepLabelClass(state: StepState): string {
    if (state === 'completed') {
      return 'text-sm font-medium text-[var(--color-card-foreground)]';
    }
    if (state === 'current') {
      return 'text-sm font-semibold text-[var(--color-card-foreground)]';
    }
    return 'text-sm font-normal text-[var(--color-muted-foreground)]';
  }

  function connectorClass(left: StepState, right: StepState): string {
    const base = 'mx-2 mt-4 min-w-[1rem] flex-1 border-t';
    if (left === 'completed' && (right === 'current' || right === 'completed')) {
      return `${base} border-[var(--color-success-border)]`;
    }
    return `${base} border-[var(--color-border)]`;
  }

  const criteriaForDisplay = $derived(getCriteriaForDisplay(market));
  const criteriaIsHtml = $derived(
    criteriaForDisplay ? containsHtml(criteriaForDisplay) : false,
  );

  const validationSources = $derived(getValidationSources(market));

  const resolution = $derived(dateOfResolution($chainStore.stacks.burn_block_height, market));
  const currentHeight = $derived($chainStore.stacks.burn_block_height);
  const closeBlock = $derived(
    (market.marketData.marketStart ?? 0) + (market.marketData.marketDuration ?? 0),
  );
  const isResolved = $derived(
    market.marketData.resolutionState >= ResolutionState.RESOLUTION_RESOLVED,
  );

  const bettingStepState = $derived.by((): StepState => {
    if (currentHeight < closeBlock) return 'current';
    return 'completed';
  });

  const resultStepState = $derived.by((): StepState => {
    if (isResolved) return 'completed';
    if (currentHeight >= closeBlock) return 'current';
    return 'upcoming';
  });

  const timelineSteps = $derived([
    {
      key: 'opened',
      label: 'Market opened',
      date: resolution?.startOffChain ?? '',
      state: 'completed' as StepState,
    },
    {
      key: 'closes',
      label: 'Betting closes',
      date: resolution?.closeOffChain ?? '',
      state: bettingStepState,
    },
    {
      key: 'result',
      label: 'Result confirmed',
      date: resolution?.resolvesOffChain ?? '',
      state: resultStepState,
    },
  ]);
</script>

<svelte:head>
  <title>Market Volumes</title>
  <meta name="description" content="View prediction market details and participate" />
</svelte:head>

<!-- Collapsible Resolution Criteria -->
{#if market}
  <div class="mt-8">
    <details
      class="group rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] [&_summary::-webkit-details-marker]:hidden"
    >
      <summary
        class="flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-md)] p-4 text-[var(--color-card-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 focus-visible:outline-none"
      >
        <div class="flex items-center gap-2">
          <svg
            class="h-5 w-5 text-[var(--color-muted-foreground)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span class="text-sm font-medium">How this market resolves</span>
        </div>
        <svg
          class="h-5 w-5 text-[var(--color-muted-foreground)] transition duration-300 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>

      <div class="border-t border-[var(--color-border)] p-4">
        <div class="max-w-none text-sm text-[var(--color-muted-foreground)]">
          {#if criteriaForDisplay}
            {#if criteriaIsHtml}
              {@html criteriaForDisplay}
            {:else}
              <p class="leading-relaxed">{stripHtml(criteriaForDisplay)}</p>
            {/if}
          {:else}
            <p>No resolution criteria provided for this market.</p>
          {/if}

          <!-- Timeline -->
          <div class="mt-4 border-t border-[var(--color-border)] pt-4">
            <h3 class="mb-3 text-sm font-semibold text-[var(--color-card-foreground)]">Timeline</h3>
            <div class="flex items-start">
              {#each timelineSteps as step, i (step.key)}
                <div class="flex min-w-0 flex-1 flex-col items-center text-center">
                  <div class="relative mb-2 flex flex-col items-center">
                    {#if step.state === 'completed'}
                      <div
                        class="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-soft)]"
                      >
                        <svg
                          class="h-5 w-5 text-[var(--color-success)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    {:else if step.state === 'current'}
                      <span
                        class="absolute -top-1 -right-1 z-20 flex h-3 w-3"
                        aria-hidden="true"
                      >
                        <span
                          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-info)] opacity-75"
                        ></span>
                        <span
                          class="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-info)]"
                        ></span>
                      </span>
                      <div
                        class="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-info-border)] bg-[var(--color-info-soft)]"
                      >
                        <svg
                          class="h-5 w-5 text-[var(--color-info)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    {:else}
                      <div
                        class="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]"
                      >
                        <svg
                          class="h-5 w-5 text-[var(--color-muted-foreground)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    {/if}
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-1.5">
                    <span class={stepLabelClass(step.state)}>
                      {step.label}
                    </span>
                    {#if step.state === 'current'}
                      <span
                        class="rounded-full bg-[var(--color-info-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-info)]"
                      >
                        Now
                      </span>
                    {/if}
                  </div>
                  <div
                    class="mt-1 text-sm tabular-nums text-[var(--color-muted-foreground)]"
                  >
                    {step.date}
                  </div>
                </div>
                {#if i < timelineSteps.length - 1}
                  <div
                    class={connectorClass(step.state, timelineSteps[i + 1].state)}
                    aria-hidden="true"
                  ></div>
                {/if}
              {/each}
            </div>
          </div>

          <!-- How the outcome is verified -->
          <div class="mt-4 border-t border-[var(--color-border)] pt-4">
            <h3 class="mb-3 text-sm font-semibold text-[var(--color-card-foreground)]">
              How the outcome is verified
            </h3>
            <div>
              {#if market.marketType === 2}
                <div
                  class="flex items-start gap-3 border-b border-[var(--color-border)] py-3 last:border-0"
                >
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]"
                  >
                    <svg
                      class="h-4 w-4 text-[var(--color-muted-foreground)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold text-[var(--color-card-foreground)]">
                      Oracle Resolution
                    </div>
                    <p class="mt-0.5 text-sm text-[var(--color-muted-foreground)]">
                      This market will be resolved using verified oracle data.
                    </p>
                  </div>
                </div>
              {/if}

              <div
                class="flex items-start gap-3 border-b border-[var(--color-border)] py-3 last:border-0"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]"
                >
                  <svg
                    class="h-4 w-4 text-[var(--color-muted-foreground)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-semibold text-[var(--color-card-foreground)]">
                    Who decides the outcome
                  </div>
                  <p class="mt-0.5 text-sm text-[var(--color-muted-foreground)]">
                    {#if market.marketType === 2}
                      This market will be resolved using oracle data.
                    {:else}
                      The outcome is checked automatically using verified public sources. No single
                      person decides.
                    {/if}
                  </p>
                </div>
              </div>

              {#if validationSources.length > 0}
                <div
                  class="flex items-start gap-3 border-b border-[var(--color-border)] py-3 last:border-0"
                >
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]"
                  >
                    <svg
                      class="h-4 w-4 text-[var(--color-muted-foreground)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold text-[var(--color-card-foreground)]">
                      Sources used to verify the outcome
                    </div>
                    <p class="mb-1 mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                      The result will be confirmed using these sources:
                    </p>
                    <div class="space-y-1">
                      {#each validationSources as source (source)}
                        {@const href = hrefForSource(source)}
                        {#if href}
                          <a
                            {href}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block text-sm text-[var(--color-accent)] underline-offset-2 hover:underline"
                          >
                            {source.trim()}
                          </a>
                        {:else}
                          <span class="block text-sm text-[var(--color-muted-foreground)]">
                            {source.trim()}
                          </span>
                        {/if}
                      {/each}
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
  <div class="text-[var(--color-muted-foreground)]">Loading</div>
{/if}
