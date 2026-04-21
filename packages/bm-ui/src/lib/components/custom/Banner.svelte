<script lang="ts">
  // import CircleStop from '@lucide/svelte/icons/circle-stop';
  // import Check from '@lucide/svelte/icons/check.svelte';

  import { Check } from "lucide-svelte";

  export let message: string = '';
  export let bannerType:
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'waiting'
    | 'checking' = 'info';

  /** Force a theme for just this component (useful for previews) */
  export let forceTheme: 'auto' | 'light' | 'dark' = 'auto';

  /** Optional extra classes from parent */
  export let clazz: string = '';

  /** Dismissible? */
  export let dismissible: boolean = false;

  let open = true;

  // Variant palettes (light + dark with strong contrast)
  const variants: Record<string, string> = {
    info: `
      from-blue-50 to-blue-100/80 text-gray-900 border-blue-200
      dark:from-blue-950/60 dark:to-blue-900/20 dark:text-gray-200 dark:border-blue-800
    `,
    success: `
      from-emerald-50 to-emerald-100/80 text-emerald-900 border-emerald-200
      dark:from-emerald-950/60 dark:to-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800
    `,
    warning: `
      from-amber-50 to-amber-100/80 text-amber-900 border-amber-200
      dark:from-amber-950/60 dark:to-amber-900/20 dark:text-amber-100 dark:border-amber-800
    `,
    danger: `
      from-rose-50 to-rose-100/80 text-rose-900 border-rose-200
      dark:from-rose-950/60 dark:to-rose-900/20 dark:text-rose-100 dark:border-rose-800
    `,
    error: `
      from-rose-50 to-rose-100/80 text-rose-900 border-rose-200
      dark:from-rose-950/60 dark:to-rose-900/20 dark:text-rose-100 dark:border-rose-800
    `,
    waiting: `
      from-violet-50 to-violet-100/80 text-violet-900 border-violet-200
      dark:from-violet-950/60 dark:to-violet-900/20 dark:text-violet-100 dark:border-violet-800
    `,
    checking: `
      from-violet-50 to-violet-100/80 text-violet-900 border-violet-200
      dark:from-violet-950/60 dark:to-violet-900/20 dark:text-violet-100 dark:border-violet-800
    `,
  };

  // Icon accent bubble
  const accents: Record<string, string> = {
    info: 'bg-blue-600 dark:bg-blue-500',
    success: 'bg-emerald-600 dark:bg-emerald-500',
    warning: 'bg-amber-600 dark:bg-amber-500',
    danger: 'bg-rose-600 dark:bg-rose-500',
    error: 'bg-rose-600 dark:bg-rose-500',
    waiting: 'bg-violet-600 dark:bg-violet-500',
    checking: 'bg-violet-600 dark:bg-violet-500',
  };

  // Pick the right icon
  $: isBad = bannerType === 'warning' || bannerType === 'danger' || bannerType === 'error';
  // $: Icon = isBad ? CircleStop : Check;

  // Computed container classes
  $: container = `
    ${clazz}
    relative w-full overflow-hidden rounded-xl border
    shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10
    bg-gradient-to-br ${variants[bannerType] ?? variants.info}
    backdrop-blur supports-[backdrop-filter]:bg-opacity-80
    p-3 sm:p-4
  `
    .replace(/\s+/g, ' ')
    .trim();

  // Optional dark-forced wrapper class
  $: wrapperClass = forceTheme === 'dark' ? 'dark' : '';
</script>

{#if open}
  <div class={wrapperClass}>
    <div role="status" aria-live="polite" class={container}>
      <div class="flex items-start gap-3">
        <!-- Icon bubble -->
        <div
          class={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full ${accents[bannerType] ?? accents.info} text-white shadow`}
          aria-hidden="true"
        >
          <Check class="size-4" />
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <span class="block text-sm leading-6 sm:text-base">
            <slot name="message">{@html message}</slot>
          </span>
        </div>

        <!-- Dismiss -->
        {#if dismissible}
          <button
            type="button"
            class="ml-2 inline-flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium
                   text-current/70 hover:text-current focus:outline-none focus-visible:ring-2
                   focus-visible:ring-current/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-transparent"
            aria-label="Dismiss"
            on:click={() => (open = false)}
          >
            ✕
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
