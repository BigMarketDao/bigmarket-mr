import express from 'express';
import { trackTransaction } from './transactions_helper.js';

const router = express.Router();

router.get('/:txid', async (req, res) => {
	const data = await trackTransaction(req.params.txid);
	res.json(data);
});

export { router as transactionRoutes };
