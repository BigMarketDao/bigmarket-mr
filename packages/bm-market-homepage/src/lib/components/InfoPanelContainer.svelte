<script lang="ts">
	import { CircleDollarSign, Lock, MessageCircle, Wallet } from 'lucide-svelte';

	const infoPanels = [
		{
			Icon: MessageCircle,
			header: 'You have opinions. Get paid.',
			message:
				"Will Bitcoin go up this week? Will that politician resign? If you have a take, there's a market for it."
		},
		{
			Icon: Wallet,
			header: 'Put some money on it',
			message:
				"Decide how much you want to risk. Could be $5. Could be $500. No account needed, no approval process. You're in."
		},
		{
			Icon: CircleDollarSign,
			header: "If you're right, you get paid",
			message:
				'Wrong predictions fund the winners. The pot gets split between everyone who called it correctly.'
		},
		{
			Icon: Lock,
			header: 'No one can cheat you out of it',
			message:
				'The payout is automatic. No company holds your money. No one decides whether to pay you. It just happens.'
		}
	];
</script>

<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 xl:gap-6">
	{#each infoPanels as info}
		<div
			class="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-shadow hover:shadow-md md:p-6"
		>
			<div class="space-y-3">
				<svelte:component this={info.Icon} class="h-8 w-8 text-primary" aria-hidden="true" />
				<h3 class="text-base font-semibold leading-snug text-card-foreground">{info.header}</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">{info.message}</p>
			</div>
		</div>
	{/each}
</div>
