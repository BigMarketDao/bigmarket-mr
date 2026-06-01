<script lang="ts">
  import {
    type StoredOpinionPoll,
    type TokenPermissionEvent,
  } from "@bigmarket/bm-types";
  import { Coins } from "lucide-svelte";
  import { ParaContainer, Banner } from "@bigmarket/bm-ui";
  import {
    fmtMicroToStx,
    fmtStxMicro,
    getMarketToken,
    getMarketTokenEvent,
  } from "@bigmarket/bm-utilities";
  import type { ValidationResult } from "./app/validation";
  import { allowedTokenStore } from "@bigmarket/bm-common";
  import { marketDataToTupleCV } from "@bigmarket/sdk/dist/chains/stacks";

  const {
    template,
    validation,
    testIdPrefix = "market-mgt:liqsel",
  } = $props<{
    template: StoredOpinionPoll;
    validation: ValidationResult;
    testIdPrefix: string;
  }>();

  // ✅ reactive token metadata
  const sip10Data = $derived(
    getMarketToken(template?.token, $allowedTokenStore),
  );
  const tokenEvent: TokenPermissionEvent | null = $derived(
    getMarketTokenEvent(template?.token, $allowedTokenStore),
  );

  // ✅ local editable state
  let liquidityUi = $derived<number>(Number(fmtMicroToStx(template.liquidity)));

  // ✅ sync FROM template → UI
  // $effect(() => {
  //   const current = liquidityUi ?? 100000000;
  //   const next = current / Math.pow(10, sip10Data.decimals);

  //   if (!Number.isNaN(next) && next !== liquidityUi) {
  //     liquidityUi = next;
  //   }
  // });

  // ✅ sync FROM UI → template
  function updateLiquidity() {
    template.liquidity = fmtStxMicro(liquidityUi, sip10Data.decimals);
  }

  // ✅ derived validation (no recompute spam)
  const localLiquidityError = $derived(
    liquidityUi === null || liquidityUi === undefined
      ? "Liquidity is required."
      : Number.isNaN(liquidityUi)
        ? "Liquidity must be a number."
        : liquidityUi <= 0
          ? "Liquidity must be greater than 0."
          : null,
  );
</script>

<div data-testid={testIdPrefix} class="space-y-4">
  <div data-testid={`${testIdPrefix}:ready`} class="hidden"></div>

  <label for="liquidity" class="block text-sm font-medium text-foreground">
    <div class="flex items-center gap-2">
      <Coins class="h-4 w-4 text-muted-foreground" />
      Market Liquidity
    </div>
  </label>

  <ParaContainer>
    <div data-testid={`${testIdPrefix}:help`}>
      Enter how much {sip10Data.symbol} you want to seed the market with.
    </div>
  </ParaContainer>

  <ParaContainer>
    <Banner
      bannerType="info"
      message={`Ensure you have enough ${sip10Data.symbol} balance to avoid transaction failure.`}
    />
  </ParaContainer>

  <div>
    <input
      type="number"
      id="liquidity"
      data-testid={`${testIdPrefix}:input`}
      class={`mt-2 block w-full rounded border bg-background px-3 py-2 text-sm tabular-nums text-foreground
        placeholder:text-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring
        ${
          !localLiquidityError && !validation?.errors?.liquidity
            ? "border-border focus-visible:border-ring"
            : "border-destructive-border focus-visible:border-destructive"
        }`}
      placeholder={`Enter the amount of ${sip10Data.symbol} to seed market`}
      bind:value={liquidityUi}
      oninput={updateLiquidity}
    />

    {#if localLiquidityError}
      <p role="alert" class="mt-1 text-sm text-destructive">
        {localLiquidityError}
      </p>
    {/if}

    {#if validation?.errors?.liquidity}
      <p role="alert" class="mt-1 text-sm text-destructive">
        {validation.errors.liquidity}
      </p>
    {/if}
  </div>

  <div class="text-xs text-muted-foreground">
    {fmtMicroToStx(
      liquidityUi * Math.pow(10, sip10Data.decimals),
      sip10Data.decimals,
    )}
    {sip10Data.symbol}
    Minimum allowed: {tokenEvent?.minLiquidity || 100}
    {sip10Data.symbol}
  </div>
</div>
