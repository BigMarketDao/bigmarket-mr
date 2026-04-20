<script lang="ts">
	import {
		daoConfigStore,
		requireDaoClient,
		requireDaoConfig
	} from '$lib/stores/config/daoConfigStore';
	import {
		Button,
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle,
		Input
	} from '@bigmarket/bm-ui';

	const tokenOptions = [
		{
			label: 'STX',
			value: `${requireDaoConfig($daoConfigStore).VITE_WRAPPED_STX_FULL_CONTRACT}`
		},
		{
			label: 'USDH',
			value: `${requireDaoConfig($daoConfigStore).VITE_USDH_FULL_CONTRACT}`
		}
	];

	let token = $state(tokenOptions[0].value);
	let amount = $state(0);
	let status = $state('');
	let isError = $state(false);
	let isSubmitting = $state(false);

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
			await requireDaoClient($daoConfigStore).deposit(token, amount);
			status = 'Deposit submitted.';
		} catch (e: unknown) {
			isError = true;
			if (e instanceof Error) {
				status = e.message;
			} else {
				status = String(e);
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card class="mx-auto w-full max-w-md bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	<CardHeader class="mb-5 px-6">
		<CardTitle class="text-gray-900 dark:text-gray-100">Deposit</CardTitle>
		<CardDescription class="text-gray-600 dark:text-gray-400"
			>Choose a token and amount to deposit into the DAO vault.</CardDescription
		>
	</CardHeader>

	<CardContent class="px-6">
		<div class="grid gap-4">
			<label class="grid gap-2 text-sm">
				<span class="font-medium">Token</span>
				<select
					bind:value={token}
					class="border-input ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 rounded-md border bg-gray-50 px-3 py-1 text-sm text-gray-900 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100"
				>
					{#each tokenOptions as opt (opt.value)}
						<option class="" value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</label>

			<label class="mb-5 grid gap-2 text-sm">
				<span class="font-medium text-gray-900 dark:text-gray-100">Amount</span>
				<Input
					type="number"
					min="0"
					step="1"
					bind:value={amount}
					inputmode="numeric"
					placeholder="0"
					class="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
				/>
			</label>

			{#if status}
				<p
					class={[
						'rounded-md border px-3 py-2 text-sm',
						isError
							? 'border-destructive/30 bg-destructive/5 text-destructive'
							: 'border-border bg-muted/20 text-foreground'
					].join(' ')}
				>
					{isError ? `Error: ${status}` : status}
				</p>
			{/if}
		</div>
	</CardContent>

	<CardFooter class="px-6">
		<Button class="w-full" onclick={onDeposit} disabled={isSubmitting}>
			{isSubmitting ? 'Submitting…' : 'Deposit'}
		</Button>
	</CardFooter>
</Card>
