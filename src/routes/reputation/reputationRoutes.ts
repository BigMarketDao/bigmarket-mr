import express from 'express';
import { getReputationData, getUserOverallBalance, getUserTierBalance } from './reputation-helper.js';

const router = express.Router();

router.get('/meta-data', async (req, res) => {
	const data = await getReputationData();
	res.json(data);
});
router.get('/:address', async (req, res) => {
	const data = await getUserOverallBalance(req.params.address);
	res.json({ result: data });
});

router.get('/:tier/:address', async (req, res) => {
	const data = await getUserTierBalance(Number(req.params.tier), req.params.address);
	res.json({ result: data });
});

export { router as reputationRoutes };
