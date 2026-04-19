<script lang="ts">
  let { children } = $props();
</script>

<p class="my-3 mt-1 text-sm text-gray-900 dark:text-gray-200">
  {@render children?.()}
</p>
