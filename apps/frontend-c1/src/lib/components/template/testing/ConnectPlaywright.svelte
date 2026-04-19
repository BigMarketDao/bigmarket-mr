<script lang="ts">
	import { Button, TypoHeader } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { getStxAddress, isLoggedIn, connectWallet, userWalletStore } from '@bigmarket/bm-common';
	import { DEV_WALLET_STORAGE_KEY, getAddresses } from '$lib/tools/security';

	/**
	 * DEVNET wallets (Clarinet test accounts)
	 * ✅ Keep this DEV-only (see `showDevWallets` below).
	 */

	const devAddresses = getAddresses();
	const showDevWallets = !$userWalletStore.walletSigningMode;

	let walletAddress = typeof window !== 'undefined' ? getStxAddress() : '???';

	let selectedDevAddress: string = $state('');
	let busy = $state(false);
	let errorMsg = $state('');

	onMount(() => {
		if (!showDevWallets) return;

		try {
			const saved = localStorage.getItem(DEV_WALLET_STORAGE_KEY);
			if (saved) selectedDevAddress = saved;
		} catch {
			// ignore
		}
	});

	async function connect() {
		errorMsg = '';
		busy = true;

		try {
			if ($userWalletStore.walletSigningMode && selectedDevAddress) {
				try {
					localStorage.setItem(DEV_WALLET_STORAGE_KEY, selectedDevAddress);
				} catch {
					// ignore
				}
			} else {
				await connectWallet();
			}

			// Your app currently reloads after connect
			window.location.reload();
		} catch (e) {
			errorMsg = (e as Error)?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	function clearDevWallet() {
		selectedDevAddress = '';
		try {
			localStorage.removeItem(DEV_WALLET_STORAGE_KEY);
		} catch {
			// ignore
		}
	}
</script>

<div
	data-testid="wallet-connect:panel"
	class="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur
         sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/80"
>
	<div class="mb-10 flex items-center justify-between">
		<TypoHeader level={2} className="text-neutral-900 dark:text-neutral-100">
			Plawright Connection
		</TypoHeader>
	</div>

	<section>
		{#if isLoggedIn()}
			<div
				data-testid="wallet-connect:status:connected"
				class="rounded-lg border border-emerald-200/60 bg-emerald-50/60 p-4 text-sm text-emerald-900
               dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
			>
				<p class="font-medium">Connected</p>
				<p class="mt-1 truncate font-mono" data-testid="wallet-connect:address">
					{walletAddress}
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3" data-testid="wallet-connect:status:disconnected">
				<div class="mt-2 space-y-2" data-testid="wallet-connect:devwallets">
					<div class="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
						Devnet Wallet (for E2E / local testing)
					</div>

					<select
						data-testid="wallet-connect:devwallets:select"
						class="block w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm
                     text-neutral-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
                     focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
						bind:value={selectedDevAddress}
					>
						<option value="">Simulate wallet (Leather/Xverse/etc.)</option>
						{#each devAddresses as address (address)}
							<option value={address}>{address}</option>
						{/each}
					</select>

					<div class="flex items-center gap-2">
						<button
							type="button"
							data-testid="wallet-connect:devwallets:clear"
							class="text-xs text-neutral-600 underline hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white"
							onclick={clearDevWallet}
						>
							Clear selection
						</button>

						{#if selectedDevAddress}
							<div
								data-testid="wallet-connect:devwallets:selected"
								class="text-xs text-neutral-500 dark:text-neutral-400"
							>
								Selected dev wallet enabled
							</div>
						{/if}
					</div>
				</div>

				{#if errorMsg}
					<div data-testid="wallet-connect:error" class="text-sm text-red-600 dark:text-red-400">
						{errorMsg}
					</div>
				{/if}

				<Button data-testid="wallet-connect:connect" onclick={connect} disabled={busy}>
					{busy ? 'Connecting…' : 'Connect'}
				</Button>
			</div>
		{/if}
	</section>

	<div class="my-10 h-px w-full bg-neutral-200 dark:bg-neutral-800"></div>
</div>
