// auth.ts
import type { RequestHandler } from 'express';
import { randomBytes, createHash } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { ReclaimProofRequest, verifyProof } from '@reclaimprotocol/js-sdk';
import { getConfig } from '../../lib/config.js';
import crypto from 'crypto';

// use your exported collections (no Mongo types here)
import {
	authUserCollection,
	authProviderAccountCollection,
	authZkSessionCollection,
	authJwtSessionCollection,
	authRefreshTokenCollection,
	authProofCollection // optional, for storing proof blobs
} from '../../lib/data/db_models.js';

// -------------------- config --------------------
const ACCESS_TTL_S = 15 * 60; // 15 mins
const REFRESH_TTL_S = 30 * 24 * 3600; // 30 days
const JWT_ISSUER = 'bigmarket';
const JWT_AUD = 'bigmarket-ui';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!); // 32+ bytes
const AUTH_BASE_PATH = '/bigmarket-api/auth';
const ZK_TTL_MS = 10 * 60 * 1000;

// -------------------- helpers --------------------
const sha256hex = (s: string) => createHash('sha256').update(s).digest('hex');
const sha256 = (s: crypto.BinaryLike) => crypto.createHash('sha256').update(s).digest('hex');

// If you want a peppered/HMAC subject hash instead, swap this in:
// const SUBJECT_PEPPER = process.env.SUBJECT_PEPPER!;
// const subjectHashOf = (providerId: string, subject: string) =>
//   '0x' + createHmac('sha256', SUBJECT_PEPPER).update(`${providerId}:${subject}`).digest('hex');
const subjectHashOf = (_providerId: string, subject: string) => '0x' + sha256(String(subject));

async function signAccessJWT(payload: any) {
	const now = Math.floor(Date.now() / 1000);
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer(JWT_ISSUER)
		.setAudience(JWT_AUD)
		.setIssuedAt(now)
		.setExpirationTime(now + ACCESS_TTL_S)
		.sign(JWT_SECRET);
}
async function verifyAccessJWT(token: string) {
	return await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER, audience: JWT_AUD });
}
function extractSubject(proof: any): string {
	return (
		proof?.claimData?.extractedParameters?.sub ??
		proof?.claimData?.extractedParameters?.id ?? // GitHub/Twitter/LinkedIn numeric id (prefer stable id)
		proof?.claimData?.extractedParameters?.login ?? // fallback
		proof?.claimData?.extractedParameters?.username ?? // fallback
		'unknown'
	);
}

// -------------------- zkTLS: start flow --------------------
// config remains the same

// ---------- zkTLS: start ----------
export const startHandler: RequestHandler = async (req, res) => {
	const providers = [
		{ provider: 'google', id: getConfig().zkTlsProviderGoogle },
		{ provider: 'github', id: getConfig().zkTlsProviderGithub },
		{ provider: 'twitter', id: getConfig().zkTlsProviderTwitter },
		{ provider: 'linkedin', id: getConfig().zkTlsProviderLinkedIn }
	];
	const providerId = providers.find((o) => o.provider === req.params.provider)?.id;
	if (!providerId) {
		res.status(400).json({ error: 'bad provider' });
		return;
	}

	const purpose = String(req.body?.purpose ?? '') as 'login' | 'forum-comment' | '';
	const canonical = String(req.body?.canonical_post ?? '').trim();
	if (purpose !== 'login' && !canonical) {
		res.status(400).json({ error: 'empty post' });
		return;
	}

	const APP_ID = getConfig().zkTlsAppId;
	const APP_SECRET = getConfig().zkTlsAppSecret;

	const session_id = crypto.randomUUID();
	const post_hash = canonical ? '0x' + sha256(canonical) : undefined;
	const login_challenge = purpose === 'login' ? '0x' + sha256(`login:${session_id}:${Date.now()}`) : undefined;
	const contextId = purpose === 'login' ? (login_challenge as string) : (post_hash as string);

	// NOTE: no _id set; Mongo generates ObjectId
	await authZkSessionCollection.insertOne({
		sessionId: session_id,
		status: 'pending',
		flow: purpose === 'login' ? 'login' : 'forum-comment',
		providerId,
		contextId,
		canonicalPost: canonical || null,
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + ZK_TTL_MS)
	} as any);

	const pr = await ReclaimProofRequest.init(APP_ID, APP_SECRET, providerId);
	pr.setAppCallbackUrl(`${getConfig().bigmarketUrl}${AUTH_BASE_PATH}/reclaim/receive-proofs`, true);
	pr.addContext(contextId, JSON.stringify({ session_id, purpose: purpose || 'forum-comment' }));

	res.json({ session_id, reclaimProofRequestConfig: pr.toJsonString() });
};

