<!-- Popover.svelte -->
<script lang="ts">
  export let message = '';
  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
  export let openState = false; // optional external control

  let rootEl: HTMLElement;
  let triggerEl: HTMLButtonElement;

  const toggle = () => (openState = !openState);
  const open = () => (openState = true);
  const close = () => (openState = false);

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  function onOutsideClick(e: MouseEvent) {
    if (!rootEl?.contains(e.target as Node)) close();
  }

  // Tailwind positioning per placement
  $: panelPos =
    placement === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-5'
      : placement === 'bottom'
        ? 'top-full left-1/2 -translate-x-1/2 mt-2'
        : placement === 'left'
          ? 'right-full top-1/2 -translate-y-1/2 -mr-2'
          : 'left-full top-1/2 -translate-y-1/2 ml-2';

  $: arrowPos =
    placement === 'top'
      ? 'top-full left-1/2 -translate-x-1/2'
      : placement === 'bottom'
        ? 'bottom-full left-1/2 -translate-x-1/2'
        : placement === 'left'
          ? 'left-full top-1/2 -translate-y-1/2'
          : 'right-full top-1/2 -translate-y-1/2';
</script>

<svelte:window onclick={onOutsideClick} on:keydown={onKeydown} />

<div bind:this={rootEl} class="relative inline-block">
  <!-- Trigger -->
  <button
    bind:this={triggerEl}
    type="button"
    aria-haspopup="dialog"
    aria-expanded={openState}
    class="inline-flex items-center rounded focus:outline-none focus-visible:ring focus-visible:ring-offset-2"
    onclick={toggle}
    onmouseover={open}
    onmouseleave={close}
    onfocus={open}
  >
    <slot name="title" />
  </button>

  <!-- Panel -->
  {#if openState}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
    <div
      role="dialog"
      class={`absolute z-50 ${panelPos}`}
      on:mouseover={open}
      on:mouseleave={close}
    >
      <!-- Content card -->
      <div
        class="max-w-lg rounded-lg bg-white px-3 py-2 text-sm text-neutral-800 shadow-lg ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-100"
      >
        <slot>
          <span class="leading-snug">{message}</span>
        </slot>
      </div>

      <!-- Arrow -->
      <div
        class={`pointer-events-none absolute ${arrowPos} h-3 w-3 rotate-45 
                bg-white ring-1 ring-black/5 dark:bg-neutral-800`}
      ></div>
    </div>
  {/if}
</div>
