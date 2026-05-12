<script lang="ts">
	import { Button, TypoHeader } from '@bigmarket/bm-ui';
	import { ParaContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { getStxAddress, isLoggedIn, userWalletStore } from '@bigmarket/bm-common';
	import { connectWallet } from '@bigmarket/bm-common';
	import ConnectPlaywright from './testing/ConnectPlaywright.svelte';
	import { requireAppConfig } from '@bigmarket/bm-common';
	import { appConfigStore } from '@bigmarket/bm-common';
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let walletAddress = typeof window !== 'undefined' ? getStxAddress() : '???';
	let isPhantomConnected = $state(false);
	let isMetaMaskConnected = $state(false);

	// async function checkPhantomConnected() {
	// 	const phantom = window.phantom?.solana;

	// 	if (!phantom) return false;

	// 	try {
	// 		await phantom.connect({ onlyIfTrusted: true });
	// 		return true;
	// 	} catch {
	// 		return false;
	// 	}
	// }
	onMount(async () => {
		const phantom = window.phantom?.solana;
		isPhantomConnected = false;
		if (phantom && isPhantomConnected) {
			const response = await phantom.connect();
			const publicKey = (
				response as { publicKey: { toString: () => string } }
			).publicKey.toString();
			console.log('publicKey', publicKey);
		}
		const metaMask = window.phantom?.ethereum;
		isMetaMaskConnected = false;
		if (metaMask && isMetaMaskConnected) {
			const response = await metaMask.connect();
			const publicKey = (
				response as { publicKey: { toString: () => string } }
			).publicKey.toString();
			console.log('publicKey', publicKey);
		}
	});

	const connectStacks = async () => {
		await connectWallet(appConfig.VITE_BIGMARKET_API, 'stacks');
		window.location.reload();
	};

	const connectPhantom = async () => {
		// const phantom = window.phantom?.solana;
		// if (!phantom) {
		// 	window.open('https://phantom.app/', '_blank');
		// 	return;
		// }
		// const response = await phantom.connect();
		// const publicKey = (response as { publicKey: { toString: () => string } }).publicKey.toString();
		// console.log('publicKey', publicKey);
		// isPhantomConnected = true;
		await connectWallet(appConfig.VITE_BIGMARKET_API, 'solana');

		window.location.reload();
	};

	const connectMetaMask = async () => {
		// const phantom = window.phantom?.solana;
		// if (!phantom) {
		// 	window.open('https://phantom.app/', '_blank');
		// 	return;
		// }
		// const response = await phantom.connect();
		// const publicKey = (response as { publicKey: { toString: () => string } }).publicKey.toString();
		// console.log('publicKey', publicKey);
		// isPhantomConnected = true;
		await connectWallet(appConfig.VITE_BIGMARKET_API, 'ethereum');

		window.location.reload();
	};

	const disconnectPhantom = async () => {
		const phantom = window.phantom?.solana;
		if (!phantom) {
			window.open('https://phantom.app/', '_blank');
			return;
		}
		await phantom.disconnect();
		isPhantomConnected = false;
		window.location.reload();
	};

	const disconnectMetaMask = async () => {
		const mm = window.phantom?.ethereum;
		if (!mm) {
			window.open('https://metamask.io/', '_blank');
			return;
		}
		await mm.disconnect();
		isPhantomConnected = false;
		window.location.reload();
	};

	// const options = [
	// 	{ value: 'google', label: 'Google' },
	// 	{ value: 'github', label: 'GitHub' },
	// 	{ value: 'linkedin', label: 'LinkedIn' },
	// 	{ value: 'twitter', label: 'X' }
	// ];
</script>

<div data-testid="wallet-connect:panel" class="mx-auto max-w-xl">
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
					<Button onclick={connectStacks}>Connect Stacks</Button>
					{#if isPhantomConnected}
						<Button onclick={disconnectPhantom}>Disconnect Phantom</Button>
					{:else}
						<Button onclick={connectPhantom}>Connect Phantom</Button>
					{/if}
					{#if isMetaMaskConnected}
						<Button onclick={disconnectMetaMask}>Disconnect Meta Mask</Button>
					{:else}
						<Button onclick={connectMetaMask}>Connect Meta Mask</Button>
					{/if}
				</div>
			</div>
		{/if}
	</section>

	<div class="my-4 h-px w-full bg-neutral-200 dark:bg-neutral-800"></div>

	{#if !$userWalletStore.walletSigningMode}
		<ConnectPlaywright />
	{/if}
</div>
