import express from 'express';
import { getOrCreateMappedAddress } from './crossChainMappingHelpers.js';
import { getBridgeIntent, markIntentSubmitted, registerBridgeIntent, sweepIntentToVault } from './intentRegistryHelper.js';

const router = express.Router();

router.get('/mappings/:sourceChain/:sourceAddress', async (req, res) => {
	const mappedAddress = await getOrCreateMappedAddress(req.params.sourceChain, req.params.sourceAddress);
	res.json({ mappedAddress });
});

router.get('/mappings/:sourceChain/:sourceAddress', async (req, res) => {
	try {
		const mappedAddress = await getOrCreateMappedAddress(req.params.sourceChain, req.params.sourceAddress);

		res.json({ mappedAddress });
	} catch (err: any) {
		console.error('GET /mappings failed', err);
		res.status(500).json({ error: err.message ?? 'Failed to get mapped address' });
	}
});

router.post('/intents', async (req, res) => {
	try {
		const intent = await registerBridgeIntent(req.body);

		res.json(intent);
	} catch (err: any) {
		console.error('POST /intents failed', err);
		res.status(500).json({ error: err.message ?? 'Failed to create bridge intent' });
	}
});

router.post('/intents/:intentId/submitted', async (req, res) => {
	try {
		const intent = await markIntentSubmitted(req.params.intentId, req.body.sourceTxHash);

		res.json(intent);
	} catch (err: any) {
		console.error('POST /intents/:intentId/submitted failed', err);
		res.status(500).json({ error: err.message ?? 'Failed to mark intent submitted' });
	}
});

router.get('/intents/:intentId', async (req, res) => {
	try {
		const intent = await getBridgeIntent(req.params.intentId);

		if (!intent) {
			return res.status(404).json({ error: 'Intent not found' });
		}

		res.json(intent);
	} catch (err: any) {
		console.error('GET /intents/:intentId failed', err);
		res.status(500).json({ error: err.message ?? 'Failed to get bridge intent' });
	}
});

router.post('/intents/:intentId/sweep', async (req, res) => {
	try {
		const result = await sweepIntentToVault(req.params.intentId);

		res.json(result);
	} catch (err: any) {
		console.error('POST /intents/:intentId/sweep failed', err);
		res.status(500).json({ error: err.message ?? 'Failed to sweep intent' });
	}
});

export { router as crossChainRoutes };