// ---------- zkTLS: callback/verify ----------
export const receiveProofsHandler: RequestHandler = async (req, res) => {
	try {
		const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
		const proof = JSON.parse(bodyStr);
		if (!(await verifyProof(proof))) {
			res.status(400).json({ error: 'invalid proof' });
			return;
		}

		const ctxRaw = proof?.claimData?.context || '{}';
		const ctx = typeof ctxRaw === 'string' ? JSON.parse(ctxRaw) : ctxRaw;
		const session_id: string | undefined = ctx?.session_id;
		const purpose: 'login' | 'forum-comment' = ctx?.purpose || 'forum-comment';
		if (!session_id) {
			res.status(400).json({ error: 'missing session' });
			return;
		}

		const zk = await authZkSessionCollection.findOne({ sessionId: session_id });
		if (!zk) {
			res.status(400).json({ error: 'unknown session' });
			return;
		}
		if (zk.status === 'verified') {
			res.sendStatus(200);
			return;
		}
		if (zk.expiresAt && zk.expiresAt.getTime() < Date.now()) {
			res.status(400).json({ error: 'session expired' });
			return;
		}

		const contextIdFromProof = proof?.claimData?.contextId || proof?.claimData?.context_id;
		if (!contextIdFromProof || contextIdFromProof !== zk.contextId) {
			res.status(400).json({ error: 'bad context' });
			return;
		}

		const subject = extractSubject(proof);
		const subjectHash = subjectHashOf(zk.providerId, subject);

		await authZkSessionCollection.updateOne({ sessionId: session_id, status: 'pending' }, { $set: { status: 'verified', subjectHash, verifiedAt: new Date() } });

		// Optional: store proof blob (audit)
		try {
			await authProofCollection.insertOne({
				zkSessionId: session_id,
				providerId: zk.providerId,
				storedAt: new Date(),
				blob: proof
			} as any);
		} catch {}

		// (Forum persist would go here if you want)
		res.sendStatus(200);
	} catch (e) {
		console.error('verify error', e);
		res.status(500).json({ error: 'verify failed' });
	}
};

