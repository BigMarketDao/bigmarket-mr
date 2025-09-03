// server.js
import express from 'express';
import crypto from 'crypto';
import { ReclaimProofRequest, verifyProof } from '@reclaimprotocol/js-sdk';
import { getConfig } from '../../lib/config.js';

const router = express.Router();

// --- CONFIG (env)
const APP_ID = process.env.RECLAIM_APP_ID; // e.g. 0x18F84
const APP_SECRET = process.env.RECLAIM_APP_SECRET;
const PROVIDER_ID = 'a80150ce-94c5-4293-bec2-516e0ab2191e'; // Google (from your list)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// In-memory demo store (swap for Redis/DB)
const SESSIONS = new Map(); // session_id -> { post_hash, status, createdAt }
const POSTS = []; // your persisted comments

// Utility
const sha256 = (s: crypto.BinaryLike) => crypto.createHash('sha256').update(s).digest('hex');

router.post('/reclaim/start/:provider', async (req, res) => {
	const providers = [
		{ provider: 'google', id: getConfig().zkTlsProviderGoogle },
		{ provider: 'github', id: getConfig().zkTlsProviderGithub },
		{ provider: 'twitter', id: getConfig().zkTlsProviderTwitter },
		{ provider: 'linkedin', id: getConfig().zkTlsProviderLinkedIn }
	];
	console.log('/reclaim/start/:provider', providers);
	const providerId = providers.find((o) => o.provider === req.params.provider)?.id;
	if (!providerId) {
		res.status(400).json({ error: 'bad provider' });
		return;
	}
	const purpose = (req.body?.purpose ?? '').toString() as 'login' | 'forum-comment' | '';
	const canonical = String(req.body?.canonical_post ?? '').trim();
	if (purpose !== 'login' && !canonical) {
		res.status(400).json({ error: 'empty post' });
		return;
	}
	console.log('/reclaim/start/:provider ' + providerId);
	const APP_ID = getConfig().zkTlsAppId;
	const APP_SECRET = getConfig().zkTlsAppSecret;
	//const provider = req.params.provider.toLocaleLowerCase();
	const session_id = crypto.randomUUID();

	const post_hash = canonical ? '0x' + sha256(canonical) : undefined;
	const login_challenge = purpose === 'login' ? '0x' + sha256(`login:${session_id}:${Date.now()}`) : undefined;

	// Save session (tight TTL recommended)
	// SESSIONS.set(session_id, { post_hash, status: 'pending', createdAt: Date.now(), canonical });
	SESSIONS.set(session_id, {
		status: 'pending',
		createdAt: Date.now(),
		flow: purpose === 'login' ? 'login' : 'forum-comment',
		post_hash,
		login_challenge,
		providerId
	});
	const pr = await ReclaimProofRequest.init(APP_ID, APP_SECRET, providerId); // ← use providerId (bug fix)
	pr.setAppCallbackUrl(`${BASE_URL}/zktls/reclaim/receive-proofs`, true /* jsonProofResponse */);
	const contextId = purpose === 'login' ? login_challenge! : post_hash!;
	pr.addContext(contextId, JSON.stringify({ session_id, purpose: purpose || 'forum-comment' }));

	const reclaimProofRequestConfig = pr.toJsonString();
	res.json({ session_id, reclaimProofRequestConfig });
});

// Reclaim posts the proof here
router.post('/reclaim/receive-proofs', async (req, res) => {
	try {
		// If jsonProofResponse=false, you'd need to decode urlencoded text.
		const proof = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

		// 1) Verify signature & witness using SDK
		const ok = await verifyProof(proof);
		if (!ok) {
			res.status(400).json({ error: 'invalid proof' });
			return;
		}

		// 2) Extract and validate context
		const ctx = JSON.parse(proof?.claimData?.context || '{}');
		const session_id = ctx?.session_id;
		const sess = session_id && SESSIONS.get(session_id);
		const contextId = proof?.claimData?.contextId || proof?.claimData?.context_id;
		const purpose = ctx?.purpose || 'forum-comment';

		if (!sess) {
			res.status(400).json({ error: 'unknown session' });
			return;
		}
		if (sess.status === 'verified') {
			res.sendStatus(200);
			return;
		}
		if (purpose === 'login') {
			if (contextId !== sess.login_challenge) {
				res.status(400).json({ error: 'bad context' });
				return;
			}

			// Extract a stable subject from the proof (provider-specific)
			const subject = extractSubject(proof); // e.g. Google "sub", GitHub "login", Twitter "username"
			const subjectHash = '0x' + sha256(String(subject));

			// Save the post (you already have sess.post_hash + SESSIONS.get(session_id).canonical)
			POSTS.push({
				session_id,
				post_hash: sess.post_hash,
				canonical_post: sess.canonical,
				provider_id: sess.providerId,
				subjectHash,
				proof,
				verified_at: Date.now()
			});

			// Issue your short-lived session (JWT/cookie) if desired, or just mark verified
			sess.status = 'verified';
			sess.subject = subject;
			sess.subjectHash = subjectHash;
			SESSIONS.set(session_id, sess);
			res.sendStatus(200);
		}

		// Make sure contextId (hex) matches our post_hash bound earlier
		if (contextId !== sess.post_hash) {
			res.status(400).json({ error: 'context/post mismatch' });
			return;
		}

		// 3) Optional: ensure provider is Google
		// (Most proofs include provider info; adjust based on actual payload field)
		// if (proof?.claimData?.providerId !== PROVIDER_ID) { ... }

		// 4) Persist the post (store only hash + a stable subject identifier; avoid PII)
		POSTS.push({
			session_id,
			post_hash: sess.post_hash,
			canonical_post: sess.canonical,
			provider_id: PROVIDER_ID,
			proof, // keep full blob server-side for audit
			verified_at: Date.now()
		});

		// Mark session verified
		sess.status = 'verified';
		SESSIONS.set(session_id, sess);
		res.json('200');
	} catch (e) {
		console.error('verify error', e);
		res.status(500).json({ error: 'verify failed' });
	}
});

// You implement this per provider:
function extractSubject(proof: any): string {
	// Example shapes; adjust to actual Reclaim payload fields for each provider.
	// Google:   proof.claimData.extractedParameters.sub
	// GitHub:   proof.claimData.extractedParameters.login
	// Twitter:  proof.claimData.extractedParameters.username
	// LinkedIn: proof.claimData.extractedParameters.id
	return proof?.claimData?.extractedParameters?.sub || proof?.claimData?.extractedParameters?.login || proof?.claimData?.extractedParameters?.username || proof?.claimData?.extractedParameters?.id || 'unknown';
}

router.get('/reclaim/session/:id/status', (req, res) => {
	const sess = SESSIONS.get(req.params.id);
	res.json({ verified: !!sess && sess.status === 'verified' });
});

export { router as zktlsRoutes };
