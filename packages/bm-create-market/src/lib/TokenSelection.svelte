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
    class="block text-sm font-medium text-foreground"
  >
    <div class="flex items-center gap-2">
      <Coins class="h-4 w-4 text-muted-foreground" />
      Market Token
    </div>
  </label>

  <p
    class="mb-2 text-sm text-muted-foreground"
    data-testid={`${testIdPrefix}:help`}
  >
    Users will transact in this market using this token
  </p>

  <select
    id="token"
    data-testid={`${testIdPrefix}:select`}
    class="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-sm
           text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring
           focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
      role="alert"
      class="mt-1 text-sm text-destructive"
    >
      {validation.errors.token}
    </p>
  {/if}

  <!-- Tiny debug/computed marker for tests -->
  <div
    data-testid={`${testIdPrefix}:selected`}
    class="text-xs text-muted-foreground"
  >
    Selected: {template.token || "(none)"}
  </div>
</div>
