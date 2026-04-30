import express from 'express';
import { isCreatePollPostValid, savePoll } from '../polling/polling_helper.js';
import {
	cachedData,
	countCreateMarketEvents,
	fetchActiveMarketCategories,
	fetchAllowedTokens,
	fetchMarket,
	fetchMarketClaims,
	fetchMarketLiquidityEvents,
	fetchMarkets,
	fetchMarketStakes,
	fetchMarketVotes,
	findOpinionPollByTitle,
	readMinTokenLiquidityToken,
	updateDaoOverview
} from './markets_helper.js';
import type { PredictionMarketEventChain } from '@bigmarket/bm-types';

import { GateKeeper, StoredOpinionPoll } from '@mijoco/stx_helpers/dist/index.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { fetchCreateMarketMerkleInput } from '../gating/gating_helper.js';
import { getLeaderBoard } from './leader_board_helper.js';

const router = express.Router();
let lastFetchTime = 0; // To track the last fetch timestamp
const CACHE_DURATION = 2 * 60 * 1000; // Cache duration in milliseconds (5 minutes)
//const CACHE_DURATION = 30 * 1000; // Cache duration in milliseconds (5 minutes)

router.get('/market-dao-data', async (req, res) => {
	const now = Date.now();
	if (!cachedData) {
		await updateDaoOverview();
	}
	lastFetchTime = now;
	res.json(cachedData);
});

router.get('/market-dao-data/update/:address', async (req, res) => {
	const now = Date.now();
	await updateDaoOverview(req.params.address);
	lastFetchTime = now;
	res.json(cachedData);
});

router.get('/market-dao-data/update', async (req, res) => {
	const now = Date.now();
	await updateDaoOverview();
	lastFetchTime = now;
	res.json(cachedData);
});

router.post('/markets', async (req, res) => {
	const { newPoll } = req.body;
	// TODO MJC bug https://github.com/BigMarketDao/bigmarket-ui/issues/40
	const gated = false; //cachedData?.contractData.creationGated || false;
	const data: GateKeeper = await fetchCreateMarketMerkleInput();
	const newPoll1: StoredOpinionPoll = newPoll;
	if (gated && !data.merkleRootInput.includes(newPoll1.proposer)) {
		res.status(401).json({ error: 'no create market privileges' });
	} else {
		if (!(await isCreatePollPostValid(newPoll))) {
			res.status(401).json({ error: 'Invalid request' });
		} else {
			const p = await findOpinionPollByTitle(newPoll.name);
			if (p) {
				res.status(502).json({ error: 'Market with this question already exists' });
			} else {
				//console.log("/markets", newPoll);
				await savePoll(newPoll);
				res.json(newPoll);
			}
		}
	}
});

router.get('/tokens/liquidity/:token', async (req, res) => {
	const scalarMin = await readMinTokenLiquidityToken(getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_SCALAR, req.params.token);
	const categoricalMin = await readMinTokenLiquidityToken(getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_PREDICTING, req.params.token);
	res.json({ scalarMin, categoricalMin });
});

router.get('/markets/leader-board', async (req, res) => {
	const board = await getLeaderBoard();
	res.json(board);
});

router.get('/markets/allowed-tokens', async (req, res) => {
	const polls = await fetchAllowedTokens(1);
	res.json(polls);
});

router.get('/markets/allowed-tokens/:marketType', async (req, res) => {
	const polls = await fetchAllowedTokens(Number(req.params.marketType));
	res.json(polls);
});

router.get('/markets/categories', async (req, res) => {
	const polls = await fetchActiveMarketCategories();
	res.json(polls);
});

router.get('/markets/votes/:marketId/:marketType', async (req, res) => {
	const polls = await fetchMarketVotes(Number(req.params.marketId));
	res.json(polls);
});

router.get('/markets', async (req, res) => {
	const polls = await fetchMarkets();
	res.json(polls);
});

router.get('/markets/:marketId/:marketType', async (req, res) => {
	const market = await fetchMarket(Number(req.params.marketId), Number(req.params.marketType));
	res.json(market);
});

router.get('/market-events/:marketId/:marketType', async (req, res) => {
	const market = await fetchMarket(Number(req.params.marketId), Number(req.params.marketType));
	const claims = await fetchMarketClaims(Number(req.params.marketId), Number(req.params.marketType));
	const stakes = await fetchMarketStakes(Number(req.params.marketId), Number(req.params.marketType));
	const liquidity = await fetchMarketLiquidityEvents(Number(req.params.marketId), Number(req.params.marketType));
	res.json({ market, claims, stakes, liquidity }) as unknown as PredictionMarketEventChain;
});

router.get('/claims/:marketId/:marketType', async (req, res) => {
	const market = await fetchMarketClaims(Number(req.params.marketId), Number(req.params.marketType));
	res.json(market);
});

router.get('/stakes/:marketId/:marketType', async (req, res) => {
	const market = await fetchMarketStakes(Number(req.params.marketId), Number(req.params.marketType));
	res.json(market);
});

router.get('/liquidity/:marketId/:marketType', async (req, res) => {
	const market = await fetchMarketLiquidityEvents(Number(req.params.marketId), Number(req.params.marketType));
	res.json(market);
});

router.get('/count/markets', async (req, res) => {
	let markets = await countCreateMarketEvents(1);
	markets += await countCreateMarketEvents(2);
	res.json(markets);
});

export { router as predictionMarketRoutes };
