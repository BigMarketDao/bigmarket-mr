<script lang="ts">
  import type { Snippet } from "svelte";


  const {
  children,
  accent = "emerald",
  interactive = false,
  as = "section",
  ariaLabel = "Panel",
  clazz = "",
  forceTheme = "auto"
} = $props<{
  children?: Snippet;
  interactive?: boolean;
  accent?: string;
  as?: string;
  ariaLabel?: string;
  clazz?: string;
  forceTheme?: string;
}>();

const accents = {
  violet: {
    halo: "from-violet-400/40 via-fuchsia-400/30 to-indigo-400/20",
    //edge: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
    ring: "focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400",
    shadow: "shadow-violet-500/10"
  },
  blue: {
    halo: "from-sky-400/40 via-blue-400/30 to-indigo-400/20",
    //edge: 'bg-gradient-to-r from-sky-500 to-blue-600',
    ring: "focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400",
    shadow: "shadow-sky-500/10"
  },
  amber: {
    halo: "from-amber-400/40 via-orange-400/30 to-yellow-400/20",
    //edge: 'bg-gradient-to-r from-amber-500 to-orange-600',
    ring: "focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400",
    shadow: "shadow-amber-500/10"
  },
  emerald: {
    halo: "from-emerald-400/40 via-teal-400/30 to-green-400/20",
    //edge: '',
    ring: "focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400",
    shadow: "shadow-emerald-500/10"
  },
  rose: {
    halo: "from-rose-400/40 via-pink-400/30 to-fuchsia-400/20",
    //edge: 'bg-gradient-to-r from-rose-500 to-pink-600',
    ring: "focus-visible:ring-rose-500 dark:focus-visible:ring-rose-400",
    shadow: "shadow-rose-500/10"
  },
  cyan: {
    halo: "from-cyan-400/40 via-teal-400/30 to-blue-400/20",
    //edge: 'bg-gradient-to-r from-cyan-500 to-teal-600',
    ring: "focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400",
    shadow: "shadow-cyan-500/10"
  }
};
let a = $derived(accents[accent as keyof typeof accents] ?? accents.emerald);
let lift = $derived(interactive ? "transition-transform hover:scale-[1.01] active:scale-[0.997] hover:shadow-xl" : "");
let container = $derived(`
    ${clazz} relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-gray-200/80 bg-white/90 backdrop-blur shadow-lg ${a.shadow} ring-1 ring-black/5 focus-within:outline-none focus-within:ring-2 ${a.ring} dark:border-gray-700/70 dark:bg-gray-800/90 dark:ring-white/10 text-gray-900 dark:text-white ${lift}`.replace(/\s+/g, " ").trim());
let wrapperClass = $derived(forceTheme === "dark" ? "dark" : forceTheme === "light" ? "light" : "");
</script>

<div class={wrapperClass} role="region" aria-label={ariaLabel}>
	<svelte:element this={as} role="region" aria-label={ariaLabel} class={container}>
		<!-- Glow halo -->
		<div class="pointer-events-none absolute inset-0 -z-10">
			<div class={`absolute -inset-24 rounded-[inherit] bg-gradient-to-br opacity-60 blur-2xl dark:opacity-40 ${a.halo}`}></div>
		</div>

		<!-- Accent edge -->
		<div class={`pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-[inherit] opacity-90`}></div>

		<!-- Content -->
		<div class="relative">
      {@render children?.()}
		</div>
	</svelte:element>
</div>
