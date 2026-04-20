import { dataHashSip18, fetchStacksInfo, GateKeeper, generateMerkleProof, generateMerkleTreeUsingStandardPrincipal, marketDataToTupleCV, proofToClarityValue, Sip10Data, StacksInfo, StoredOpinionPoll } from '@mijoco/stx_helpers/dist/index.js';
import { getConfig } from '../../lib/config.js';
import { cachedData, fetchAllowedTokens } from '../predictions/markets_helper.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { bufferCV, Cl, ClarityValue, contractPrincipalCV, listCV, ListCV, noneCV, someCV, stringAsciiCV, tupleCV, uintCV } from '@stacks/transactions';
import { hexToBytes } from '@stacks/common';
import { fetchCreateMarketMerkleInput } from '../gating/gating_helper.js';
import { matchMarketSector } from './matchMarketSector.js';
import axios from 'axios';

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
	duration: number;
	coolDown: number;
	sources: Array<string>;
};

// send user input to python server - await new market response
export async function createMarketByDiscovery(proposer: string, source: string): Promise<StoredOpinionPoll> {
	const response = await axios.post(`${getConfig().llmServer}/discover-markets`, {
		news_url: source
	});
	const markets: CreateMarketLLMResponse[] = response.data.markets;
	console.log('llmResolveMarket: createMarketByDiscovery: ', markets);
	// if (response.data.resolution !== undefined) {
	// 	await marketLlmLogsCollection.insertOne(llmResponse);
	// 	await createMarketOnChain(proposer, llmResponse);
	// }
	return convertMarketToLocalFormat(proposer, markets[0]);
}

export async function createMarketBySuggestion(proposer: string, userIdea: string): Promise<StoredOpinionPoll> {
	const response = await axios.post(`${getConfig().llmServer}/create-market`, {
		user_idea: userIdea
	});
	const llmResponse: CreateMarketLLMResponse = response.data;
	console.log('llmResolveMarket: createMarketBySuggestion: ', llmResponse);
	// if (response.data.resolution !== undefined) {
	// 	await marketLlmLogsCollection.insertOne(llmResponse);
	// 	await createMarketOnChain(proposer, llmResponse);
	// }
	return convertMarketToLocalFormat(proposer, llmResponse);
}

async function convertMarketToLocalFormat(proposer: string, llmResponse: CreateMarketLLMResponse): Promise<StoredOpinionPoll> {
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi, getConfig().stacksHiroKey)) || ({} as StacksInfo);
	const current = stacksInfo.burn_block_height;
	const tokens = await fetchAllowedTokens(1);
	const firstToken = tokens[0]; //tokens.find((t) => t.token.indexOf('wrapped-stx') > -1);
	// proper fix require user input
	if (!firstToken) throw new Error('warapped stx token not found');

	const ms = new Date(llmResponse.earliest_resolution_date).getTime();
	const days = (ms - Date.now()) / (1000 * 60 * 60 * 24);
	const blocks = Math.round(days * 144);

	const marketMeta = {
		name: llmResponse.title,
		description: llmResponse.description,
		category: await matchMarketSector(llmResponse.market_sector),
		outcomes: llmResponse.outcome_categories,
		createdAt: new Date().getTime(),
		proposer,
		treasury: `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_TREASURY}`,
		token: firstToken.token,
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
		processed: false,
		liquidity: firstToken.minLiquidity || 0,
		criterionDays: { duration: blocks, coolDown: 144, startHeight: current, earliest_resolution_date: llmResponse.earliest_resolution_date },
		criterionSources: { criteria: llmResponse.resolution_criteria, sources: llmResponse.sources }
	} as StoredOpinionPoll;
	const tupleMessage = marketDataToTupleCV(marketMeta.name, marketMeta.category, marketMeta.createdAt, marketMeta.proposer, marketMeta.token);
	const dataHash = dataHashSip18(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, tupleMessage);
	marketMeta.objectHash = dataHash;
	return marketMeta;
}

function generateMarketLogo(title: string, marketSector: string): string {
	// Limit title to avoid long text
	const shortTitle = `Logo for prediction market ${title.length > 12 ? title.substring(0, 12) + '...' : title}`;

	// Randomly select a background color based on the sector
	// const sectorColors: Record<string, string> = {
	// 	politics: '#ff4d4d', // Red
	// 	crypto: '#ffcc00', // Yellow
	// 	sports: '#00cc99', // Green
	// 	economy: '#007bff', // Blue
	// 	technology: '#8c52ff', // Purple
	// 	miscellaneous: '#999999' // Gray
	// };

	// const backgroundColor = sectorColors[marketSector.toLowerCase()] || '#999999';

	// Generate the SVG logo
	return `https://bigmarket.ai/holding_image.png`;
	// <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
	//     <rect width="100%" height="100%" fill="${backgroundColor}"/>
	//     <text x="50%" y="50%" font-size="20" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">
	//         ${shortTitle}
	//     </text>
	// </svg>
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
	console.log('getClarityProofForCreateMarket: proposer: ' + proposer);
	console.log('getClarityProofForCreateMarket: resolutionAgent: ' + cachedData?.contractData.resolutionAgent);
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
