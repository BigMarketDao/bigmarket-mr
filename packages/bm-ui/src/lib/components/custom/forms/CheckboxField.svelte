<script lang="ts">
	interface Props {
		id: string;
		label: string;
		checked?: boolean;
		disabled?: boolean;
		onChange?: (checked: boolean) => void;
	}

	let { id, label, checked = $bindable(false), disabled = false, onChange }: Props = $props();

	function handleChange() {
		onChange?.(checked);
	}
</script>

<label for={id} class="flex cursor-pointer items-center space-x-3 select-none">
	<input
		{id}
		type="checkbox"
		class="border-surface-300 bg-surface-100 text-primary focus:ring-primary h-5 w-5 rounded-md border shadow-sm focus:ring-2 focus:outline-none disabled:opacity-50"
		bind:checked
		{disabled}
		onchange={handleChange}
	/>
	<span class="text-text-default text-sm font-medium">{label}</span>
</label>
