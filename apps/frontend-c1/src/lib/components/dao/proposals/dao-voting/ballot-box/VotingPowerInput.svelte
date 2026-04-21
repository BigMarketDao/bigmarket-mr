<script lang="ts">
	import { onMount } from 'svelte';
	import { BannerSlot } from '@bigmarket/bm-ui';
	import { fmtMicroToStxNumber, fmtMicroToStxFormatted } from '@bigmarket/bm-utilities';
	import { Pencil } from 'lucide-svelte';
	let {
		onVotingPowerChange,
		onVotingTypeChange,
		totalBalanceUstx = 0,
		votingPower = 0,
		txVoting = false
	}: {
		onVotingPowerChange: (value: number) => void;
		onVotingTypeChange: (value: boolean) => void;
		totalBalanceUstx?: number;
		votingPower?: number;
		txVoting?: boolean;
	} = $props();
	let amountStx = $state(0);
	let editing = $state(false);
	const effectiveVotingPower = $derived(votingPower === 0 ? totalBalanceUstx : votingPower);

	const updateTxVoting = () => {
		onVotingTypeChange(!txVoting);
	};

	onMount(async () => {
		amountStx = fmtMicroToStxNumber(totalBalanceUstx);
	});
</script>

<div class="">
	<BannerSlot bannerType="warning">
		<div class="flex w-full justify-between">
			<div>
				<button
					class="font-medium text-black underline"
					onclick={updateTxVoting}
				><Pencil class="mb-1 inline h-5 w-5" aria-hidden="true" />
					{#if txVoting}
						Vote by sending a Stacks transaction - you will need enough STX to pay the gas fee
					{:else}
						Vote by signing a message - voting is free
					{/if}
				</button>
			</div>
		</div>
	</BannerSlot>
</div>

<div class="my-5 max-w-xl">
	<div class="flex flex-col gap-y-5 rounded-md">
		<div class="text-white">
			<div>
				<div class="start">
					<button onclick={() => (editing = !editing)}>
						<Pencil class="mb-1 inline h-5 w-5" aria-hidden="true" />
						<span class="underline"
							>Voting power is {fmtMicroToStxFormatted(effectiveVotingPower)} STX</span
						>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

{#if editing}
	<div class="mb-5 flex w-full flex-col justify-start">
		<input
			class="w-1/2 rounded-lg border-gray-800 p-2 text-black"
			bind:value={amountStx}
			onkeyup={() => onVotingPowerChange(amountStx)}
			type="number"
			id="Contribution"
			aria-describedby="Contribution"
		/>
	</div>
{/if}
