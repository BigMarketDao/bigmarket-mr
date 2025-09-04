// routes/auth/oauth-google.ts
import type { RequestHandler } from 'express';
import crypto from 'crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getConfig } from '../../lib/config.js';

// your existing Mongo collections + helpers
import {
	authUserCollection,
	authProviderAccountCollection,
	authJwtSessionCollection,
	authRefreshTokenCollection,
	authOauthSessionCollection // <-- add this export, see section 2
} from '../../lib/data/db_models.js';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

const AUTH_BASE_PATH = '/bigmarket-api/auth';
const REFRESH_COOKIE_NAME = 'bm_rt';
const ACCESS_TTL_S = 15 * 60;
const REFRESH_TTL_S = 30 * 24 * 3600;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FRONTEND_RETURN = process.env.OAUTH_RETURN_URL!; // e.g. https://app.bigmarket.ai/auth/callback

// util
const b64url = (buf: Buffer) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256 = (s: string | Buffer) => crypto.createHash('sha256').update(s).digest();
const sha256hex = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

async function signAccessJWT(payload: any) {
	const { SignJWT } = await import('jose');
	const now = Math.floor(Date.now() / 1000);
	const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer('bigmarket')
		.setAudience('bigmarket-ui')
		.setIssuedAt(now)
		.setExpirationTime(now + ACCESS_TTL_S)
		.sign(secret);
}

// GET /oauth/google/start?redirect_uri=<frontend url you want to land on>
export const oauthGoogleStart: RequestHandler = async (req, res) => {
	const redirectUri = `${getConfig().bigmarketUrl}${AUTH_BASE_PATH}/oauth/google/callback`;
	const returnTo = (req.query.redirect_uri as string) || process.env.OAUTH_RETURN_URL || 'http://localhost:8081/auth/callback';

	// PKCE
	const code_verifier = b64url(crypto.randomBytes(64));
	const code_challenge = b64url(sha256(code_verifier));
	const state = crypto.randomUUID();

	// persist short-lived oauth session
	await authOauthSessionCollection.insertOne({
		state,
		provider: 'google',
		codeVerifier: code_verifier,
		returnTo,
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + 10 * 60 * 1000)
	} as any);

	const url = new URL(GOOGLE_AUTH);
	url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('scope', 'openid email profile'); // we’ll only use 'sub'
	url.searchParams.set('code_challenge', code_challenge);
	url.searchParams.set('code_challenge_method', 'S256');
	url.searchParams.set('state', state);
	url.searchParams.set('prompt', 'consent'); // optional
	url.searchParams.set('access_type', 'offline'); // optional

	res.redirect(url.toString());
};

// GET /oauth/google/callback?code=...&state=...
export const oauthGoogleCallback: RequestHandler = async (req, res) => {
	try {
		const code = String(req.query.code || '');
		const state = String(req.query.state || '');
		if (!code || !state) {
			res.status(400).send('Bad request');
			return;
		}

		const sess = await authOauthSessionCollection.findOne({ state });
		if (!sess || sess.expiresAt.getTime() < Date.now()) {
			res.status(400).send('Session expired');
			return;
		}

		// Exchange code for tokens
		const redirectUri = `${getConfig().bigmarketUrl}${AUTH_BASE_PATH}/oauth/google/callback`;
		const form = new URLSearchParams({
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			code,
			grant_type: 'authorization_code',
			code_verifier: sess.codeVerifier,
			redirect_uri: redirectUri
		});

		const tokenResp = await fetch(GOOGLE_TOKEN, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: form
		});
		if (!tokenResp.ok) {
			const txt = await tokenResp.text();
			console.error('Google token error', tokenResp.status, txt);
			res.status(400).send('Token exchange failed');
			return;
		}
		const tokenJson = (await tokenResp.json()) as any;
		const id_token = tokenJson.id_token as string;
		if (!id_token) {
			res.status(400).send('No id_token');
			return;
		}

		// Verify ID token
		const { payload } = await jwtVerify(id_token, GOOGLE_JWKS, { audience: GOOGLE_CLIENT_ID, issuer: 'https://accounts.google.com' });
		const sub = String(payload.sub);
		const providerId = 'google-oauth';
		const subjectHash = '0x' + sha256hex(`${providerId}:${sub}`);

		// Find or create user + provider account
		let pa = await authProviderAccountCollection.findOne({ providerId, subjectHash });
		let userId: any;
		if (!pa) {
			const u = await authUserCollection.insertOne({
				createdAt: new Date(),
				lastLoginAt: new Date(),
				primaryProviderId: providerId
			} as any);
			userId = u.insertedId;
			await authProviderAccountCollection.insertOne({
				userId,
				providerId,
				subjectHash,
				addedAt: new Date(),
				lastVerifiedAt: new Date()
			} as any);
		} else {
			userId = (pa as any).userId;
			await authUserCollection.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
			await authProviderAccountCollection.updateOne({ _id: (pa as any)._id }, { $set: { lastVerifiedAt: new Date() } });
		}

		// Create device session + refresh token
		const sid = crypto.randomUUID();
		await authJwtSessionCollection.insertOne({
			sid,
			userId,
			deviceId: req.get('User-Agent')?.slice(0, 200) ?? 'device',
			createdAt: new Date()
		} as any);

		const refreshRaw = b64url(crypto.randomBytes(32));
		const tokenId = crypto.randomUUID();
		await authRefreshTokenCollection.insertOne({
			tokenId,
			sessionSid: sid,
			tokenHash: sha256hex(refreshRaw),
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + REFRESH_TTL_S * 1000)
		} as any);

		// Set refresh cookie (cross-site)
		res.cookie(REFRESH_COOKIE_NAME, `${tokenId}.${refreshRaw}`, {
			httpOnly: true,
			secure: true,
			sameSite: 'none', // cross-origin fetch
			path: AUTH_BASE_PATH,
			maxAge: REFRESH_TTL_S * 1000
		});

		// (Option A) Redirect back to app; client calls /refresh to get access token
		res.redirect(sess.returnTo || process.env.OAUTH_RETURN_URL || '/');

		// (Option B) If you prefer, you could also issue an access token here and append a short flag to the redirect
		// const access = await signAccessJWT({ uid: String(userId), subh: subjectHash, prv: providerId, sid, v: 'oauth:v1' });
		// res.redirect(`${sess.returnTo}?at=1`);
	} catch (e) {
		console.error('oauth callback error', e);
		res.status(500).send('OAuth failed');
	}
};
