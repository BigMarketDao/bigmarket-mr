<script lang="ts">
	import { Button } from '@bigmarket/bm-ui';
	import { ArrowRight, Sparkles, Target, Vote } from 'lucide-svelte';
	import { daoInView } from '../shared/daoInView';

	const steps = [
		{
			n: '01',
			icon: Target,
			title: 'Participate',
			body: 'Make predictions, create markets, vote on disputes. Every action earns you reputation points (BIG-R) — permanently tied to your wallet.'
		},
		{
			n: '02',
			icon: Sparkles,
			title: 'Earn BIG',
			body: 'Every round (~monthly), 10,000 BIG is split between active participants based on their reputation score. The more you contribute, the bigger your share.'
		},
		{
			n: '03',
			icon: Vote,
			title: 'Govern',
			body: 'Use your BIG to vote on proposals, set fee rates, approve new market creators, and shape what BigMarket becomes next.'
		}
	];
</script>

<section id="how-to-join" class="border-t border-border py-20" use:daoInView>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-foreground">Want a seat at the table?</h2>
			<p class="mt-2 text-muted-foreground">You don't buy your way in. You earn it.</p>
		</div>

		<div class="mt-12 grid gap-6 md:grid-cols-3">
			{#each steps as step (step.n)}
				<div
					class="relative rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
				>
					<span class="absolute right-5 top-5 text-sm font-semibold tabular-nums text-muted-foreground/60">
						{step.n}
					</span>
					<div
						class="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"
					>
						<step.icon class="h-5 w-5" aria-hidden="true" />
					</div>
					<h3 class="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
				</div>
			{/each}
		</div>

		<div class="mt-12 text-center">
			<Button href="#control-panel" class="h-11 gap-2 px-8 text-base font-semibold md:h-10">
				Start earning BIG
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</Button>
		</div>
	</div>
</section>
