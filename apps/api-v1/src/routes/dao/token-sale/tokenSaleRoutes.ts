import express from 'express';
import { getConfig } from '../../../lib/config.js';
import { getDaoConfig } from '../../../lib/config_dao.js';
import { fetchTokenSaleStages, fetchTokenSaleUserData } from '@mijoco/stx_helpers/dist/index.js';

const router = express.Router();

router.get('/token-sale', async (req, res) => {
	const now = Date.now();
	try {
		const tokenSale = await fetchTokenSaleStages(getConfig().stacksApi, getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_TOKEN_SALE, getConfig().stacksHiroKey);
		res.json(tokenSale);
	} catch (error) {
		console.error('Error fetching contract data:', error);
		res.status(500).json({ error: 'Failed to fetch contract data' });
	}
});

router.get('/:address', async (req, res) => {
	try {
		console.log('token-sale/:address:');
		const tokenSalePurchases = await fetchTokenSaleUserData(getConfig().stacksApi, getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_TOKEN_SALE, req.params.address, undefined, getConfig().stacksHiroKey);
		res.json(tokenSalePurchases);
	} catch (error: any) {
		console.error('Error fetching contract data:', error);
		res.status(500).json({ error: 'Failed to fetch contract data' });
	}
});

export { router as tokenSaleRoutes };
