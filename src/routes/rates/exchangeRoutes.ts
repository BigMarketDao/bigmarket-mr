import express from 'express';
import { getExchangeRates } from './rates_utils.js';

const router = express.Router();

router.get('/rates', async (req, res) => {
	const data = await getExchangeRates();
	res.json({ result: data });
});

export { router as exchangeRoutes };
