<script lang="ts">
	import { Coins, Globe, Trophy } from 'lucide-svelte';
	import { daoInView } from '../shared/daoInView';

	const cards = [
		{
			icon: Coins,
			title: 'A cut of every trade',
			body: 'Every time someone stakes on a market, a 1% protocol fee is collected. 70% goes directly to the DAO treasury — owned by BIG holders.',
			tag: 'Live now',
			tagClass: 'bg-success-soft text-success'
		},
		{
			icon: Trophy,
			title: 'Monthly reputation rewards',
			body: '10,000 BIG is distributed every round to active participants. Predict, create, vote — the more you show up, the more you earn.',
			tag: 'Live now',
			tagClass: 'bg-success-soft text-success'
		},
		{
			icon: Globe,
			title: 'Growing beyond one blockchain',
			body: 'BigMarket is built to expand. Future versions will bring markets to more chains. Every new market means more volume, more fees, more value for the DAO.',
			tag: 'Roadmap',
			tagClass: 'bg-secondary text-muted-foreground'
		}
	];
</script>

<section class="relative border-t border-border bg-card/30 py-20" use:daoInView>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h2 class="text-3xl font-bold text-foreground">Three ways BIG token holders earn</h2>
		<p class="mt-2 max-w-3xl text-muted-foreground">
			You're not just a user here. Every part of the platform generates value that flows back to the
			community.
		</p>

		<div class="mt-10 grid gap-6 md:grid-cols-3">
			{#each cards as card (card.title)}
				<div
					class="group flex flex-col rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
				>
					<div class="flex items-center justify-between">
						<div
							class="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"
						>
							<card.icon class="h-5 w-5" aria-hidden="true" />
						</div>
						<span class="rounded-full px-2 py-0.5 text-xs font-medium {card.tagClass}">
							{card.tag}
						</span>
					</div>
					<h3 class="mt-4 font-semibold text-card-foreground">{card.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
