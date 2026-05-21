<script lang="ts">
	import { Button } from '@bigmarket/bm-ui';
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';

	interface Props {
		maxBalance: bigint | null;
		canDeposit: boolean;
		busy: boolean;
		txHash: string | null;
		explorerUrl: string | null;
		errorMsg: string | null;
		onDeposit: (amountMicro: bigint) => void;
	}

	const { maxBalance, canDeposit, busy, txHash, explorerUrl, errorMsg, onDeposit }: Props =
		$props();

	const MICRO = 1_000_000n;

	let rawInput = $state('');

	const amountMicro = $derived.by((): bigint | null => {
		const trimmed = (rawInput + '').trim();
		if (!trimmed) return null;
		const parsed = parseFloat(trimmed);
		if (!Number.isFinite(parsed) || parsed <= 0) return null;
		return BigInt(Math.floor(parsed * 1_000_000));
	});

	const amountError = $derived.by((): string | null => {
		if ((rawInput + '').trim() === '') return null;
		if (amountMicro === null) return 'Enter a valid amount.';
		if (maxBalance !== null && amountMicro > maxBalance) {
			return `Amount exceeds your balance of ${fmtMicroToStx(Number(maxBalance), 6)} USDCx.`;
		}
		return null;
	});

	const canSubmit = $derived(
		canDeposit && amountMicro !== null && amountMicro > 0n && amountError === null
	);

	function setMax() {
		if (maxBalance === null) return;
		rawInput = (Number(maxBalance) / Number(MICRO)).toFixed(6).replace(/\.?0+$/, '');
	}

	function handleDeposit() {
		if (!canSubmit || amountMicro === null) return;
		onDeposit(amountMicro);
	}
</script>

<div class="space-y-2">
	<label
		class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
		for="usdcx-amount"
	>
		Amount (USDCx)
	</label>
	<div class="flex gap-2">
		<input
			id="usdcx-amount"
			type="number"
			min="0"
			step="any"
			placeholder="0.000000"
			bind:value={rawInput}
			disabled={!canDeposit}
			class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
		/>
		<button
			type="button"
			onclick={setMax}
			disabled={!canDeposit || maxBalance === null}
			class="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
		>
			Max
		</button>
	</div>

	{#if amountError}
		<p class="text-xs text-red-600 dark:text-red-400">{amountError}</p>
	{/if}
</div>

{#if errorMsg}
	<p class="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
{/if}

{#if explorerUrl && txHash}
	<p class="text-xs text-emerald-800 dark:text-emerald-200">
		Deposit submitted.
		<a class="font-mono break-all underline" href={explorerUrl} target="_blank" rel="noreferrer"
			>{txHash}</a
		>
	</p>
{:else if txHash}
	<p class="text-xs text-emerald-800 dark:text-emerald-200">
		Deposit submitted. <span class="font-mono break-all">{txHash}</span>
	</p>
{/if}

<Button type="button" onclick={handleDeposit} disabled={!canSubmit} class="w-full cursor-pointer">
	{busy ? 'Submitting…' : 'Move USDCx to vault'}
</Button>

<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
	You will sign the vault deposit from your connected Stacks wallet.
</p>
