<script lang="ts">
  import { onMount } from 'svelte';
  import { fmtMicroToStx, fmtMicroToStxFormatted } from '@bigmarket/bm-utilities';
  import type { Sip10Data } from '@bigmarket/bm-types';
  import { InputField } from '@bigmarket/bm-ui';

  const { votingPowerChange, votingTypeChange, sip10Data, totalBalanceUstx, votingPower, txVoting } = $props<{
    votingPowerChange: (amount: string) => void;
    votingTypeChange: (txVoting: boolean) => void;
    sip10Data: Sip10Data;
    totalBalanceUstx: number;
    votingPower: number;
    txVoting: boolean;
	}>(); 



  let message = $derived(txVoting
    ? `Vote by sending a Stacks transaction - you will need enough ${sip10Data.symbol} pay the gas fee.  <a href="/" onclick=${() => (txVoting === !txVoting)}>change</a>`
    : `Vote by signing a message - voting is free. <a href="/" onclick=${() => (txVoting === !txVoting)}>change</a>`);

  let amountStx: string = $state('0');
  const balanceAtHeightF = $derived(fmtMicroToStxFormatted(totalBalanceUstx));

  let stxAmount = $state('');

  // Handle input change (InputField passes the string value, not a DOM event)
  function handleChange(value: string) {
    // Regex to allow numbers, one decimal point, and up to 6 decimal places
    const regex = /^\d*\.?\d{0,6}$/;
    if (regex.test(value)) {
      stxAmount = value;
    }
    votingPowerChange(value);
  }
  const updateTxVoting = () => {
    votingTypeChange(!txVoting);
  };

  function handleSubmit() {
    if (!stxAmount) {
      alert(`Please enter a valid ${sip10Data.symbol} amount`);
      return;
    }

    // Convert STX to microSTX
    const microStxAmount = Math.round(parseFloat(stxAmount) * 1_000_000);

    // Log or send the microSTX amount to the contract
    console.log('Sending to contract:', microStxAmount);
    // Add your contract call here
  }

  onMount(async () => {
    console.log('sip10Data: ', sip10Data);
    //amountStx = fmtMicroToStx(totalBalanceUstx);
  });
</script>

<div class="w-full space-y-3 rounded-lg py-4">
  <label for="Contribution" class="label">
    <span class="label-text font-semibold">Voting Power</span>
  </label>

  <div class="flex items-center gap-3">
    <InputField
      id="vote-source"
      type={'number'}
      label=""
      placeholder="Amount of BIG to vote with"
      bind:value={amountStx}
      onInput={handleChange}
    />

    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
      {sip10Data?.symbol || 'SYM'}
    </span>
  </div>

  <!-- Balance Hint -->
  <p class="text-sm text-gray-900 dark:text-gray-100">
    Max: <span class="font-medium"
      >{fmtMicroToStx(totalBalanceUstx, sip10Data?.decimals || 6)} {sip10Data?.symbol}</span
    >
  </p>

  <!-- Optional transaction mode toggle -->
  <!-- <BannerSlot bannerType="info">
		{@html message}
	</BannerSlot> -->
</div>
