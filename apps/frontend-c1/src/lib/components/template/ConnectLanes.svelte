<script lang="ts">
	import { Button, TypoHeader } from '@bigmarket/bm-ui';
	import { ParaContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { getStxAddress, isLoggedIn, userWalletStore } from '@bigmarket/bm-common';
	import { connectWallet } from '@bigmarket/bm-common';
	import ConnectPlaywright from './testing/ConnectPlaywright.svelte';
	import { requireAppConfig } from '@bigmarket/bm-common';
	import { appConfigStore } from '@bigmarket/bm-common';
	import {
		fetchAuthUser,
		fetchOAuthProviders,
		isOAuthLoggedIn,
		logoutOAuth,
		OAUTH_PROVIDER_LABELS,
		startOAuthLogin,
		type AuthUser,
		type OAuthProvider
	} from '$lib/core/auth/authSession';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let walletAddress = typeof window !== 'undefined' ? getStxAddress() : '???';
	let isMetaMaskConnected = $state(false);
	let connecting = $state<'stacks' | 'ethereum' | null>(null);
	let oauthConnecting = $state<OAuthProvider | null>(null);
	let errorMsg = $state<string | null>(null);
	let oauthProviders = $state<OAuthProvider[]>([]);
	let oauthUser = $state<AuthUser | null>(null);
	let oauthSignedIn = $state(false);

	async function loadOAuthState() {
		oauthSignedIn = isOAuthLoggedIn();
		if (!oauthSignedIn) {
			oauthUser = null;
			return;
		}
		oauthUser = await fetchAuthUser(appConfig.VITE_BIGMARKET_API);
		if (!oauthUser) {
			oauthSignedIn = false;
		}
	}

	onMount(async () => {
		oauthProviders = await fetchOAuthProviders(appConfig.VITE_BIGMARKET_API);
		await loadOAuthState();
	});

	async function runConnect(chain: 'stacks' | 'ethereum') {
		if (connecting) return;
		errorMsg = null;
		connecting = chain;
		try {
			await connectWallet(appConfig.VITE_BIGMARKET_API, chain);
			window.location.reload();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			connecting = null;
		}
	}

	function connectOAuth(provider: OAuthProvider) {
		if (oauthConnecting || connecting) return;
		errorMsg = null;
		oauthConnecting = provider;
		startOAuthLogin(appConfig.VITE_BIGMARKET_API, provider);
	}

	async function disconnectOAuth() {
		await logoutOAuth(appConfig.VITE_BIGMARKET_API);
		oauthSignedIn = false;
		oauthUser = null;
	}

	const connectStacks = () => runConnect('stacks');
	const connectMetaMask = () => runConnect('ethereum');

	const disconnectMetaMask = async () => {
		const mm = window.phantom?.ethereum;
		if (!mm) {
			window.open('https://metamask.io/', '_blank');
			return;
		}
		await mm.disconnect();
		isMetaMaskConnected = false;
		window.location.reload();
	};
</script>

<div data-testid="wallet-connect:panel" class="mx-auto">
	<div class="mb-4 flex items-center justify-between">
		<TypoHeader level={2} className="text-neutral-900 dark:text-neutral-100">Connect</TypoHeader>
	</div>
	<section class="flex flex-col gap-4">
		{#if oauthSignedIn}
			<div
				data-testid="oauth-connect:status:connected"
				class="rounded-lg border border-sky-200/60 bg-sky-50/60 p-4 text-sm text-sky-900
               dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200"
			>
				<p class="font-medium">Signed in</p>
				{#if oauthUser?.prv}
					<p class="mt-1 capitalize">{OAUTH_PROVIDER_LABELS[oauthUser.prv as OAuthProvider] ?? oauthUser.prv}</p>
				{/if}
				<p class="mt-1 truncate font-mono text-xs opacity-80">{oauthUser?.id ?? 'Account'}</p>
				<Button variant="secondary" class="mt-3" onclick={disconnectOAuth}>Sign out</Button>
			</div>
		{:else if oauthProviders.length > 0}
			<div class="space-y-2" data-testid="oauth-connect:providers">
				<TypoHeader level={5} className="text-neutral-800 dark:text-neutral-200"
					>Sign in</TypoHeader
				>
				<ParaContainer>Social sign-in for comments and account features.</ParaContainer>
				<div class="flex flex-col gap-2">
					{#each oauthProviders as provider (provider)}
						<Button
							variant="secondary"
							onclick={() => connectOAuth(provider)}
							disabled={connecting !== null || oauthConnecting !== null}
							data-testid={`oauth-connect:${provider}`}
						>
							{oauthConnecting === provider
								? 'Redirecting…'
								: `Continue with ${OAUTH_PROVIDER_LABELS[provider]}`}
						</Button>
					{/each}
				</div>
			</div>
		{/if}

		{#if isLoggedIn()}
			<div
				data-testid="wallet-connect:status:connected"
				class="rounded-lg border border-emerald-200/60 bg-emerald-50/60 p-4 text-sm text-emerald-900
               dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
			>
				<p class="font-medium">Wallet connected</p>
				<p class="mt-1 truncate font-mono">{walletAddress}</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3" data-testid="wallet-connect:status:disconnected">
				<div class="space-y-2" data-testid="wallet-connect:devwallets">
					<TypoHeader level={5} className="text-neutral-800 dark:text-neutral-200"
						>Connect wallet</TypoHeader
					>
					<ParaContainer>Full access including staking in markets.</ParaContainer>
					{#if errorMsg}
						<p
							class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-200"
							role="alert"
						>
							{errorMsg}
						</p>
					{/if}
					<div class="flex flex-col gap-2">
						<Button
							variant="secondary"
							onclick={connectStacks}
							disabled={connecting !== null || oauthConnecting !== null}
						>
							{connecting === 'stacks' ? 'Connecting…' : 'Connect Stacks'}
						</Button>
						{#if isMetaMaskConnected}
							<Button variant="secondary" onclick={disconnectMetaMask}>Disconnect Meta Mask</Button>
						{:else}
							<Button
								variant="secondary"
								onclick={connectMetaMask}
								disabled={connecting !== null || oauthConnecting !== null}
							>
								{connecting === 'ethereum' ? 'Connecting…' : 'Connect Meta Mask'}
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</section>

	<div class="my-4 h-px w-full bg-neutral-200 dark:bg-neutral-800"></div>

	{#if !$userWalletStore.walletSigningMode && appConfig.VITE_NETWORK === 'devnet'}
		<ConnectPlaywright />
	{/if}
</div>
