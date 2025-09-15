import { dataHashSip18, fetchStacksInfo, GateKeeper, getArgsCV, getStacksNetwork, marketDataToTupleCV, PredictionMarketCreateEvent, ScalarMarketDataItem, StoredOpinionPoll } from '@mijoco/stx_helpers/dist/index.js';
import { type StacksInfo } from '@mijoco/stx_helpers/dist/index.js';
import { getConfig } from '../../lib/config.js';
import { broadcastTransaction, bufferCV, Cl, makeContractCall, PostConditionMode } from '@stacks/transactions';
import { getDaoConfig } from '../../lib/config_dao.js';
import { daoEventCollection } from '../../lib/data/db_models.js';
import { estimateBitcoinBlockTime, formatFiat } from '../../lib/utils.js';
import { getExchangeRates } from '../rates/rates_utils.js';
import { savePoll } from '../polling/polling_helper.js';
import { fetchAllowedTokens } from '../predictions/markets_helper.js';
import { cachedData } from '../predictions/predictionMarketRoutes.js';
import { hexToBytes } from '@stacks/common';
import { fetchCreateMarketMerkleInput } from '../gating/gating_helper.js';

const bitcoinLogo = 'https://media.istockphoto.com/id/1139020309/vector/bitcoin-internet-money-icon-vector.jpg?s=612x612&w=0&k=20&c=vcRUEDzhndMOctdM7PN1qmipo5rY_aOByWFW0IkW8bs=';
const stacksLogo =
	'data:image/jpeg;base64,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';
const solanaLogo =
	'data:image/jpeg;base64,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';
const ethereumLogo =
	'https://imgs.search.brave.com/407eBc_NyJXq4f7Nu1majY3MV2_Yy7FyIA6OTzSsOiw/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/cHJlbWl1bS1waG90/by9ldGhlcmV1bS10/b2tlbi13aXRoLWJy/aWdodC1nbG93aW5n/LWZ1dHVyaXN0aWMt/b3JhbmdlLW5lb24t/bGlnaHRzLWJsYWNr/LWJhY2tncm91bmQt/M2QtcmVuZGVyXzk4/OTgyMi0zNzU1Lmpw/Zz9zZW10PWFpc19o/eWJyaWQ';
const COOL_DOWN = 2 * 144;
const DURATION = 18 * 144;
const DAI_MULTIPLIER = 100000000;
const PYTH_MULTIPLIER = 100000000;
export const ORACLE_MULTIPLIER = PYTH_MULTIPLIER;
const STXUSD = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17';
const BTCUSD = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
const SOLUSD = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
const ETHUSD = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';

export async function sweepAndResolveScalarMarkets(): Promise<Array<PredictionMarketCreateEvent>> {
	console.log('================================================');
	console.log('sweepAndResolveScalarMarkets: starting task');
	const markets = (await daoEventCollection.find({ 'marketData.resolutionState': 0, event: 'create-market', marketType: 2 }).toArray()) as unknown as Array<PredictionMarketCreateEvent>;
	const resolvedMarkets: PredictionMarketCreateEvent[] = [];
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
	const blockHeight = stacksInfo.burn_block_height;
	for (const market of markets) {
		if (market.marketId === 2) continue;
		const endCool = market.marketData.marketStart! + market.marketData.marketDuration! + market.marketData.coolDownPeriod!;
		if (blockHeight >= endCool) {
			const rm = await resolveScalarMarketOnChain(market);
			if (rm) resolvedMarkets.push(rm);
			await sleep(30000);
		}
	}
	return resolvedMarkets;
}

export async function resolveUndisputedScalarMarketsOnChain(): Promise<Array<PredictionMarketCreateEvent>> {
	console.log('================================================');
	console.log('resolveUndisputedScalarMarketsOnChain: starting task');
	const markets = (await daoEventCollection.find({ 'marketData.resolutionState': 1, event: 'create-market' }).toArray()) as unknown as Array<PredictionMarketCreateEvent>;
	const resolvedMarkets: PredictionMarketCreateEvent[] = [];
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
	const blockHeight = stacksInfo.burn_block_height;

	for (const market of markets) {
		try {
			const endDispute = market.marketData.marketStart! + market.marketData.marketDuration! + market.marketData.coolDownPeriod! + (cachedData?.contractData.disputeWindowLength || 144);
			if (blockHeight >= endDispute) {
				const rm = await resolveUndisputedMarketOnChain(market);
				if (rm) resolvedMarkets.push(rm);
				console.log('resolveUndisputedScalarMarketsOnChain: market: ' + market.extension.split('.')[1] + ':' + market.marketId + ' ' + market.unhashedData.name);
				await sleep(30000);
			}
		} catch (err: any) {
			console.log('resolveUndisputedScalarMarketsOnChain: error: ', err);
		}
	}
	return resolvedMarkets;
}

export async function createScalarMarketsOnChain(chain: number) {
	await createMarketOnChain(chain);
}

