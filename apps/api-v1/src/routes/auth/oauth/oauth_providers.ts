import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { ConfigI } from '../../../types/local_types.js';
import { GOOGLE_OIDC_SCOPES, profileFromIdTokenClaims, type OAuthProfile } from './oauth_types.js';

export type { OAuthProfile } from './oauth_types.js';
export { GOOGLE_OIDC_SCOPES } from './oauth_types.js';

export type OAuthProviderKey = 'google' | 'facebook' | 'linkedin' | 'github' | 'twitter';

export type OAuthCredentials = {
	clientId: string;
	clientSecret: string;
};

export type OAuthProviderDef = {
	key: OAuthProviderKey;
	providerId: string;
	authUrl: string;
	tokenUrl: string;
	scopes: string;
	usePkce: boolean;
	/** Extra authorization URL query params (e.g. prompt=select_account consent). */
	authParams?: Record<string, string>;
	isConfigured: (cfg: ConfigI) => boolean;
	getCredentials: (cfg: ConfigI) => OAuthCredentials;
	resolveProfile: (args: {
		tokenJson: Record<string, unknown>;
		credentials: OAuthCredentials;
	}) => Promise<OAuthProfile>;
};

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const LINKEDIN_JWKS = createRemoteJWKSet(new URL('https://www.linkedin.com/oauth/openid/jwks'));

function hasCredentials(creds: OAuthCredentials) {
	return Boolean(creds.clientId && creds.clientSecret);
}

async function fetchJson(url: string, init?: RequestInit) {
	const resp = await fetch(url, init);
	if (!resp.ok) {
		const txt = await resp.text();
		throw new Error(`HTTP ${resp.status}: ${txt}`);
	}
	return (await resp.json()) as Record<string, unknown>;
}

