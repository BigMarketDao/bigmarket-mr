import express from 'express';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { getReputationLeaderBoard, getTotalSupplies, getTotalWeightedSupply, getUserReputationContractData, runBatchClaimSweep } from './reputation-helper.js';
import { readReputationContractData } from '../predictions/reputation_data.js';
import { stacks } from '@bigmarket/sdk';

const router = express.Router();

router.get('/batch-claims', async (req, res) => {
	const data = await runBatchClaimSweep();
	res.json(data);
});

router.get('/leader-board', async (req, res) => {
	const data = await getReputationLeaderBoard();
	res.json(data);
});

router.get('/meta-data', async (req, res) => {
	const data = await readReputationContractData(getDaoConfig(), getConfig().stacksApi, 1, getConfig().stacksHiroKey);
	console.log('/meta-data', data);
	const ts = await getTotalSupplies();
	console.log('/meta-data ts', ts);
	const weightedSupply = await getTotalWeightedSupply();
	data.totalSupplies = ts;
	data.weightedSupply = weightedSupply;
	res.json(data);
});

router.get('/:address', async (req, res) => {
	const data = await getUserReputationContractData(req.params.address);
	res.json(data);
});

router.get('/:tier/:address', async (req, res) => {
	const balanceAtTier = await stacks.createReputationClient(getDaoConfig()).fetchBalanceAtTier(getConfig().stacksApi, Number(req.params.tier), req.params.address, getConfig().stacksHiroKey);
	res.json(balanceAtTier);
});

export { router as reputationRoutes };
