/**
 * One-off: report auth users missing email/sub after pre-profile OAuth rollout.
 *
 * Emails cannot be backfilled without a fresh OAuth login — run this to see
 * how many accounts still need a sign-in after deploying profile sync on login.
 *
 * Usage:
 *   NODE_ENV=mainnet pnpm exec tsx src/scripts/backfill-auth-profile-fields.ts
 */
import { connect, authProviderAccountCollection, authUserCollection } from '../lib/data/db_models.js';
import { setConfigOnStart } from '../lib/config.js';

setConfigOnStart();

async function main() {
	await connect();

	const missingEmailUsers = await authUserCollection.countDocuments({
		$or: [{ email: { $exists: false } }, { email: null }]
	});
	const missingEmailProviders = await authProviderAccountCollection.countDocuments({
		$or: [{ email: { $exists: false } }, { email: null }]
	});
	const missingSubProviders = await authProviderAccountCollection.countDocuments({
		$or: [{ sub: { $exists: false } }, { sub: null }]
	});
	const totalUsers = await authUserCollection.countDocuments();
	const totalProviders = await authProviderAccountCollection.countDocuments();

	console.log('Auth profile backfill report');
	console.log('----------------------------');
	console.log(`authUserCollection total:              ${totalUsers}`);
	console.log(`authUserCollection missing email:      ${missingEmailUsers}`);
	console.log(`authProviderAccountCollection total:   ${totalProviders}`);
	console.log(`authProviderAccountCollection no email: ${missingEmailProviders}`);
	console.log(`authProviderAccountCollection no sub:   ${missingSubProviders}`);
	console.log('');
	console.log('These accounts will populate on next OAuth sign-in (profile sync on login).');
	console.log('No automatic backfill is possible without provider tokens.');

	const samples = await authProviderAccountCollection
		.find({ $or: [{ email: { $exists: false } }, { email: null }] })
		.project({ providerId: 1, subjectHash: 1, userId: 1, lastVerifiedAt: 1 })
		.limit(10)
		.toArray();
	if (samples.length) {
		console.log('');
		console.log('Sample provider accounts still missing email:');
		for (const row of samples) {
			console.log(`  ${row.providerId} userId=${row.userId} lastVerified=${row.lastVerifiedAt}`);
		}
	}

	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
