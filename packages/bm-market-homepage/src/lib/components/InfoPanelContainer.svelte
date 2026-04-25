<script lang="ts">
	import { Lock, TrendingUp, Users, Wallet } from 'lucide-svelte';

	const infoPanels = [
		{
			Icon: Wallet,
			header: 'Create & Own Markets',
			message:
				'Create prediction markets on politics, crypto, sports, and entertainment. Markets are recorded on-chain with your wallet as the creator.'
		},
		{
			Icon: TrendingUp,
			header: 'Native Protocols',
			message: 'Trade with Stacks and Bitcoin. Market liquidity scales with pool depth.'
		},
		{
			Icon: Users,
			header: 'One-Click Payouts',
			message:
				'Claim winnings directly to your wallet after market resolution and dispute period ends. Deterministic smart contract resolution prevents manipulation.'
		},
		{
			Icon: Lock,
			header: 'Instant & Uncensored',
			message:
				'Connect your wallet and start trading immediately. Market rules governed by community vote.'
		}
	];
</script>

<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 xl:gap-6">
	{#each infoPanels as info}
		<div
			class="rounded border border-gray-200 bg-white p-4 shadow-sm md:p-6 dark:border-gray-700 dark:bg-gray-900"
		>
			<div class="space-y-3">
				<svelte:component this={info.Icon} class="h-8 w-8 text-orange-500 dark:text-orange-400" />
				<h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">{info.header}</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300">{info.message}</p>
			</div>
		</div>
	{/each}
</div>
