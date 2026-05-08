import express from 'express';
import { getOrCreateMappedAddress } from './crossChainMappingHelpers.js';

const router = express.Router();

router.get('/mappings/:sourceChain/:sourceAddress', async (req, res) => {
	const mappedAddress = await getOrCreateMappedAddress(req.params.sourceChain, req.params.sourceAddress);
	res.json({ mappedAddress });
});

export { router as crossChainRoutes };
