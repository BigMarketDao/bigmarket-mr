<script lang="ts">
	import { fmtNumber } from '@bigmarket/bm-utilities';
	import { daoInView } from '../shared/daoInView';

	let {
		activeMarkets,
		proposalCount
	}: {
		activeMarkets: number | null;
		proposalCount: number | null;
	} = $props();
</script>

<section class="relative border-t border-border bg-card/30 py-20" use:daoInView>
	<div class="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-5 lg:px-8">
		<div class="lg:col-span-3">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">How it works</p>
			<h2 class="mt-2 text-3xl font-bold text-foreground">
				It's a company. Just not like any you've seen.
			</h2>
			<p class="mt-4 text-muted-foreground">
				Most platforms have a team that controls everything — the fees, the rules, what markets get
				approved, where the money goes. BigMarket flipped that model.
			</p>
			<p class="mt-4 text-muted-foreground">
				The DAO is the governing body of BigMarket. It controls the treasury, sets the fee rates,
				approves market creators, and decides what gets built next. Every decision happens through a
				community vote — transparent, and final.
			</p>
			<p class="mt-4 text-muted-foreground">
				You don't need to be an insider to have a say. You just need BIG tokens.
			</p>
		</div>
		<div class="flex flex-col gap-4 lg:col-span-2">
			<div class="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40">
				<p class="text-4xl font-bold text-primary tabular-nums sm:text-5xl">10,000 BIG</p>
				<p class="mt-2 text-sm text-muted-foreground">Distributed every round to active participants</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40">
				<p class="text-4xl font-bold text-primary tabular-nums sm:text-5xl">
					{proposalCount != null ? fmtNumber(proposalCount) : '—'}
				</p>
				<p class="mt-2 text-sm text-muted-foreground">Community proposals submitted</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40">
				<p class="text-4xl font-bold text-primary tabular-nums sm:text-5xl">100%</p>
				<p class="mt-2 text-sm text-muted-foreground">On-chain governance — no admins, no overrides</p>
			</div>
		</div>
	</div>
</section>
