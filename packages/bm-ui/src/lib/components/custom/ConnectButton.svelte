<script lang="ts">
  import { Wallet } from "lucide-svelte";

  let { label, onConnectWallet } = $props<{
    label: string;
    onConnectWallet: any;
  }>();

  const connectWallet = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onConnectWallet();
  };
</script>

<button
  onclick={connectWallet}
  class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-background"
>
  <Wallet class="h-4 w-4 text-muted-foreground" />
  <span>{label}</span>
</button>
