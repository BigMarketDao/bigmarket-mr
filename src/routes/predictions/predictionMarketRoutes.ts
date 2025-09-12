import express from 'express';
import { isCreatePollPostValid, savePoll } from '../polling/polling_helper.js';
import { countCreateMarketEvents, fetchActiveMarketCategories, fetchAllowedTokens, fetchMarket, fetchMarketClaims, fetchMarkets, fetchMarketStakes, fetchMarketVotes, findOpinionPollByTitle, readMinTokenLiquidity } from './markets_helper.js';
import { callContractReadOnly, DaoOverview, fetchContractBalances, fetchTokenSaleStages, GateKeeper, readPredictionContractData, readReputationContractData, StoredOpinionPoll } from '@mijoco/stx_helpers/dist/index.js';
import { getConfig } from '../../lib/config.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { fetchCreateMarketMerkleInput } from '../gating/gating_helper.js';
import { getLeaderBoard } from './leader_board_helper.js';

const router = express.Router();
export let cachedData: DaoOverview | null = null; // simpple cache
let lastFetchTime = 0; // To track the last fetch timestamp
const CACHE_DURATION = 5 * 60 * 1000; // Cache duration in milliseconds (5 minutes)
//const CACHE_DURATION = 30 * 1000; // Cache duration in milliseconds (5 minutes)

router.get('/market-dao-data', async (req, res) => {
	const now = Date.now();
	if (cachedData && now - lastFetchTime < CACHE_DURATION) {
		console.log('Serving from cache');
		res.json(cachedData);
	} else {
		try {
			// Fetch contract data
			const contractData = await readPredictionContractData(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_PREDICTING);
			contractData.marketInitialLiquidity = 100000000;
			// const reputationData = await readReputationContractData(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_REPUTATION_TOKEN);
			//console.log('/market-dao-data: ', reputationData);
			// Fetch contract balances
			await readMinTokenLiquidity(getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_PREDICTING);
			await readMinTokenLiquidity(getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_SCALAR);
			const scalarBalances = await fetchContractBalances(getConfig().stacksApi, `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`);
			const contractBalances = await fetchContractBalances(getConfig().stacksApi, `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_PREDICTING}`);
			const treasuryBalances = await fetchContractBalances(getConfig().stacksApi, `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_TREASURY}`);
			const tokenSale = await fetchTokenSaleStages(getConfig().stacksApi, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_TOKEN_SALE);

			// Update cache
			cachedData = {
				contractData,
				contractBalances,
				scalarBalances,
				treasuryBalances,
				tokenSale
			};
			lastFetchTime = now;

			// Send response
			res.json(cachedData);
		} catch (error) {
			console.error('Error fetching contract data:', error);
			res.status(500).json({ error: 'Failed to fetch contract data' });
		}
	}
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
			//console.log('isCreatePollPostValid: p =', p);
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

router.get('/claims/:marketId/:marketType', async (req, res) => {
	const market = await fetchMarketClaims(Number(req.params.marketId), Number(req.params.marketType));
	res.json(market);
});

router.get('/stakes/:marketId/:marketType', async (req, res) => {
	const market = await fetchMarketStakes(Number(req.params.marketId), Number(req.params.marketType));
	res.json(market);
});

router.get('/count/markets', async (req, res) => {
	let markets = await countCreateMarketEvents(1);
	markets += await countCreateMarketEvents(2);
	res.json(markets);
});

export { router as predictionMarketRoutes };
