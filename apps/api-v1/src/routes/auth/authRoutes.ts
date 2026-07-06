import express from 'express';
import { logout, refreshAccess, requireAuth } from './auth.js';
import { listProviders, oauthCallback, oauthStart } from './oauth/oauth.js';

const router = express.Router();

// OAuth (google, facebook, linkedin, github, twitter)
router.get('/oauth/providers', listProviders);
router.get('/oauth/:provider/start', oauthStart);
router.get('/oauth/:provider/callback', oauthCallback);

// Session
router.post('/refresh', refreshAccess);
router.post('/logout', logout);

router.get('/me', requireAuth, (req, res) => {
	res.json({ ok: true, user: (req as any).user });
});

export { router as authRoutes };
