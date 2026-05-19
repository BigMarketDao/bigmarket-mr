<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
	import FeeFlowDiagram from '../shared/FeeFlowDiagram.svelte';
	import { daoInView } from '../shared/daoInView';
</script>

<section class="relative border-t border-border py-20" use:daoInView>
	<div class="mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-2 lg:gap-12 lg:px-8">
		<div>
			<span
				class="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground"
			>
				<Sparkles class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
				The flywheel
			</span>
			<h2 class="mt-4 text-3xl font-bold text-foreground">The house wins. So do you.</h2>
			<p class="mt-4 leading-relaxed text-muted-foreground">
				Every market on BigMarket starts with the DAO staking equally across all outcomes. That means
				no matter what happens, the DAO treasury earns from every market — not by taking from users,
				but by participating like everyone else.
			</p>
			<p class="mt-4 leading-relaxed text-muted-foreground">
				The more markets run, the more the treasury earns. The more the treasury earns, the more
				flows back to BIG holders. It's a flywheel — and you're inside it.
			</p>

			<ul class="mt-6 space-y-2 text-sm text-muted-foreground">
				<li class="flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
					No house edge — the DAO trades on the same curve as you
				</li>
				<li class="flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
					Every fee is on-chain and traceable
				</li>
				<li class="flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
					Treasury spend requires a community vote
				</li>
			</ul>
		</div>

		<div class="rounded-2xl border border-border bg-card p-5 sm:p-6">
			<FeeFlowDiagram />
		</div>
	</div>
</section>
