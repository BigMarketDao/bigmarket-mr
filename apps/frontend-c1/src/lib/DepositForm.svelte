<script lang="ts">
	import deposit from '@bigmarket/sdk';

	const tokenOptions = [
		{ label: 'Wrapped STX', value: 'wrapped-stx' },
		{ label: 'tUSDH', value: 'tusdh' }
	];

	let token = tokenOptions[0].value;
	let amount = 0;
	let status = '';
	let isError = false;
	let isSubmitting = false;

	async function onDeposit() {
		status = '';
		isError = false;

		if (!Number.isFinite(amount) || amount <= 0) {
			isError = true;
			status = 'Amount must be greater than 0.';
			return;
		}

		isSubmitting = true;
		try {
			await deposit(token, amount);
			status = 'Deposit submitted.';
		} catch (e) {
			isError = true;
			status = e?.message ? e.message : String(e);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div>
	<label>
		<span>Token</span>
		<select bind:value={token}>
			{#each tokenOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>
</div>

<div>
	<label>
		<span>Amount</span>
		<input type="number" min="0" step="1" bind:value={amount} />
	</label>
</div>

<div>
	<button on:click={onDeposit} disabled={isSubmitting}>
		Deposit
	</button>
</div>

{#if status}
	<p>{isError ? `Error: ${status}` : status}</p>
{/if}

