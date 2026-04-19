<script lang="ts">
	interface Props {
		id: string;
		label: string;
		type?: string;
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		onInput?: (value: string) => void;
	}

	let {
		id,
		label,
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		disabled = false,
		onInput
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		onInput?.(target.value);
	}
</script>

<div class="mb-4 w-full">
	<label for={id} class="text-text-default mb-1 block text-sm font-medium">{label}</label>
	<input
		{id}
		{type}
		class="border-surface-300 bg-surface-900 text-text-default placeholder:text-text-default/50 focus:ring-primary w-full rounded-md border p-2 shadow-sm focus:border-transparent focus:ring-2 focus:outline-none"
		{placeholder}
		{disabled}
		{value}
		oninput={handleInput}
	/>
</div>
