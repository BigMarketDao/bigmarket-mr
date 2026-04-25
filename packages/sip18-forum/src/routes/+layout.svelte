<script lang="ts">
  import '../app.css';
</script>

<!-- {@render children()} -->
<div
  class="bg-surface-50-950 text-surface-contrast-50-950 from-surface-100-900
	       via-surface-100-900
	       to-surface-100-900 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
	       font-extralight"
>
  <div class="">
    <div class="flex min-h-screen flex-col">
      <!-- <AppBar /> -->
      <slot />
    </div>
  </div>
</div>
