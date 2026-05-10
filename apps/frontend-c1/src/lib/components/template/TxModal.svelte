<script lang="ts">
	import { lookupError, txStatus, type TxStatus } from '@bigmarket/bm-common';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import SlotModal from './SlotModal.svelte';
	import { stacks } from '@bigmarket/sdk';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let {
		modal,
		closeTxModal
	}: {
		modal: { open: boolean; txId?: string };
		closeTxModal: () => void;
	} = $props();

	const explorerUrl = $derived(
		stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, modal.txId ?? '')
	);
	let seconds = 0;
	let timer: ReturnType<typeof setInterval>;

	function formatTxMessage($txStatus: TxStatus | null, sec: number): string {
		if (!$txStatus) return 'Waiting for transaction...';
		if ($txStatus.status === 'pending') return `Transaction pending... (${sec}s)`;
		if ($txStatus.status === 'success') return '✅ Transaction confirmed!';
		if ($txStatus.status.startsWith('abort') || $txStatus.status === 'failed')
			return `❌ Transaction failed <br/>reason: ${lookupError($txStatus)}`;
		return '';
	}

	let txMessage = $state('Waiting for transaction...');

	onMount(() => {
		const unsub = txStatus.subscribe(($txStatus) => {
			txMessage = formatTxMessage($txStatus, seconds);
		});
		timer = setInterval(() => {
			seconds++;
			txMessage = formatTxMessage(get(txStatus), seconds);
		}, 1000);
		return () => {
			clearInterval(timer);
			unsub();
		};
	});
</script>

/* eslint-disable svelte/no-at-html-tags */ /* eslint-disable svelte/no-at-html-tags */
{#if modal.open && modal.txId}
	{@const txId = modal.txId}
	<SlotModal onClose={closeTxModal}>
		{#snippet modalBody()}
			<div class="mt-5 text-center">
				{#if txId.split(' ').length > 1}
					<div class="text-md my-3">{txId}</div>
				{:else}
					<h2 class="mb-3 text-lg font-bold">Transaction Submitted</h2>

					<p class="mb-2 text-base font-medium text-gray-800 dark:text-gray-100">
						{@html txMessage}
					</p>

					<!-- Spinner visible only while pending -->
					{#if $txStatus?.status === 'pending'}
						<div class="spinner"></div>
					{/if}

					<p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
						<a
							href={explorerUrl}
							target="_blank"
							rel="noopener noreferrer external"
							class="inline-block rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
							>View on Explorer ↗</a
						>
					</p>
				{/if}
			</div>
		{/snippet}
	</SlotModal>
{/if}

<style>
	.spinner {
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid #f97316; /* orange-500 */
		border-radius: 50%;
		width: 32px;
		height: 32px;
		animation: spin 1s linear infinite;
		margin: 1rem auto;
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