export const OAUTH_PROVIDERS: Record<OAuthProviderKey, OAuthProviderDef> = {
	google: {
		key: 'google',
		providerId: 'google',
		authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		tokenUrl: 'https://oauth2.googleapis.com/token',
		scopes: GOOGLE_OIDC_SCOPES,
		usePkce: true,
		authParams: {
			prompt: 'select_account consent',
			access_type: 'offline'
		},
		isConfigured: (cfg) => hasCredentials({ clientId: cfg.oauthGoogleClientId, clientSecret: cfg.oauthGoogleClientSecret }),
		getCredentials: (cfg) => ({ clientId: cfg.oauthGoogleClientId, clientSecret: cfg.oauthGoogleClientSecret }),
		resolveProfile: async ({ tokenJson, credentials }) => {
			const idToken = tokenJson.id_token as string | undefined;
			if (!idToken) throw new Error('No id_token from Google');
			const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
				audience: credentials.clientId,
				issuer: ['https://accounts.google.com', 'accounts.google.com']
			});
			return profileFromIdTokenClaims(payload as Record<string, unknown>);
		}
	},
	facebook: {
		key: 'facebook',
		providerId: 'facebook',
		authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
		tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
		scopes: 'public_profile',
		usePkce: true,
		authParams: { auth_type: 'rerequest' },
		isConfigured: (cfg) => hasCredentials({ clientId: cfg.oauthFacebookClientId, clientSecret: cfg.oauthFacebookClientSecret }),
		getCredentials: (cfg) => ({
			clientId: cfg.oauthFacebookClientId,
			clientSecret: cfg.oauthFacebookClientSecret
		}),
		resolveProfile: async ({ tokenJson }) => {
			const accessToken = tokenJson.access_token as string | undefined;
			if (!accessToken) throw new Error('No access_token from Facebook');
			const me = await fetchJson(`https://graph.facebook.com/me?fields=id&access_token=${encodeURIComponent(accessToken)}`);
			if (!me.id) throw new Error('Facebook /me missing id');
			return { sub: String(me.id) };
		}
	},
	linkedin: {
		key: 'linkedin',
		providerId: 'linkedin',
		authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
		tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
		scopes: 'openid profile',
		usePkce: true,
		authParams: { prompt: 'login consent' },
		isConfigured: (cfg) => hasCredentials({ clientId: cfg.oauthLinkedinClientId, clientSecret: cfg.oauthLinkedinClientSecret }),
		getCredentials: (cfg) => ({
			clientId: cfg.oauthLinkedinClientId,
			clientSecret: cfg.oauthLinkedinClientSecret
		}),
		resolveProfile: async ({ tokenJson, credentials }) => {
			const idToken = tokenJson.id_token as string | undefined;
			if (idToken) {
				const { payload } = await jwtVerify(idToken, LINKEDIN_JWKS, {
					audience: credentials.clientId,
					issuer: 'https://www.linkedin.com'
				});
				return profileFromIdTokenClaims(payload as Record<string, unknown>);
			}
			const accessToken = tokenJson.access_token as string | undefined;
			if (!accessToken) throw new Error('No tokens from LinkedIn');
			const userinfo = await fetchJson('https://api.linkedin.com/v2/userinfo', {
				headers: { Authorization: `Bearer ${accessToken}` }
			});
			return profileFromIdTokenClaims(userinfo);
		}
	},
	github: {
		key: 'github',
		providerId: 'github',
		authUrl: 'https://github.com/login/oauth/authorize',
		tokenUrl: 'https://github.com/login/oauth/access_token',
		scopes: 'read:user user:email',
		usePkce: true,
		isConfigured: (cfg) => hasCredentials({ clientId: cfg.oauthGithubClientId, clientSecret: cfg.oauthGithubClientSecret }),
		getCredentials: (cfg) => ({
			clientId: cfg.oauthGithubClientId,
			clientSecret: cfg.oauthGithubClientSecret
		}),
		resolveProfile: async ({ tokenJson }) => {
			const accessToken = tokenJson.access_token as string | undefined;
			if (!accessToken) throw new Error('No access_token from GitHub');
			const headers = {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/vnd.github+json',
				'User-Agent': 'bigmarket-auth'
			};
			const user = await fetchJson('https://api.github.com/user', { headers });
			if (!user.id) throw new Error('GitHub /user missing id');
			const profile: OAuthProfile = {
				sub: String(user.id),
				name: typeof user.name === 'string' ? user.name : typeof user.login === 'string' ? user.login : undefined,
				picture: typeof user.avatar_url === 'string' ? user.avatar_url : undefined
			};
			if (typeof user.email === 'string' && user.email) {
				profile.email = user.email;
				profile.emailVerified = true;
			} else {
				const emails = (await fetchJson('https://api.github.com/user/emails', { headers })) as unknown as Array<{
					email?: string;
					primary?: boolean;
					verified?: boolean;
				}>;
				const primary = emails.find((e) => e.primary) ?? emails[0];
				if (primary?.email) {
					profile.email = primary.email;
					profile.emailVerified = primary.verified ?? false;
				}
			}
			return profile;
		}
	},
	twitter: {
		key: 'twitter',
		providerId: 'twitter',
		authUrl: 'https://twitter.com/i/oauth2/authorize',
		tokenUrl: 'https://api.twitter.com/2/oauth2/token',
		scopes: 'users.read tweet.read',
		usePkce: true,
		authParams: { prompt: 'login' },
		isConfigured: (cfg) => hasCredentials({ clientId: cfg.oauthTwitterClientId, clientSecret: cfg.oauthTwitterClientSecret }),
		getCredentials: (cfg) => ({
			clientId: cfg.oauthTwitterClientId,
			clientSecret: cfg.oauthTwitterClientSecret
		}),
		resolveProfile: async ({ tokenJson }) => {
			const accessToken = tokenJson.access_token as string | undefined;
			if (!accessToken) throw new Error('No access_token from Twitter');
			const me = await fetchJson('https://api.twitter.com/2/users/me', {
				headers: { Authorization: `Bearer ${accessToken}` }
			});
			const id = (me.data as { id?: string } | undefined)?.id;
			if (!id) throw new Error('Twitter /users/me missing id');
			return { sub: id };
		}
	}
};

export function getOAuthProvider(key: string): OAuthProviderDef | undefined {
	return OAUTH_PROVIDERS[key as OAuthProviderKey];
}

export function listConfiguredProviders(cfg: ConfigI): OAuthProviderKey[] {
	return (Object.keys(OAUTH_PROVIDERS) as OAuthProviderKey[]).filter((k) => OAUTH_PROVIDERS[k].isConfigured(cfg));
}
