<script lang="ts">
	import { ChevronDown, Wallet } from 'lucide-svelte';

	let { label, onConnectWallet } = $props<{
		label: string;
		onConnectWallet: () => void;
	}>();

	const connectWallet = () => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		onConnectWallet();
	};
</script>

<button
	type="button"
	onclick={connectWallet}
	class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-semibold tracking-wide text-foreground uppercase transition-colors duration-200 hover:border-muted-foreground/30 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-background"
>
	<Wallet class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
	<span class="truncate">{label}</span>
	<ChevronDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
</button>