async function getMetaData(chain: number, endBlockHeight: number, ends: string) {
	const rates = await getExchangeRates();
	const rate = rates.find((o) => o.currency === 'USD');
	if (!rate) throw new Error('Unable to cretae market without rates');
	const btcPrice = rate.fifteen;
	const stxPrice = rate.stxToBtc * btcPrice;
	const ethPrice = rate.ethToBtc * btcPrice;
	const solPrice = rate.solToBtc * btcPrice;
	let coin = 'BTC';
	let price = formatFiat(btcPrice);
	let priceFeedId = BTCUSD;
	let cats = generateOutcomeCategories(btcPrice, 0.01);
	let logo = bitcoinLogo;

	if (chain === 2) {
		coin = 'STX';
		price = formatFiat(stxPrice);
		cats = generateOutcomeCategories(stxPrice, 0.06);
		priceFeedId = STXUSD;
		logo = stacksLogo;
	} else if (chain === 3) {
		coin = 'SOL';
		price = formatFiat(solPrice);
		cats = generateOutcomeCategories(solPrice, 0.04);
		priceFeedId = SOLUSD;
		logo = solanaLogo;
	} else if (chain === 4) {
		coin = 'ETH';
		price = formatFiat(ethPrice);
		cats = generateOutcomeCategories(ethPrice, 0.04);
		priceFeedId = ETHUSD;
		logo = ethereumLogo;
	}

	return {
		title: `${coin} Price Prediction at Bitcoin Block Height: ${endBlockHeight.toLocaleString('en-US')}`,
		description: `Predicting the price of ${coin} at bitcoin block height ${endBlockHeight.toLocaleString('en-US')}, which is expected around ${ends}.<br/><br/>Price at time of posting: ${price}. The price will resolve into one of several ranges at that time. The market has two phases: Active: Users can stake. Cool down: Staking closes, the final price is determined at the end of one day (approx) cool down.`,
		outcome_categories: cats,
		marketType: 2,
		logo,
		priceFeedId,
		criterion: {
			resolvesAt: new Date(ends).getTime(),
			sources: ['Pyth Oracle'],
			criteria: `How the market resolves<br/><br/>BigMarket use the official Pyth price feed oracle on the Stacks blockchain to determine the final ${coin} price, at bitcoin block ${endBlockHeight.toLocaleString('en-US')}. The result is taken after the cool down period and locked in on-chain for full transparency.`
		}
	};
}
export async function fetchScalarMarketData(chain: number): Promise<StoredOpinionPoll> {
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
	const current = stacksInfo.burn_block_height;
	const endCooling = current + DURATION + COOL_DOWN;
	const ends = estimateBitcoinBlockTime(endCooling, current);
	const meta = await getMetaData(chain, endCooling, ends);
	const market = await convertMarketToLocalFormat(meta);
	return market;
}

async function createMarketOnChain(chain: number): Promise<any> {
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
	const current = stacksInfo.burn_block_height;
	const endCooling = current + DURATION + COOL_DOWN;
	const ends = estimateBitcoinBlockTime(endCooling, current);
	const meta = await getMetaData(chain, endCooling, ends);
	console.log('createMarketOnChain: getArgsCV: meta: ', meta);
	const market = await convertMarketToLocalFormat(meta);
	await savePoll(market);
	const network = getStacksNetwork(getConfig().network);
	console.log('createMarketOnChain: network: ' + network);
	const gateKeeper: GateKeeper = await fetchCreateMarketMerkleInput();
	console.log('gateKeeper: ', gateKeeper);
	console.log('market.priceFeedId: ' + market.priceFeedId);
	console.log('market.token: ' + market.token);
	console.log('market.treasury: ' + market.treasury);
	console.log('market.marketFee: ' + market.marketFee);
	console.log('market.objectHash: ' + market.objectHash);

	const fa = await getArgsCV(
		gateKeeper,
		cachedData?.contractData.creationGated || false,
		market.token,
		market.treasury,
		'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY',
		market.marketFee,
		market.objectHash,
		100000000,
		meta.priceFeedId!, //market.marketType === 2 ? market.priceFeedId! : market.marketTypeDataCategorical!
		DURATION,
		endCooling
	);

	const transaction = await makeContractCall({
		postConditions: [],
		postConditionMode: PostConditionMode.Allow,
		contractAddress: getDaoConfig().VITE_DOA_DEPLOYER,
		contractName: getDaoConfig().VITE_DAO_MARKET_SCALAR,
		functionName: 'create-market',
		functionArgs: fa,
		senderKey: getConfig().walletKey,
		network
	});
	const txResult = await broadcastTransaction({ transaction });
	console.log('createMarketOnChain: txResult:', txResult);
	return txResult;
}

