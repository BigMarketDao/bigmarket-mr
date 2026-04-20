import express from 'express';
import { getZkSessionStatus, issueTokensFromZkTLS, logout, receiveProofsHandler, refreshAccess, requireAuth, startHandler } from './auth.js';
import { oauthGoogleCallback, oauthGoogleStart } from './auth_google.js';

const router = express.Router();

// zk-tls routes
router.post('/reclaim/start/:provider', startHandler);
router.post('/reclaim/receive-proofs', receiveProofsHandler);
router.get('/reclaim/session/:id/status', getZkSessionStatus);

// jwt routes
router.post('/token', issueTokensFromZkTLS); // after zkTLS session verified
router.post('/refresh', refreshAccess);
router.post('/logout', logout);

// google oauth
router.get('/oauth/google/start', oauthGoogleStart);
router.get('/oauth/google/callback', oauthGoogleCallback);

router.get('/me', requireAuth, (req, res) => {
	res.json({ ok: true, user: (req as any).user });
});

export { router as authRoutes };
