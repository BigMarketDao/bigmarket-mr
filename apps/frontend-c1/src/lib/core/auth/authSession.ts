export type OAuthProvider = 'google' | 'github' | 'facebook' | 'linkedin' | 'twitter';

const ACCESS_TOKEN_KEY = 'bm_access_token';

export const OAUTH_PROVIDER_LABELS: Record<OAuthProvider, string> = {
	google: 'Google',
	github: 'GitHub',
	facebook: 'Facebook',
	linkedin: 'LinkedIn',
	twitter: 'X'
};

export function getAccessToken(): string | null {
	if (typeof sessionStorage === 'undefined') return null;
	return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
	sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
	sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isOAuthLoggedIn(): boolean {
	return !!getAccessToken();
}

export async function fetchOAuthProviders(apiBase: string): Promise<OAuthProvider[]> {
	const res = await fetch(`${apiBase}/auth/oauth/providers`);
	if (!res.ok) return [];
	const data = (await res.json()) as { providers?: OAuthProvider[] };
	return data.providers ?? [];
}

export function startOAuthLogin(apiBase: string, provider: OAuthProvider, returnTo?: string) {
	const callback = returnTo ?? `${window.location.origin}/auth/callback`;
	const url = `${apiBase}/auth/oauth/${provider}/start?redirect_uri=${encodeURIComponent(callback)}`;
	window.location.assign(url);
}

export async function refreshAccessToken(apiBase: string): Promise<string | null> {
	const res = await fetch(`${apiBase}/auth/refresh`, { method: 'POST', credentials: 'include' });
	if (!res.ok) return null;
	const data = (await res.json()) as { accessToken: string };
	setAccessToken(data.accessToken);
	return data.accessToken;
}

export async function logoutOAuth(apiBase: string) {
	await fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' });
	clearAccessToken();
}

export type AuthUser = { id: string; subh?: string; prv?: string; sid?: string };

export async function fetchAuthUser(apiBase: string): Promise<AuthUser | null> {
	const token = getAccessToken();
	if (!token) return null;
	const res = await fetch(`${apiBase}/auth/me`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) return null;
	const data = (await res.json()) as { user?: AuthUser };
	return data.user ?? null;
}
