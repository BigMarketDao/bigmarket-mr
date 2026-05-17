<script lang="ts">
	import { daoInView } from '../shared/daoInView';
	import {
		Clock,
		Coins,
		Shield,
		Timer,
		Users,
		Vault
	} from 'lucide-svelte';

	const tiles = [
		{
			icon: Coins,
			title: 'The fee rate on every trade',
			body: "The community votes on exactly how much users pay per trade. Right now it's 1%. That number can only change with a vote."
		},
		{
			icon: Users,
			title: 'Who gets to create markets',
			body: 'Want to launch a market on BigMarket? The DAO approves creators. No insider list — just a community vote.'
		},
		{
			icon: Shield,
			title: 'Who resolves disputed outcomes',
			body: 'If a market result is challenged, the community votes to correct it. No single person decides who won.'
		},
		{
			icon: Vault,
			title: 'The community treasury',
			body: '70% of every protocol fee goes into a treasury owned by BIG holders. Spending it requires a community proposal.'
		},
		{
			icon: Timer,
			title: 'How long disputes last',
			body: 'The dispute window — currently about one day — is set by governance. The community can vote to change it.'
		},
		{
			icon: Clock,
			title: 'How rewards are distributed',
			body: 'The 10,000 BIG distributed every round, the tier weights, and the epoch length are all governance-controlled.'
		}
	];
</script>

<section class="relative border-t border-border bg-card/40 py-20" use:daoInView>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
			Real power. Real decisions.
		</p>
		<h2 class="mt-2 text-3xl font-bold text-foreground">This is what the community actually controls.</h2>
		<p class="mt-2 text-muted-foreground">Not in theory. Right now, on-chain, with every vote.</p>

		<div class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each tiles as tile (tile.title)}
				<div
					class="group rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
				>
					<div
						class="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/15"
					>
						<tile.icon class="h-5 w-5" aria-hidden="true" />
					</div>
					<h3 class="mt-4 font-semibold text-card-foreground">{tile.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{tile.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
