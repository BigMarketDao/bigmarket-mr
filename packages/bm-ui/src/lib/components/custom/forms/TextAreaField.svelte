<script lang="ts">
	interface Props {
		id: string;
		label?: string;
		value?: string;
		placeholder?: string;
		rows?: number;
		disabled?: boolean;
		onInput?: (value: string) => void;
	}

	let { id, label = '', value = $bindable(''), placeholder = '', rows = 4, disabled = false, onInput }: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		value = target.value;
		onInput?.(target.value);
	}
</script>

<div class="mb-4 w-full">
	{#if label}
		<label for={id} class="text-text-default mb-1 block text-sm font-medium">{label}</label>
	{/if}
	<textarea
		{id}
		{rows}
		class="border-surface-300 bg-surface-900 text-text-default placeholder:text-text-default/50 focus:ring-primary w-full rounded-md border p-4 font-medium shadow-sm focus:border-transparent focus:ring-2 focus:outline-none"
		{placeholder}
		oninput={handleInput}
		{disabled}>{value}</textarea
	>
</div>