// const getArgsCV = async (priceFeeId: string, examplePoll: StoredOpinionPoll) => {
// 	const proposer = 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY'; //getDaoConfig().VITE_DOA_DEPLOYER;
// 	const marketFeeCV = examplePoll.marketFee === 0 ? Cl.none() : Cl.some(Cl.uint((examplePoll.marketFee || 0) * 100));
// 	const metadataHash = bufferCV(hexToBytes(examplePoll.objectHash)); // Assumes the hash is a string of 32 bytes in hex format
// 	//let proof = cachedData?.contractData.creationGated ? await getClarityProofForCreateMarket(proposer) : Cl.list([]);
// 	let proof = await getClarityProofForCreateMarket(proposer);
// 	if (cachedData && !cachedData.contractData.creationGated) proof = Cl.list([]);
// 	const genCats = examplePoll!.outcomes as Array<ScalarMarketDataItem>;
// 	console.log('resolveCategoricalMarket: getArgsCV: cachedData?.contractData: ', cachedData?.contractData);
// 	console.log('resolveCategoricalMarket: getArgsCV: proof: ', proof);
// 	const cats = listCV(genCats.map((o) => Cl.tuple({ min: Cl.uint(o.min), max: Cl.uint(o.max) })));
// 	return [
// 		cats,
// 		marketFeeCV,
// 		Cl.contractPrincipal(examplePoll.token.split('.')[0], examplePoll.token.split('.')[1]),
// 		metadataHash,
// 		proof,
// 		Cl.principal(examplePoll.treasury),
// 		Cl.some(Cl.uint(6 * 144)),
// 		Cl.none(),
// 		Cl.bufferFromHex(priceFeeId),
// 		Cl.uint(100000000)
// 	];
// };

async function convertMarketToLocalFormat(meta: any): Promise<StoredOpinionPoll> {
	const tokens = await fetchAllowedTokens(1);
	const stxToken = tokens.find((t) => t.token.indexOf('wrapped-stx') > -1);
	if (!stxToken) throw new Error('warapped stx token not found');

	const marketMeta = {
		name: meta.title,
		marketType: 2,
		priceFeedId: meta.priceFeedId,
		description: meta.description,
		category: 'crypto',
		criterion: meta.criterion,
		outcomes: meta.outcome_categories,
		logo: meta.logo,

		startBurnHeight: 0,
		endBurnHeight: 0,
		createdAt: new Date().getTime(),
		proposer: getDaoConfig().VITE_DOA_DEPLOYER,
		treasury: `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_TREASURY}`,
		token: stxToken.token,
		merkelRoot: '',
		contractIds: [],
		social: {
			twitter: { projectHandle: 'Stacks' },
			discord: { serverId: '1306302974515089510' },
			website: { url: 'https://www.stacks.co/' }
		},
		marketFee: 2,
		objectHash: '',
		signature: '',
		publicKey: '',
		featured: true,
		processed: false
	};
	const tupleMessage = marketDataToTupleCV(marketMeta.name, marketMeta.category, marketMeta.createdAt, marketMeta.proposer, marketMeta.token);
	const dataHash = dataHashSip18(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, tupleMessage);
	marketMeta.objectHash = dataHash;
	return marketMeta;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolveScalarMarketOnChain(market: PredictionMarketCreateEvent) {
	if (market.extension !== `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`) throw new Error('Scalar market resolution only: ' + market.unhashedData.name);
	const network = getStacksNetwork(getConfig().network);
	console.log('resolveScalarMarketOnChain: resolving market: ' + market.extension.split('.')[1] + ':' + market.marketId + ' ' + market.unhashedData.name);
	const transaction = await makeContractCall({
		network,
		contractAddress: market.extension.split('.')[0],
		contractName: market.extension.split('.')[1],
		functionName: 'resolve-market',
		functionArgs: [Cl.uint(market.marketId)],
		senderKey: getConfig().walletKey
	});
	const txResult = await broadcastTransaction({ transaction });
	console.log('resolveScalarMarketOnChain: tx sent: ' + market.extension.split('.')[1] + ':' + market.marketId + ' ' + market.unhashedData.name, txResult);
	return market;
}

async function resolveUndisputedMarketOnChain(market: PredictionMarketCreateEvent) {
	if (market.extension !== `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`) throw new Error('Scalar market resolution only: ' + market.unhashedData.name);
	const network = getStacksNetwork(getConfig().network);
	console.log('resolveUndisputedScalarMarketOnChain: market: ' + market.marketId + ':' + market.marketType + ' : ' + market.unhashedData.name);
	const transaction = await makeContractCall({
		network,
		contractAddress: market.extension.split('.')[0],
		contractName: market.extension.split('.')[1],
		functionName: 'resolve-market-undisputed',
		functionArgs: [Cl.uint(market.marketId)],
		senderKey: getConfig().walletKey
	});
	const txResult = await broadcastTransaction({ transaction });
	console.log('resolveUndisputedMarketOnChain: tx sent: ' + market.extension.split('.')[1] + ':' + market.marketId + ' ' + market.unhashedData.name, txResult);
	return market;
}

function generateOutcomeCategories(price: number, variance: number): Array<ScalarMarketDataItem> {
	const step = price * variance; // 5% increment
	const categories = [];
	for (let i = -2; i <= 2; i++) {
		const min = Math.round((price + (i - 1) * step) * ORACLE_MULTIPLIER);
		const max = Math.round((price + i * step) * ORACLE_MULTIPLIER);
		categories.push({ min, max });
	}
	return categories;
}
