<script lang="ts">
	import { Button, TypoHeader } from '@bigmarket/bm-ui';
	import { ParaContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { getStxAddress, isLoggedIn, userWalletStore } from '@bigmarket/bm-common';
	import { connectWallet } from '@bigmarket/bm-common';
	import ConnectPlaywright from './testing/ConnectPlaywright.svelte';

	let walletAddress = typeof window !== 'undefined' ? getStxAddress() : '???';

	onMount(() => {
		// silentRestore();
	});

	const connect = async () => {
		await connectWallet();
		window.location.reload();
	};

	// const options = [
	// 	{ value: 'google', label: 'Google' },
	// 	{ value: 'github', label: 'GitHub' },
	// 	{ value: 'linkedin', label: 'LinkedIn' },
	// 	{ value: 'twitter', label: 'X' }
	// ];
</script>

<div
	data-testid="wallet-connect:panel"
	class="mx-auto max-w-xl"
>
	<div class="mb-4 flex items-center justify-between">
		<TypoHeader level={2} className="text-neutral-900 dark:text-neutral-100"
			>Buy STX &amp; Connect Wallet</TypoHeader
		>
	</div>
	<section>
		{#if isLoggedIn()}
			<div
				data-testid="wallet-connect:status:connected"
				class="rounded-lg border border-emerald-200/60 bg-emerald-50/60 p-4 text-sm text-emerald-900
               dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
			>
				<p class="font-medium">Connected</p>
				<p class="mt-1 truncate font-mono">{walletAddress}</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3" data-testid="wallet-connect:status:disconnected">
				<div class="space-y-2" data-testid="wallet-connect:devwallets">
					<TypoHeader level={5} className="text-neutral-800 dark:text-neutral-200"
						>Connect Wallet</TypoHeader
					>
					<ParaContainer>Full access including staking in markets.</ParaContainer>
					<Button onclick={connect}>Connect</Button>
				</div>
			</div>
		{/if}
	</section>

	<div class="my-4 h-px w-full bg-neutral-200 dark:bg-neutral-800"></div>

	{#if !$userWalletStore.walletSigningMode}
		<ConnectPlaywright />
	{/if}
</div>
