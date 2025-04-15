import express from 'express';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { fetchBalanceAtTier, readReputationContractData, readUserReputationContractData } from '@mijoco/stx_helpers/dist/index.js';

const router = express.Router();

router.get('/meta-data', async (req, res) => {
	const data = await readReputationContractData(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_REPUTATION_TOKEN);
	res.json(data);
});

router.get('/:address', async (req, res) => {
	const data = await readUserReputationContractData(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_REPUTATION_TOKEN, req.params.address);
	res.json({ result: data });
});

router.get('/:tier/:address', async (req, res) => {
	const data = await fetchBalanceAtTier(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_REPUTATION_TOKEN, req.params.address, Number(req.params.tier));
	res.json({ result: data });
});

export { router as reputationRoutes };
