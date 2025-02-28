import { dataHashSip18, GateKeeper, generateMerkleProof, generateMerkleTreeUsingStandardPrincipal, marketDataToTupleCV, proofToClarityValue, Sip10Data, StoredOpinionPoll } from '@mijoco/stx_helpers/dist/index';
import { getConfig } from '../../lib/config';
import { marketLlmLogsCollection } from '../../lib/data/db_models';
import { fetchAllowedTokens } from '../predictions/markets_helper';
import { getDaoConfig } from '../../lib/config_dao';
import { savePoll } from '../polling/polling_helper';
import { bufferCV, Cl, ClarityValue, contractPrincipalCV, listCV, ListCV, noneCV, someCV, stringAsciiCV, tupleCV, uintCV } from '@stacks/transactions';
import { hexToBytes } from '@stacks/common';
import { fetchCreateMarketMerkleInput } from '../gating/gating_helper';
import { cachedData } from '../predictions/predictionMarketRoutes';
import { llm_markets } from './liverpool';
import { matchMarketSector } from './matchMarketSector';

const axios = require('axios');
const { makeContractCall, broadcastTransaction } = require('@stacks/transactions');

export type CreateMarketByDiscoveryLLMRequest = {
	news_url: string;
};
export type CreateMarketLLMResponse = {
	title: string;
	description: string;
	outcome_categories: Array<string>;
	market_sector: string;
	resolution_criteria: string;
	earliest_resolution_date: string;
	sources: Array<string>;
};

// send user input to python server - await new market response
export async function createMarketByDiscovery(proposer: string, source: string): Promise<StoredOpinionPoll> {
	// const response = await axios.post(`${getConfig().llmServer}/discover-markets`, {
	// 	news_url: source
	// });
	const markets: CreateMarketLLMResponse[] = llm_markets; //response.data.markets;
	console.log('llmResolveMarket: createMarketByDiscovery: ', markets);
	// if (response.data.resolution !== undefined) {
	// 	await marketLlmLogsCollection.insertOne(llmResponse);
	// 	await createMarketOnChain(proposer, llmResponse);
	// }
	return convertMarketToLocalFormat(proposer, markets[0]);
}

export async function createMarketBySuggestion(proposer: string, userIdea: string): Promise<StoredOpinionPoll> {
	// const response = await axios.post(`${getConfig().llmServer}/create-market`, {
	// 	user_idea: userIdea
	// });
	const llmResponse: CreateMarketLLMResponse = llm_markets[1]; //response.data;
	console.log('llmResolveMarket: createMarketBySuggestion: ', llmResponse);
	// if (response.data.resolution !== undefined) {
	// 	await marketLlmLogsCollection.insertOne(llmResponse);
	// 	await createMarketOnChain(proposer, llmResponse);
	// }
	return convertMarketToLocalFormat(proposer, llmResponse);
}

async function createMarketOnChain(proposer: string, data: CreateMarketLLMResponse) {
	const market = await convertMarketToLocalFormat(proposer, data);
	await savePoll(market);

	const transaction = await makeContractCall({
		contractAddress: getDaoConfig().VITE_DOA_DEPLOYER,
		contractName: getDaoConfig().VITE_DAO_MARKET_PREDICTING,
		functionName: 'create-market',
		functionArgs: await getArgsCV(proposer, market),
		senderKey: getConfig().walletKey,
		network: getConfig().network
	});
	const txResult = await broadcastTransaction(transaction);
	console.log('resolveMarketOnChain: txResult:', txResult);
}

async function convertMarketToLocalFormat(proposer: string, llmResponse: CreateMarketLLMResponse): Promise<StoredOpinionPoll> {
	const tokens = await fetchAllowedTokens();
	const stxToken = tokens.find((t) => t.token.indexOf('wrapped-stx') > -1);
	if (!stxToken) throw new Error('warapped stx token not found');

	const marketMeta = {
		name: llmResponse.title,
		description: llmResponse.description,
		category: await matchMarketSector(llmResponse.market_sector),
		criterion: {
			resolvesAt: new Date(llmResponse.earliest_resolution_date).getTime(),
			sources: llmResponse.sources,
			criteria: llmResponse.resolution_criteria
		},
		outcomes: llmResponse.outcome_categories,
		startBurnHeight: 0,
		endBurnHeight: 0,
		createdAt: new Date().getTime(),
		proposer,
		treasury: `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_TREASURY}`,
		token: stxToken.token,
		merkelRoot: '',
		contractIds: [],
		logo: generateMarketLogo(llmResponse.title, llmResponse.market_sector),
		social: {
			twitter: { projectHandle: 'Stacks' },
			discord: { serverId: '1306302974515089510' },
			website: { url: 'https://www.stacks.co/' }
		},
		marketType: 1,
		marketFee: 200,
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

function generateMarketLogo(title: string, marketSector: string): string {
	// Limit title to avoid long text
	const shortTitle = title.length > 12 ? title.substring(0, 12) + '...' : title;

	// Randomly select a background color based on the sector
	const sectorColors: Record<string, string> = {
		politics: '#ff4d4d', // Red
		crypto: '#ffcc00', // Yellow
		sports: '#00cc99', // Green
		economy: '#007bff', // Blue
		technology: '#8c52ff', // Purple
		miscellaneous: '#999999' // Gray
	};

	const backgroundColor = sectorColors[marketSector.toLowerCase()] || '#999999';

	// Generate the SVG logo
	return `
    <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <text x="50%" y="50%" font-size="20" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${shortTitle}
        </text>
    </svg>
    `;
}

const getArgsCV = async (proposer: string, examplePoll: StoredOpinionPoll) => {
	const marketFeeCV = examplePoll.marketFee === 0 ? noneCV() : someCV(uintCV((examplePoll.marketFee || 0) * 100));
	const metadataHash = bufferCV(hexToBytes(examplePoll.objectHash)); // Assumes the hash is a string of 32 bytes in hex format
	let proof = cachedData?.contractData.creationGated ? await getClarityProofForCreateMarket(proposer) : Cl.list([]);
	if (examplePoll.marketType === 2) {
		const cats = listCV(examplePoll.marketTypeDataScalar!.map((o) => tupleCV({ min: uintCV(o.min), max: uintCV(o.max) })));
		return [cats, marketFeeCV, contractPrincipalCV(examplePoll.token.split('.')[0], examplePoll.token.split('.')[1]), metadataHash, proof, Cl.principal(examplePoll.treasury), noneCV(), noneCV(), stringAsciiCV(examplePoll.priceFeedId!)];
	} else {
		const cats = listCV(examplePoll.marketTypeDataCategorical!.map((o) => stringAsciiCV(o.label)));
		return [cats, marketFeeCV, contractPrincipalCV(examplePoll.token.split('.')[0], examplePoll.token.split('.')[1]), metadataHash, proof, Cl.principal(examplePoll.treasury)];
	}
};

export async function getClarityProofForCreateMarket(proposer: string): Promise<ListCV<ClarityValue>> {
	const gateKeeper: GateKeeper = await fetchCreateMarketMerkleInput();
	const { tree, root } = generateMerkleTreeUsingStandardPrincipal(gateKeeper.merkleRootInput);

	const { proof, valid } = generateMerkleProof(tree, cachedData?.contractData.resolutionAgent || proposer);
	if (!valid) throw new Error('Invalid proof - user will be denied this operation in contract');
	return proofToClarityValue(proof);
}
const defToken: Sip10Data = {
	symbol: 'BIG',
	name: 'BitcoinDAO Governance Token',
	decimals: 6,
	balance: 0,
	tokenUri: '',
	totalSupply: 0
};
