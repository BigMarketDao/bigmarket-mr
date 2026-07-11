import cron from 'node-cron';
import { crossChainIntentCollection } from '../../lib/data/db_models.js';
import { confirmSweepTx, sweepIntentToVault, type CrossChainIntent } from './intentRegistryHelper.js';
import { getConfig } from '../../lib/config.js';

let running = false;

/**
 * Every 10 seconds:
 * 1. Confirm any already-broadcast (pending-confirm) sweep txs — resets to 'submitted' on failure.
 * 2. Attempt to sweep 'submitted'/'created' intents whose mapped address now has a USDCx balance.
 */
export const runSweepSubmittedIntentsJob = cron.schedule(
	'*/10 * * * * *',
	async () => {
		if (running) return;
		running = true;

		try {
			const network = getConfig().network as string;

			const [pendingIntents, confirmIntents] = await Promise.all([
				crossChainIntentCollection
					.find<CrossChainIntent>({ status: { $in: ['submitted', 'created'] }, network })
					.toArray(),
				crossChainIntentCollection
					.find<CrossChainIntent>({ status: 'pending-confirm', network })
					.toArray()
			]);

			if (pendingIntents.length + confirmIntents.length === 0) return;

			console.log(`[cross-chain sweep] ${pendingIntents.length} pending, ${confirmIntents.length} confirming on ${network}`);

			// Confirm already-broadcast txs first — frees up any that failed on-chain.
			for (const intent of confirmIntents) {
				try {
					const result = await confirmSweepTx(intent.intentId);
					console.log(`[cross-chain confirm] ${intent.intentId} → ${result.status}`);
				} catch (err: any) {
					console.warn(`[cross-chain confirm] failed for ${intent.intentId}: ${err.message ?? err}`);
				}
			}

			// Sweep new intents whose balance has arrived.
			for (const intent of pendingIntents) {
				try {
					const result = await sweepIntentToVault(intent.intentId);
					if ('skipped' in result && result.skipped) {
						console.log(`[cross-chain sweep] waiting on balance for ${intent.intentId}: ${result.reason}`);
					} else {
						console.log(`[cross-chain sweep] broadcast ${intent.intentId} → txid ${result.sweepTxId}`);
					}
				} catch (err: any) {
					console.warn(`[cross-chain sweep] failed for ${intent.intentId}: ${err.message ?? err}`);
				}
			}
		} catch (err: any) {
			console.error('[cross-chain sweep] job error:', err.message ?? err);
		} finally {
			running = false;
		}
	},
	{ scheduled: false }
);
