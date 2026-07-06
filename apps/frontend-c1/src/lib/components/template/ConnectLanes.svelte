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

	const oauthProviderLabel = (user: AuthUser) => {
		const key = (user.provider ?? user.prv) as OAuthProvider | undefined;
		return key ? (OAUTH_PROVIDER_LABELS[key] ?? key) : 'Social';
	};
</script>

<div data-testid="wallet-connect:panel" class="mx-auto flex flex-col">
	<div class="mb-4 flex items-center justify-between">
		<TypoHeader level={2} className="text-neutral-900 dark:text-neutral-100"
			>Buy STX &amp; Connect Wallet</TypoHeader
		>
	</div>

	<section class="flex flex-col gap-4">
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
							variant="default"
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

	{#if !$userWalletStore.walletSigningMode && appConfig.VITE_NETWORK === 'devnet'}
		<div class="my-4 h-px w-full bg-neutral-200 dark:bg-neutral-800"></div>
		<ConnectPlaywright />
	{/if}

	{#if oauthProviders.length > 0 || oauthSignedIn}
		<footer
			class="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800"
			data-testid="oauth-connect:footer"
		>
			<div class="space-y-2">
				<div class="flex flex-wrap items-center gap-2">
					<TypoHeader level={6} className="text-neutral-700 dark:text-neutral-300"
						>Coming soon</TypoHeader
					>
					<span
						class="rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
					>
						Early access
					</span>
				</div>

				{#if oauthSignedIn && oauthUser}
					<div
						data-testid="oauth-connect:status:connected"
						class="rounded-md border border-sky-200/50 bg-sky-50/40 px-3 py-2 text-sm text-sky-950 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-100"
					>
						<p class="font-medium">Thanks — you&apos;re on the list.</p>
						{#if oauthUser.email}
							<p class="mt-1 text-xs opacity-90">
								Verified email
								{#if oauthUser.emailVerified}
									<span class="text-emerald-600 dark:text-emerald-400">✓</span>
								{/if}
								: {oauthUser.email}
							</p>
						{:else}
							<p class="mt-1 text-xs opacity-90">
								Signed in with {oauthProviderLabel(oauthUser)}.
							</p>
						{/if}
						<button
							type="button"
							class="mt-2 text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100"
							onclick={disconnectOAuth}
						>
							sign out
						</button>
					</div>
				{:else}
					<p class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
						Register your interest by signing in with a verified email. Social login is not required
						to trade — wallet connect above is how you participate in markets.
					</p>
					<div class="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
						{#each oauthProviders as provider (provider)}
							<Button
								variant="link"
								size="sm"
								class="h-auto px-0 text-xs"
								onclick={() => connectOAuth(provider)}
								disabled={connecting !== null || oauthConnecting !== null}
								data-testid={`oauth-connect:${provider}`}
							>
								{oauthConnecting === provider ? 'Redirecting…' : OAUTH_PROVIDER_LABELS[provider]}
							</Button>
						{/each}
					</div>
				{/if}
			</div>
		</footer>
	{/if}
</div>
