<script lang="ts">
	import { Button } from '@bigmarket/bm-ui';
	import { fmtNumber } from '@bigmarket/bm-utilities';
	import { ArrowRight, CircleHelp, LayoutDashboard } from 'lucide-svelte';
	import { daoInView } from '../shared/daoInView';

	let {
		activeMarkets,
		proposalCount,
		showPanelCta = false,
		onScrollToPanel
	}: {
		activeMarkets: number | null;
		proposalCount: number | null;
		showPanelCta?: boolean;
		onScrollToPanel?: () => void;
	} = $props();

	const epochRewardLabel = '10,000';
</script>

<section class="relative py-20" use:daoInView>
	<div class="mx-auto max-w-4xl px-4 text-center sm:px-6">
		<span
			class="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
			DAO — Decentralised Autonomous Organisation
			<span class="group relative inline-flex align-middle">
				<CircleHelp class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
				<span
					role="tooltip"
					class="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-64 -translate-x-1/2 rounded-md border border-border bg-popover p-3 text-left text-xs font-normal normal-case text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
				>
					Think of it as a company with no boss, no board, and no headquarters. Just rules
					written in code, and members like you running it.
				</span>
			</span>
		</span>

		<h1
			class="mt-6 font-heading text-4xl leading-[1.15] font-bold tracking-tight text-balance text-foreground sm:text-5xl"
		>
			BigMarket has no CEO.<br />
			<span class="text-primary">You're looking at the people who run it.</span>
		</h1>

		<p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
			BigMarket is owned and governed by its community. Every fee, every rule, every decision —
			voted on by BIG token holders. No boardroom. No investors calling the shots. Just people who
			showed up and earned their seat.
		</p>

		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			{#if showPanelCta && onScrollToPanel}
				<Button class="h-11 gap-2 px-6 font-semibold md:h-10" onclick={onScrollToPanel}>
					<LayoutDashboard class="h-4 w-4" aria-hidden="true" />
					Open Control Panel
				</Button>
				<Button href="#how-to-join" variant="outline" class="h-11 gap-2 px-6 md:h-10">
					How rewards work
					<ArrowRight class="h-4 w-4" aria-hidden="true" />
				</Button>
			{:else}
				<Button href="#how-to-join" class="h-11 gap-2 px-6 font-semibold md:h-10">
					Start earning BIG
					<ArrowRight class="h-4 w-4" aria-hidden="true" />
				</Button>
				<Button href="#control-panel" variant="outline" class="h-11 gap-2 px-6 md:h-10">
					See active votes
					<ArrowRight class="h-4 w-4" aria-hidden="true" />
				</Button>
			{/if}
		</div>

		<div class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8">
			<div class="rounded-lg border border-border bg-card/50 p-4 text-center">
				<p class="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">{epochRewardLabel}</p>
				<p class="mt-1 text-sm text-muted-foreground">BIG rewarded this round</p>
			</div>
			<div class="rounded-lg border border-border bg-card/50 p-4 text-center">
				<p class="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
					{activeMarkets != null ? fmtNumber(activeMarkets) : '—'}
				</p>
				<p class="mt-1 text-sm text-muted-foreground">Active markets</p>
			</div>
		</div>
	</div>
</section>
