<script lang="ts">
	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { Button } from '@bigmarket/bm-ui';
	import { CheckCircle2 } from 'lucide-svelte';
	import {
		fetchOAuthProviders,
		logoutOAuth,
		OAUTH_PROVIDER_LABELS,
		restoreOAuthSession,
		startOAuthLogin,
		type AuthUser,
		type OAuthProvider
	} from '$lib/core/auth/authSession';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let oauthProviders = $state<OAuthProvider[]>([]);
	let oauthUser = $state<AuthUser | null>(null);
	let oauthSignedIn = $state(false);
	let oauthConnecting = $state<OAuthProvider | null>(null);
	let loading = $state(true);

	async function loadOAuthState() {
		oauthUser = await restoreOAuthSession(appConfig.VITE_BIGMARKET_API);
		oauthSignedIn = oauthUser !== null;
	}

	onMount(async () => {
		oauthProviders = await fetchOAuthProviders(appConfig.VITE_BIGMARKET_API);
		await loadOAuthState();
		loading = false;
	});

	function connectOAuth(provider: OAuthProvider) {
		if (oauthConnecting) return;
		oauthConnecting = provider;
		startOAuthLogin(appConfig.VITE_BIGMARKET_API, provider);
	}

	async function disconnectOAuth() {
		await logoutOAuth(appConfig.VITE_BIGMARKET_API);
		oauthSignedIn = false;
		oauthUser = null;
	}

	const providerLabel = (user: AuthUser) => {
		const key = (user.provider ?? user.prv) as OAuthProvider | undefined;
		return key ? (OAUTH_PROVIDER_LABELS[key] ?? key) : 'your account';
	};
</script>

{#if !loading && (oauthProviders.length > 0 || oauthSignedIn)}
	<header
		class="relative top-0 right-0 left-0 z-999 border-b border-orange-200/60 bg-linear-to-r from-orange-50 via-amber-50/80 to-orange-50 dark:border-orange-900/40 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-orange-950/30"
		data-testid="alpha-banner"
	>
		<div
			class="mx-auto flex w-full max-w-7xl flex-col items-stretch justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8"
		>
			{#if oauthSignedIn && oauthUser}
				<div
					class="flex min-w-0 flex-1 items-start gap-2 sm:items-center"
					data-testid="alpha-banner:registered"
				>
					<CheckCircle2
						class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 sm:mt-0 dark:text-emerald-400"
						aria-hidden="true"
					/>
					<div class="min-w-0">
						<p class="text-sm font-semibold text-foreground">
							Thank you — your interest in BigMarket is appreciated.
						</p>
						{#if oauthUser.email}
							<p class="mt-0.5 truncate text-xs text-muted-foreground">
								We&apos;ll keep you posted
								<!-- <span class="font-medium text-foreground">{oauthUser.email}</span>
								{#if oauthUser.emailVerified}
									<span class="text-emerald-600 dark:text-emerald-400" title="Verified"> ✓</span>
								{/if} -->
							</p>
						{:else}
							<p class="mt-0.5 text-xs text-muted-foreground">
								Registered via {providerLabel(oauthUser)}.
							</p>
						{/if}
					</div>
				</div>

				<div
					class="flex shrink-0 flex-wrap items-center gap-2"
					data-testid="alpha-banner:oauth-actions"
				>
					<Button
						variant="outline"
						size="sm"
						class="border-orange-200/80 bg-background/80 text-xs font-semibold shadow-sm hover:border-orange-300 hover:bg-background dark:border-orange-900/50 dark:bg-background/60"
						onclick={disconnectOAuth}
						data-testid="alpha-banner:sign-out"
					>
						Sign out
					</Button>
				</div>
			{:else}
				<div class="min-w-0 flex-1">
					<p class="text-sm font-semibold tracking-tight text-foreground">
						Register your interest in BigMarket
					</p>
					<p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
						Connect with Google or GitHub. We&apos;ll email you as alpha features roll out.
					</p>
				</div>

				<div
					class="flex shrink-0 flex-wrap items-center gap-2"
					data-testid="alpha-banner:oauth-actions"
				>
					{#each oauthProviders as provider (provider)}
						<Button
							variant="outline"
							size="sm"
							class="border-orange-200/80 bg-background/80 text-xs font-semibold shadow-sm hover:border-orange-300 hover:bg-background dark:border-orange-900/50 dark:bg-background/60"
							onclick={() => connectOAuth(provider)}
							disabled={oauthConnecting !== null}
							data-testid={`alpha-banner:oauth:${provider}`}
						>
							{oauthConnecting === provider
								? 'Redirecting…'
								: `Continue with ${OAUTH_PROVIDER_LABELS[provider]}`}
						</Button>
					{/each}
				</div>
			{/if}
		</div>
	</header>
{/if}
