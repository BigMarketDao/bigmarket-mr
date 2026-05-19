<script lang="ts">
  import { Trophy } from "lucide-svelte";
  let { weightedReputation, active = false } = $props<{
    weightedReputation: number;
    active: boolean;
  }>();
</script>

<a
  href="/reputation"
  data-sveltekit-preload-data="hover"
  data-sveltekit-preload-code="hover"
  class={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
    active
      ? 'bg-primary/10 text-primary hover:bg-primary/15'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`}
  aria-current={active ? 'page' : undefined}
>
  <span class="inline-flex items-center gap-1.5">
    <Trophy class="h-4 w-4 text-primary" />
    <span class="tabular-nums">{weightedReputation}</span>
    <span class="hidden sm:inline">Big Karma</span>
  </span>

  {#if active}
    <span
      class="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary transition-all duration-300"
    ></span>
  {/if}
</a>
