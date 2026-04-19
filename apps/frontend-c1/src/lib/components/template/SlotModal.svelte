<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		onClose,
		modalBody
	}: {
		onClose: () => void;
		modalBody?: Snippet;
	} = $props();

	function closeModal() {
		onClose?.();
	}
</script>

<div
	class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
	role="button"
	tabindex="0"
	onclick={closeModal}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			closeModal();
		}
	}}
>
	<!-- Modal content -->
	<div
		class="relative mt-5 max-h-[80vh] max-w-[70%] min-w-[50%] overflow-y-auto rounded-xl bg-white p-6 text-gray-900 shadow-lg dark:bg-gray-800 dark:text-gray-100"
		role="dialog"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		aria-modal="true"
		aria-labelledby="modal-title"
		aria-describedby="modal-description"
	>
		{#if modalBody}
			{@render modalBody()}
		{/if}

		<button
			onclick={closeModal}
			class="absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-gray-700 focus:outline-none dark:hover:text-gray-300"
		>
			&times;
		</button>
	</div>
</div>