// ---------- exchange zkTLS for JWT/refresh ----------
export const issueTokensFromZkTLS: RequestHandler = async (req, res) => {
	const { session_id } = req.query as { session_id?: string };
	if (!session_id) {
		res.status(400).json({ error: 'missing session_id' });
		return;
	}

	const zk = await authZkSessionCollection.findOne({ sessionId: session_id });
	if (!zk || zk.status !== 'verified' || !zk.subjectHash) {
		res.status(400).json({ error: 'not verified' });
		return;
	}

	// provider account → user
	let pa = await authProviderAccountCollection.findOne({ providerId: zk.providerId, subjectHash: zk.subjectHash });
	let userId: any;
	if (!pa) {
		const u = await authUserCollection.insertOne({
			createdAt: new Date(),
			lastLoginAt: new Date(),
			primaryProviderId: zk.providerId
		} as any);
		userId = u.insertedId;
		await authProviderAccountCollection.insertOne({
			userId,
			providerId: zk.providerId,
			subjectHash: zk.subjectHash,
			addedAt: new Date(),
			lastVerifiedAt: new Date()
		} as any);
	} else {
		userId = (pa as any).userId;
		await authUserCollection.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
		await authProviderAccountCollection.updateOne({ _id: (pa as any)._id }, { $set: { lastVerifiedAt: new Date() } });
	}

	// JWT/device session (sid) — no _id set
	const sid = crypto.randomUUID();
	await authJwtSessionCollection.insertOne({
		sid, // <<< store as field
		userId,
		deviceId: req.get('User-Agent')?.slice(0, 200) ?? 'device',
		createdAt: new Date()
	} as any);

	// refresh token (tokenId) — no _id set
	const refreshRaw = randomBytes(32).toString('base64url');
	const tokenId = crypto.randomUUID();
	await authRefreshTokenCollection.insertOne({
		tokenId, // <<< store as field
		sessionSid: sid, // <<< reference by sid
		tokenHash: sha256hex(refreshRaw),
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + REFRESH_TTL_S * 1000)
	} as any);

	// cookie
	res.cookie('bm_rt', `${tokenId}.${refreshRaw}`, {
		httpOnly: true,
		secure: true,
		sameSite: 'none',
		path: '/bigmarket-api/auth',
		maxAge: REFRESH_TTL_S * 1000
	});

	const access = await signAccessJWT({
		uid: String(userId),
		subh: zk.subjectHash,
		prv: zk.providerId,
		sid,
		v: 'zktls:v1'
	});

	res.json({ accessToken: access, user: { id: String(userId) } });
};

// ---------- refresh (rotate) ----------
export const refreshAccess: RequestHandler = async (req, res) => {
	const cookie = req.cookies?.bm_rt as string | undefined;
	if (!cookie) {
		res.status(401).json({ error: 'no refresh' });
		return;
	}

	const [tokenId, raw] = cookie.split('.');
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

	// rotate
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
	res.cookie('bm_rt', `${newTokenId}.${newRaw}`, {
		httpOnly: true,
		secure: true,
		sameSite: 'none',
		path: '/bigmarket-api/auth',
		maxAge: REFRESH_TTL_S * 1000
	});

	// fetch any provider account for JWT fields
	const pa = await authProviderAccountCollection.findOne({ userId: session.userId });
	const subh = pa?.subjectHash ?? '0x';
	const prv = pa?.providerId ?? 'unknown';

	const access = await signAccessJWT({
		uid: String(session.userId),
		subh,
		prv,
		sid: (rec as any).sessionSid,
		v: 'zktls:v1'
	});

	res.json({ accessToken: access });
};

// ---------- logout ----------
export const logout: RequestHandler = async (req, res) => {
	const cookie = req.cookies?.bm_rt as string | undefined;
	if (cookie) {
		const [tokenId] = cookie.split('.');
		const rec = await authRefreshTokenCollection.findOne({ tokenId });
		if (rec) {
			await authRefreshTokenCollection.updateOne({ tokenId }, { $set: { revokedAt: new Date() } });
			await authJwtSessionCollection.updateOne({ sid: (rec as any).sessionSid }, { $set: { revokedAt: new Date() } });
		}
	}
	res.clearCookie('bm_rt', { path: AUTH_BASE_PATH });
	res.sendStatus(204);
};

// ---------- zk session status ----------
export const getZkSessionStatus: RequestHandler = async (req, res) => {
	const zk = await authZkSessionCollection.findOne({ sessionId: req.params.id });
	res.json({ verified: !!zk && zk.status === 'verified' });
};

// -------------------- auth guard --------------------
export const requireAuth: RequestHandler = async (req, res, next) => {
	const tok = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
	try {
		const { payload } = await verifyAccessJWT(tok);
		(req as any).user = { id: payload.uid, subh: payload.subh, prv: payload.prv, sid: payload.sid };
		next();
	} catch {
		res.status(401).json({ error: 'unauthorized' });
	}
};
