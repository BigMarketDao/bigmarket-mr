import express from 'express';
import { ObjectId } from 'mongodb';
import { logout, refreshAccess, requireAuth } from './auth.js';
import { listProviders, oauthCallback, oauthStart } from './oauth/oauth.js';
import { authProviderAccountCollection, authUserCollection } from '../../lib/data/db_models.js';

const router = express.Router();

// OAuth (google, facebook, linkedin, github, twitter)
router.get('/oauth/providers', listProviders);
router.get('/oauth/:provider/start', oauthStart);
router.get('/oauth/:provider/callback', oauthCallback);

// Session
router.post('/refresh', refreshAccess);
router.post('/logout', logout);

router.get('/me', requireAuth, async (req, res) => {
	const authUser = (req as any).user;
	const userId = ObjectId.isValid(authUser.id) ? new ObjectId(authUser.id) : authUser.id;
	const pa =
		(authUser.prv
			? await authProviderAccountCollection.findOne({ userId, providerId: authUser.prv })
			: null) ?? (await authProviderAccountCollection.findOne({ userId }));
	const user = await authUserCollection.findOne({ _id: userId });
	res.json({
		ok: true,
		user: {
			id: authUser.id,
			provider: pa?.providerId ?? authUser.prv,
			sub: pa?.sub ?? null,
			email: pa?.email ?? user?.email ?? null,
			emailVerified: pa?.emailVerified ?? user?.emailVerified ?? null,
			name: pa?.name ?? user?.name ?? null,
			picture: pa?.picture ?? user?.picture ?? null
		}
	});
});

export { router as authRoutes };
