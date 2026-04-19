<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import { Check, Minus } from "lucide-svelte";
	import { cn } from "../../../utils.js";
  
	let {
	  ref = $bindable(null),
	  checked = $bindable(false),
	  indeterminate = $bindable(false),
	  class: className,
	  ...restProps
	} = $props();
  </script>
  
  <CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	class={cn(
	  "border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground flex size-4 items-center justify-center rounded border",
	  className
	)}
	{...restProps}
  >
	{#snippet children({ checked, indeterminate }: { checked: boolean; indeterminate: boolean })}
	  <div class="text-current">
		{#if checked}
		  <Check class="size-3.5" />
		{:else if indeterminate}
		  <Minus class="size-3.5" />
		{/if}
	  </div>
	{/snippet}
  </CheckboxPrimitive.Root>