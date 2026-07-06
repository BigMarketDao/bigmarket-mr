import type { RequestHandler } from 'express';
import crypto from 'crypto';
import { getConfig } from '../../../lib/config.js';
import { authOauthSessionCollection } from '../../../lib/data/db_models.js';
import { establishAuthSession, findOrCreateUser, subjectHashOf } from '../auth.js';
import { getOAuthProvider, listConfiguredProviders } from './oauth_providers.js';

const OAUTH_SESSION_TTL_MS = 10 * 60 * 1000;

const b64url = (buf: Buffer) => buf.toString('base64url');
const sha256 = (s: string | Buffer) => crypto.createHash('sha256').update(s).digest();

function apiCallbackUrl(providerKey: string) {
	return `${getConfig().apiBaseUrl}/bigmarket-api/auth/oauth/${providerKey}/callback`;
}

function frontendReturnUrl(queryValue?: string) {
	return (queryValue || getConfig().authFrontendReturnUrl || '/').trim();
}

/** GET /oauth/providers — list providers with credentials configured. */
export const listProviders: RequestHandler = (_req, res) => {
	const providers = listConfiguredProviders(getConfig());
	res.json({ providers });
};

/** GET /oauth/:provider/start?redirect_uri=<optional frontend return url> */
export const oauthStart: RequestHandler = async (req, res) => {
	const providerKey = String(req.params.provider);
	const provider = getOAuthProvider(providerKey);
	if (!provider) {
		res.status(404).json({ error: 'unknown provider' });
		return;
	}
	const cfg = getConfig();
	if (!provider.isConfigured(cfg)) {
		res.status(503).json({ error: 'provider not configured' });
		return;
	}

	const credentials = provider.getCredentials(cfg);
	const returnTo = frontendReturnUrl(req.query.redirect_uri as string | undefined);
	const redirectUri = apiCallbackUrl(provider.key);

	const codeVerifier = b64url(crypto.randomBytes(64));
	const codeChallenge = b64url(sha256(codeVerifier));
	const state = crypto.randomUUID();

	await authOauthSessionCollection.insertOne({
		state,
		provider: provider.key,
		codeVerifier: provider.usePkce ? codeVerifier : null,
		returnTo,
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + OAUTH_SESSION_TTL_MS)
	} as any);

	const url = new URL(provider.authUrl);
	url.searchParams.set('client_id', credentials.clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('scope', provider.scopes);
	url.searchParams.set('state', state);

	if (provider.usePkce) {
		url.searchParams.set('code_challenge', codeChallenge);
		url.searchParams.set('code_challenge_method', 'S256');
	}

	for (const [key, value] of Object.entries(provider.authParams ?? {})) {
		url.searchParams.set(key, value);
	}

	res.redirect(url.toString());
};

/** GET /oauth/:provider/callback?code=...&state=... */
export const oauthCallback: RequestHandler = async (req, res) => {
	const providerKey = String(req.params.provider);
	const provider = getOAuthProvider(providerKey);
	if (!provider) {
		res.status(404).send('Unknown provider');
		return;
	}

	try {
		const code = String(req.query.code || '');
		const state = String(req.query.state || '');
		if (!code || !state) {
			res.status(400).send('Bad request');
			return;
		}

		const session = await authOauthSessionCollection.findOneAndDelete({ state });
		if (!session || session.provider !== provider.key) {
			console.error(`${provider.key} oauth callback: invalid session`, {
				state,
				found: !!session,
				provider: session?.provider
			});
			res.status(400).send('Invalid session');
			return;
		}
		if (session.expiresAt.getTime() < Date.now()) {
			res.status(400).send('Session expired');
			return;
		}

		const cfg = getConfig();
		const credentials = provider.getCredentials(cfg);
		const redirectUri = apiCallbackUrl(provider.key);

		const form = new URLSearchParams({
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
			code,
			grant_type: 'authorization_code',
			redirect_uri: redirectUri
		});
		if (provider.usePkce && session.codeVerifier) {
			form.set('code_verifier', session.codeVerifier);
		}

		const tokenResp = await fetch(provider.tokenUrl, {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				Accept: 'application/json'
			},
			body: form
		});
		if (!tokenResp.ok) {
			const txt = await tokenResp.text();
			console.error(`${provider.key} token error`, tokenResp.status, txt);
			res.status(400).send('Token exchange failed');
			return;
		}

		const tokenJson = (await tokenResp.json()) as Record<string, unknown>;
		const profile = await provider.resolveProfile({ tokenJson, credentials });
		const subjectHash = subjectHashOf(provider.providerId, profile.sub);

		const { userId } = await findOrCreateUser(provider.providerId, subjectHash, profile);
		await establishAuthSession(req, res, userId, provider.providerId, subjectHash);

		res.redirect(session.returnTo || getConfig().authFrontendReturnUrl || '/');
	} catch (e) {
		console.error(`${providerKey} oauth callback error`, e);
		res.status(500).send('OAuth failed');
	}
};
