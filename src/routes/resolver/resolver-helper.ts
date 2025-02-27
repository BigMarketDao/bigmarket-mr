import { PredictionMarketCreateEvent, ScalarMarketDataItem } from '@mijoco/stx_helpers';
import { getConfig } from '../../lib/config';
import { daoEventCollection, marketLlmLogsCollection } from '../../lib/data/db_models';
import { fetchMarket } from '../predictions/markets_helper';

const axios = require('axios');
const { StacksTestnet, makeContractCall, broadcastTransaction } = require('@stacks/transactions');

export type MarketLLMRequest = {
	market_id: number;
	market_type: number;
	title: string;
	description: string;
	resolution_criteria: string;
	outcome_categories: Array<string>;
	resolves_at: number;
	sources: Array<string>;
};
export type MarketLLMResponse = {
	market_id: number;
	market_type: number;
	event: 'resolve-market';
	resolution: string;
	prompt: string;
	ai_response: string;
	model: string;
};
export async function sweepAndResolveMarkets(): Promise<Array<PredictionMarketCreateEvent>> {
	const markets = (await daoEventCollection.find({ 'marketData.resolutionState': 0, event: 'create-market' }).toArray()) as Array<PredictionMarketCreateEvent>;
	for (const market of markets) {
		console.log('sweepAndResolveMarkets: ', market);
		await llmResolveMarket(flattenMarket(market));
	}

	return markets;
}

async function sweepAndResolveMarketsTest(): Promise<any> {
	const data = {
		market_id: 2,
		market_type: 1,
		title: 'Eurovision Winner 2025',
		description: 'Who wins Eurovision 2025? Another glitter bomb of talentless noise or a rare gem drowning in sequins and autotune? Europe votes, but does anyone really win?',
		resolution_criteria:
			"If the winner’s a gimmick act, we’ll call it ironic. If it’s an actual talent, we’ll call it rigged. And if it’s Sweden—again—just cancel the whole thing. Eurovision doesn’t crown the best; it crowns the loudest. The real winners? Meme accounts and TikTok thirst traps. Europe unites for one night to argue, cry, and pretend it matters. And we'll all do it again next year.",
		outcome_categories: ['Croatia', 'Sweeden', 'Malta', 'Greec', 'Greece', 'Romania', 'Bulgria', 'Slovenia', 'Italy', 'Austria'],
		resolves_at: 1747496563841,
		sources: ['https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2025']
	};
	const data2 = {
		market_id: 2,
		market_type: 1,
		title: 'Liverpool vs Newcastle United',
		description: 'Will Liverpool extend their lead at the top of the table?',
		resolution_criteria: 'Three possible outcomes: The match is a drawer (select category 0), Liverpool win (select category 1) or Newcastle win (select category 2)',
		outcome_categories: ['drawer', 'Liverpool win', 'Newcastle Win'],
		resolves_at: 1747496563841,
		sources: ['https://www.bbc.co.uk/sport/football/live/ce8j50rn3jyt#Scores']
	};
	const result = await llmResolveMarket(data2);
	return result;
}

function flattenMarket(market: PredictionMarketCreateEvent): MarketLLMRequest {
	const data = {
		market_id: market.marketId,
		market_type: market.marketType,
		title: market.unhashedData.name,
		description: market.unhashedData.description,
		resolution_criteria: market.unhashedData.criterion.criteria,
		outcome_categories: mapToMinMaxStrings(market.marketData.categories),
		resolves_at: market.unhashedData.criterion.resolvesAt,
		sources: market.unhashedData.criterion.sources
	};
	return data;
}
async function llmResolveMarket(data: MarketLLMRequest) {
	console.log('llmResolveMarkets: data:', data);

	// Send market data to Python AI for resolution
	const response = await axios.post('http://127.0.0.1:5000/resolve-market', data);
	const llmResponse: MarketLLMResponse = response.data;
	console.log('llmResolveMarket: llmResponse: ', llmResponse);
	if (response.data.resolution !== undefined) {
		await marketLlmLogsCollection.insertOne(llmResponse);
		await resolveMarketOnChain(data, response.data.resolution);
	}
}

async function resolveMarketOnChain(data: MarketLLMRequest, outcomeIndex: number) {
	const market = await fetchMarket(data.market_id, data.market_type);
	const transaction = await makeContractCall({
		contractAddress: market.votingContract.split('.')[0],
		contractName: market.votingContract.split('.')[0],
		functionName: 'resolve-market',
		functionArgs: [market.marketId, outcomeIndex],
		senderKey: getConfig().walletKey,
		network: getConfig().network
	});
	const txResult = await broadcastTransaction(transaction);
	console.log('resolveMarketOnChain: txResult:', txResult);
}

function mapToMinMaxStrings(data: Array<string | ScalarMarketDataItem>): string[] {
	if (typeof data[0] === 'string') {
		return data as string[]; // Directly return if already an array of strings
	}
	return (data as { min: number; max: number }[]).map((item) => `${item.min},${item.max}`);
}
