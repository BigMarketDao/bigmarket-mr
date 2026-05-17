<script lang="ts">
  let { children } = $props();
</script>

<p class="my-3 mt-1 text-sm text-muted-foreground">
  {@render children?.()}
</p>
