<script lang="ts">
	import { onMount } from 'svelte';
	import VoteResultsRow from './VoteResultsRow.svelte';
	import VoteTransactions from './VoteTransactions.svelte';

	let {
		votes = [],
		summary
	}: {
		votes?: Array<any>;
		summary: any;
	} = $props();

	let showVotes = false;
	let componentKey = 0;

	const fetchTransactions = async () => {
		if (showVotes) {
			showVotes = false;
			return;
		}
		showVotes = true;
	};

	onMount(async () => {});
</script>

{#if summary}
	<VoteResultsRow stxFor={summary.stxFor} stxAgainst={summary.stxAgainst} accountsFor={summary.accountsFor} accountsAgainst={summary.accountsAgainst} />
{/if}

<div class="flex justify-between">
	<a href="/" class={'text-lg text-gray-400'} on:click|preventDefault={() => fetchTransactions()}
		>{#if !showVotes}Show{:else}Hide{/if} transaction details</a
	>
</div>

{#if showVotes}
	<div class="mt-6 w-1/2">
		<p>
			<span class="text-sm">
				Vote stacks transactions sent to the stx.eco DAO contract are counted - any stacks holder is able to vote with a voting power up to the liquid balance of their account(s) at the stacks block height when voting began.
			</span>
		</p>
	</div>
	{#key componentKey}
		<VoteTransactions {votes} />
	{/key}
{/if}
