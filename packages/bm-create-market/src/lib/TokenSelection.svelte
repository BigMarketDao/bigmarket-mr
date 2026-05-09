<script lang="ts">
  import type {
    StoredOpinionPoll,
    TokenPermissionEvent,
  } from "@bigmarket/bm-types";
  import { Coins } from "lucide-svelte";
  import type { ValidationResult } from "./app/validation";
  import { allowedTokenStore } from "@bigmarket/bm-common";

  const {
    template,
    validation,
    onTokenChange,
    testIdPrefix = "market-mgt:toksel",
    tokens,
  } = $props<{
    template: StoredOpinionPoll;
    validation: ValidationResult;
    onTokenChange: (step?: number) => void;
    testIdPrefix: string;
    tokens: TokenPermissionEvent[];
  }>();

  type SelectToken = { value: string; label: string; disabled?: boolean };

  // --- Fix: react to allowedTokens changing (was only set onMount)
  let displayTokens = $derived(toSelectOptions(tokens));

  function toSelectOptions(tokens: TokenPermissionEvent[]): SelectToken[] {
    // const allowed = (tokens ?? []).filter((o) => o.allowed);
    const allowed = [
      ...new Map(
        (tokens ?? []).filter((t) => t.allowed).map((t) => [t.token, t]),
      ).values(),
    ];
    return allowed.map((t) => ({
      value: t.token,
      label: t.sip10Data?.symbol?.toUpperCase() || t.token || "???",
      disabled: false,
    }));
  }

  function tokenChange(e: Event) {
    // template.token is already bound; still ensure it’s set and call parent handler.
    template.token = (e.target as HTMLSelectElement).value;
    onTokenChange?.();
  }
</script>

<div data-testid={testIdPrefix} class="space-y-2">
  <div data-testid={`${testIdPrefix}:ready`} class="hidden"></div>

  <label
    for="token"
    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
  >
    <div class="flex items-center gap-2">
      <Coins class="h-4 w-4 text-gray-500" />
      Market Token
    </div>
  </label>

  <p
    class="mb-2 text-sm text-gray-500 dark:text-gray-400"
    data-testid={`${testIdPrefix}:help`}
  >
    Users will transact in this market using this token
  </p>

  <select
    id="token"
    data-testid={`${testIdPrefix}:select`}
    class="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm
           text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
           focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200
           dark:placeholder-gray-400"
    bind:value={template.token}
    onchange={tokenChange}
  >
    <!-- Fix: don't use `selected` with bind:value; let Svelte control selection -->
    {#each displayTokens as token (token.value)}
      <option value={token.value} disabled={token.disabled}
        >{token.label}</option
      >
    {/each}
  </select>

  {#if validation?.errors?.token}
    <p
      data-testid={`${testIdPrefix}:error:token`}
      class="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {validation.errors.token}
    </p>
  {/if}

  <!-- Tiny debug/computed marker for tests -->
  <div
    data-testid={`${testIdPrefix}:selected`}
    class="text-xs text-gray-500 dark:text-gray-400"
  >
    Selected: {template.token || "(none)"}
  </div>
</div>
