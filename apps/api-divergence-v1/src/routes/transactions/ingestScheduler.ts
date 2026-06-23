import cron from 'node-cron';
import { ingestAllMarkets } from '../../lib/markets/ingestMarkets.js';
import { defaultKalshiOptions, defaultPolymarketOptions } from './ingest_query.js';

let ingestRunning = false;

/** Every 30 minutes: refresh live Polymarket and Kalshi market lists. */
export const initIngestMarketsJob = cron.schedule(
	'*/30 * * * *',
	async (fireDate) => {
		if (ingestRunning) {
			console.log('[ingestScheduler] skipping run — previous ingest still in progress');
			return;
		}

		ingestRunning = true;
		console.log('[ingestScheduler] running live market ingest at: ' + fireDate);

		try {
			const result = await ingestAllMarkets({
				polymarket: defaultPolymarketOptions(),
				kalshi: defaultKalshiOptions(),
				persist: true
			});
			console.log('[ingestScheduler] polymarket:', {
				mode: result.polymarket.mode,
				fetched: result.polymarket.fetched,
				upserted: result.polymarket.upserted,
				pages: result.polymarket.pages,
				stopReason: result.polymarket.stopReason
			});
			console.log('[ingestScheduler] kalshi:', {
				mode: result.kalshi.mode,
				fetched: result.kalshi.fetched,
				upserted: result.kalshi.upserted,
				pages: result.kalshi.pages,
				stopReason: result.kalshi.stopReason
			});
		} catch (err) {
			console.error('[ingestScheduler] failed:', err);
		} finally {
			ingestRunning = false;
		}
	},
	{ scheduled: false }
);
