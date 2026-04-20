<script lang="ts">
    let { href, label, active } = $props<{
    href: string;
    label: string;
    active: boolean;
  }>();
</script>

<a
    {href}
    data-sveltekit-preload-data="hover"
    data-sveltekit-preload-code="hover"
    class={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active 
            ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/30' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
    }`}
    aria-current={active ? 'page' : undefined}
>
	<span class="relative">{label}</span>
	
    {#if active}
        <!-- Active state indicator -->
        <span class="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-orange-500 transition-all duration-300"></span>
    {/if}
</a>
