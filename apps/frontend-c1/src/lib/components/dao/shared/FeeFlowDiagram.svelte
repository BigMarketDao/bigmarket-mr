<script lang="ts">
	import { ArrowDown, Coins, Receipt, Vault } from 'lucide-svelte';

	let { compact = false }: { compact?: boolean } = $props();
</script>

<div class="w-full {compact ? 'text-xs' : 'text-sm'}" aria-label="How protocol fees flow to the community treasury">
	<ol class="space-y-3">
		<li class="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
			<span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
				<Receipt class="h-4 w-4" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-card-foreground">User trades</p>
				<p class="truncate text-xs text-muted-foreground">Stakes on a market outcome</p>
			</div>
			<span class="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
				1
			</span>
		</li>

		<div class="flex justify-center">
			<ArrowDown class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
		</div>

		<li class="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
			<span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
				<Coins class="h-4 w-4" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-card-foreground">1% fee collected</p>
				<p class="truncate text-xs text-muted-foreground">On every trade, on-chain</p>
			</div>
			<span class="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
				2
			</span>
		</li>

		<div class="flex justify-center">
			<ArrowDown class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
		</div>

		<li class="grid grid-cols-2 gap-3">
			<div class="rounded-lg border border-border bg-muted/30 px-3 py-3 text-center">
				<p class="text-xl font-bold tabular-nums text-foreground">30%</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Liquidity providers</p>
			</div>
			<div class="rounded-lg border border-primary/60 bg-primary/10 px-3 py-3 text-center">
				<p class="text-xl font-bold tabular-nums text-primary">70%</p>
				<p class="mt-0.5 text-xs text-muted-foreground">DAO Treasury</p>
			</div>
		</li>

		<div class="flex justify-center">
			<ArrowDown class="h-4 w-4 text-primary" aria-hidden="true" />
		</div>

		<li class="flex items-center gap-3 rounded-lg border border-primary/60 bg-primary/10 px-4 py-3">
			<span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
				<Vault class="h-4 w-4" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-foreground">BIG holders vote</p>
				<p class="truncate text-xs text-muted-foreground">Every treasury spend = community vote</p>
			</div>
			<span class="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
				3
			</span>
		</li>
	</ol>
</div>
