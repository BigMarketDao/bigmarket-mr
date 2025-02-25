import { PredictionMarketCreateEvent } from '@mijoco/stx_helpers';
import { getConfig } from '../../lib/config';

const axios = require('axios');
const { StacksTestnet, makeContractCall, broadcastTransaction } = require('@stacks/transactions');

export async function llmResolveMarkets(markets: PredictionMarketCreateEvent[]) {
	for (const market of markets) {
		const data = {
			market_id: market.marketId,
			title: market.unhashedData.name,
			description: market.unhashedData.description,
			resolution_criteria: market.unhashedData.criterion.criteria,
			outcome_categories: market.marketData.categories,
			sources: market.unhashedData.criterion.sources
		};
		console.log('llmResolveMarkets: sending:', data);

		// Send market data to Python AI for resolution
		const response = await axios.post('http://127.0.0.1:5000/resolve-market', data);
		console.log('llmResolveMarkets: response from langchain:', response);
		if (response.data.resolution !== undefined) {
			await resolveMarketOnChain(market, response.data.resolution);
		}
	}
}

async function resolveMarketOnChain(market: PredictionMarketCreateEvent, outcomeIndex: number) {
	const transaction = await makeContractCall({
		contractAddress: market.votingContract.split('.')[0],
		contractName: market.votingContract.split('.')[0],
		functionName: 'resolve-market',
		functionArgs: [market.marketId, outcomeIndex],
		senderKey: process.env.STACKS_WALLET_KEY,
		network: getConfig().network
	});

	const txResult = await broadcastTransaction(transaction);
	console.log('resolveMarketOnChain: txResult:', txResult);
}
