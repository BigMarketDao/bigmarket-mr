import express from 'express';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { fetchBalanceAtTier, readReputationContractData } from '@mijoco/stx_helpers/dist/index.js';
import { getReputationLeaderBoard, getTotalSupplies, getTotalWeightedSupply, getUserReputationContractData, runBatchClaimSweep } from './reputation-helper.js';

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
	const data = await readReputationContractData(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_REPUTATION_TOKEN, getConfig().stacksHiroKey);
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
	const data = await fetchBalanceAtTier(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_REPUTATION_TOKEN, req.params.address, Number(req.params.tier), getConfig().stacksHiroKey);
	res.json(data);
});

export { router as reputationRoutes };
