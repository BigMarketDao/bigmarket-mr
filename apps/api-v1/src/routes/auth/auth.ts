import type { Request, RequestHandler, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { getConfig, isDev } from '../../lib/config.js';
import {
	authUserCollection,
	authProviderAccountCollection,
	authJwtSessionCollection,
	authRefreshTokenCollection
} from '../../lib/data/db_models.js';
import type { OAuthProfile } from './oauth/oauth_types.js';

export const AUTH_BASE_PATH = '/bigmarket-api/auth';
export const REFRESH_COOKIE_NAME = 'bm_rt';
const ACCESS_TTL_S = 15 * 60;
const REFRESH_TTL_S = 30 * 24 * 3600;
const JWT_ISSUER = 'bigmarket';
const JWT_AUD = 'bigmarket-ui';

const sha256hex = (s: string) => createHash('sha256').update(s).digest('hex');

export class AuthConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthConfigError';
	}
}

function jwtSecret() {
	const secret = getConfig().jwtSecret;
	if (!secret) {
		throw new AuthConfigError('JWT secret not configured');
	}
	return new TextEncoder().encode(secret);
}

export function subjectHashOf(providerId: string, subject: string) {
	return '0x' + sha256hex(`${providerId}:${subject}`);
}

function isLocalApi() {
	const base = getConfig().apiBaseUrl;
	return base.startsWith('http://localhost') || base.startsWith('http://127.0.0.1');
}

export function refreshCookieOptions() {
	const secure = !isDev() && !isLocalApi();
	return {
		httpOnly: true,
		secure,
		sameSite: secure ? ('none' as const) : ('lax' as const),
		path: AUTH_BASE_PATH,
		maxAge: REFRESH_TTL_S * 1000
	};
}

export function setRefreshCookie(res: Response, tokenId: string, raw: string) {
	res.cookie(REFRESH_COOKIE_NAME, `${tokenId}.${raw}`, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response) {
	const { maxAge: _maxAge, ...opts } = refreshCookieOptions();
	res.clearCookie(REFRESH_COOKIE_NAME, opts);
}

export async function signAccessJWT(payload: Record<string, unknown>) {
	const now = Math.floor(Date.now() / 1000);
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer(JWT_ISSUER)
		.setAudience(JWT_AUD)
		.setIssuedAt(now)
		.setExpirationTime(now + ACCESS_TTL_S)
		.sign(jwtSecret());
}

async function verifyAccessJWT(token: string) {
	return await jwtVerify(token, jwtSecret(), { issuer: JWT_ISSUER, audience: JWT_AUD });
}

function providerAccountFields(profile: OAuthProfile) {
	return {
		sub: profile.sub,
		email: profile.email ?? null,
		emailVerified: profile.emailVerified ?? null,
		name: profile.name ?? null,
		picture: profile.picture ?? null
	};
}

function userProfileFields(profile: OAuthProfile) {
	return {
		email: profile.email ?? null,
		emailVerified: profile.emailVerified ?? null,
		name: profile.name ?? null,
		picture: profile.picture ?? null
	};
}

/** Merge profile into $set updates without overwriting stored values with null/undefined. */
function profileSyncFields(profile: OAuthProfile, includeSub = false) {
	const fields: Record<string, unknown> = {};
	if (includeSub) fields.sub = profile.sub;
	if (profile.email != null) fields.email = profile.email;
	if (profile.emailVerified != null) fields.emailVerified = profile.emailVerified;
	if (profile.name != null) fields.name = profile.name;
	if (profile.picture != null) fields.picture = profile.picture;
	return fields;
}

export async function findOrCreateUser(providerId: string, subjectHash: string, profile: OAuthProfile) {
	let pa = await authProviderAccountCollection.findOne({ providerId, subjectHash });
	// Link legacy accounts (e.g. subjectHash algorithm change) by stable provider sub.
	if (!pa && profile.sub) {
		pa = await authProviderAccountCollection.findOne({ providerId, sub: profile.sub });
		if (pa && (pa as any).subjectHash !== subjectHash) {
			await authProviderAccountCollection.updateOne({ _id: (pa as any)._id }, { $set: { subjectHash } });
		}
	}
	if (!pa) {
		const now = new Date();
		const u = await authUserCollection.insertOne({
			createdAt: now,
			lastLoginAt: now,
			primaryProviderId: providerId,
			...userProfileFields(profile)
		} as any);
		const userId = u.insertedId;
		await authProviderAccountCollection.insertOne({
			userId,
			providerId,
			subjectHash,
			...providerAccountFields(profile),
			addedAt: now,
			lastVerifiedAt: now
		} as any);
		return { userId, subjectHash, providerId, created: true as const };
	}

	const userId = (pa as any).userId;
	const now = new Date();
	const profileUpdates = profileSyncFields(profile);
	const providerUpdates = profileSyncFields(profile, true);

	await authUserCollection.updateOne(
		{ _id: userId },
		{ $set: { lastLoginAt: now, ...profileUpdates } }
	);
	await authProviderAccountCollection.updateOne(
		{ _id: (pa as any)._id },
		{ $set: { lastVerifiedAt: now, ...providerUpdates } }
	);
	return { userId, subjectHash, providerId, created: false as const };
}

/** Create device session, refresh token, and set httpOnly cookie. */
export async function establishAuthSession(
	req: Request,
	res: Response,
	userId: unknown,
	providerId: string,
	subjectHash: string
) {
	const sid = crypto.randomUUID();
	await authJwtSessionCollection.insertOne({
		sid,
		userId,
		deviceId: req.get('User-Agent')?.slice(0, 200) ?? 'device',
		createdAt: new Date()
	} as any);

	const refreshRaw = randomBytes(32).toString('base64url');
	const tokenId = crypto.randomUUID();
	await authRefreshTokenCollection.insertOne({
		tokenId,
		sessionSid: sid,
		tokenHash: sha256hex(refreshRaw),
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + REFRESH_TTL_S * 1000)
	} as any);

	setRefreshCookie(res, tokenId, refreshRaw);
	return { sid, userId, providerId, subjectHash };
}

