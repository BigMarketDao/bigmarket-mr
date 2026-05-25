import cron from 'node-cron';
import { crossChainIntentCollection } from '../../lib/data/db_models.js';
import { sweepIntentToVault, type CrossChainIntent } from './intentRegistryHelper.js';
import { getConfig } from '../../lib/config.js';

let running = false;

/**
 * Picks up any `submitted` intents whose mapped address has received USDCx and
 * sweeps them into the vault, crediting the original source address.
 *
 * Runs every 10 seconds. Only active on devnet — harmless to start on other
 * networks because sweepIntentToVault will simply find no submitted intents.
 */
export const runSweepSubmittedIntentsJob = cron.schedule(
	'*/10 * * * * *',
	async () => {
		if (running) return;
		running = true;

		try {
			const network = getConfig().network as string;

			const intents = await crossChainIntentCollection.find<CrossChainIntent>({ status: 'submitted', network }).toArray();
			console.log(`[cross-chain sweep] found ${intents.length} for 'submitted', network ${network} submitted intent(s) ${new Date().toISOString()}`);

			if (intents.length === 0) return;

			for (const intent of intents) {
				try {
					const result = await sweepIntentToVault(intent.intentId);
					console.log(`[cross-chain sweep] swept ${intent.intentId} → txid ${result.sweepTxId}`);
				} catch (err: any) {
					console.warn(`[cross-chain sweep] failed for ${intent.intentId}: ${err.message ?? err}`);
				} finally {
					running = false;
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
