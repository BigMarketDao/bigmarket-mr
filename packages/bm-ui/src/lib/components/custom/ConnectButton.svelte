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
  class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-900"
>
  <Wallet class="h-4 w-4 text-gray-600 dark:text-gray-400" />
  <span>{label}</span>
</button>