export const refreshAccess: RequestHandler = async (req, res) => {
	const cookie = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
	if (!cookie) {
		res.status(401).json({ error: 'no refresh' });
		return;
	}

	const dot = cookie.indexOf('.');
	if (dot < 1) {
		res.status(401).json({ error: 'invalid refresh' });
		return;
	}
	const tokenId = cookie.slice(0, dot);
	const raw = cookie.slice(dot + 1);

	const rec = await authRefreshTokenCollection.findOne({ tokenId });
	if (!rec || (rec as any).revokedAt) {
		res.status(401).json({ error: 'invalid refresh' });
		return;
	}
	if (rec.expiresAt.getTime() < Date.now()) {
		res.status(401).json({ error: 'expired refresh' });
		return;
	}
	if (sha256hex(raw) !== rec.tokenHash) {
		res.status(401).json({ error: 'bad token' });
		return;
	}

	const session = await authJwtSessionCollection.findOne({ sid: (rec as any).sessionSid });
	if (!session || (session as any).revokedAt) {
		res.status(401).json({ error: 'revoked session' });
		return;
	}

	await authRefreshTokenCollection.updateOne({ tokenId }, { $set: { revokedAt: new Date() } });
	const newRaw = randomBytes(32).toString('base64url');
	const newTokenId = crypto.randomUUID();
	await authRefreshTokenCollection.insertOne({
		tokenId: newTokenId,
		sessionSid: (rec as any).sessionSid,
		tokenHash: sha256hex(newRaw),
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + REFRESH_TTL_S * 1000)
	} as any);
	setRefreshCookie(res, newTokenId, newRaw);

	const pa = await authProviderAccountCollection.findOne({ userId: session.userId });
	const subh = pa?.subjectHash ?? '0x';
	const prv = pa?.providerId ?? 'unknown';

	try {
		const access = await signAccessJWT({
			uid: String(session.userId),
			subh,
			prv,
			sid: (rec as any).sessionSid,
			v: 'oauth:v1'
		});
		res.json({ accessToken: access });
	} catch (e) {
		if (e instanceof AuthConfigError) {
			console.error('[auth] refresh failed:', e.message);
			res.status(503).json({ error: 'auth not configured' });
			return;
		}
		throw e;
	}
};

export const logout: RequestHandler = async (req, res) => {
	const cookie = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
	if (cookie) {
		const tokenId = cookie.split('.')[0];
		const rec = await authRefreshTokenCollection.findOne({ tokenId });
		if (rec) {
			await authRefreshTokenCollection.updateOne({ tokenId }, { $set: { revokedAt: new Date() } });
			await authJwtSessionCollection.updateOne({ sid: (rec as any).sessionSid }, { $set: { revokedAt: new Date() } });
		}
	}
	clearRefreshCookie(res);
	res.sendStatus(204);
};

export const requireAuth: RequestHandler = async (req, res, next) => {
	const tok = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
	if (!tok) {
		res.status(401).json({ error: 'unauthorized' });
		return;
	}
	try {
		const { payload } = await verifyAccessJWT(tok);
		(req as any).user = { id: payload.uid, subh: payload.subh, prv: payload.prv, sid: payload.sid };
		next();
	} catch {
		res.status(401).json({ error: 'unauthorized' });
	}
};
