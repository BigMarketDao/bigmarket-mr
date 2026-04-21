import type {
	MarketDisputeRecord,
	MarketVotingVoteEvent,
	PredictionMarketCreateEvent,
	ResolutionVote
} from '@bigmarket/bm-types';
import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';

export async function getDisputes(): Promise<Array<MarketDisputeRecord> | []> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/disputes`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getDispute(
	marketId: number,
	marketType: number
): Promise<{
	market: PredictionMarketCreateEvent;
	resolutionVote: ResolutionVote;
	marketVotes: Array<MarketVotingVoteEvent>;
}> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/disputes/${marketId}/${marketType}`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}

export async function getVotesByVoterAndMarket(
	votingContract: string,
	voter: string,
	marketId: number
): Promise<Array<MarketVotingVoteEvent> | []> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/disputes/${votingContract}/${voter}/${marketId}`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getVotesByVoterAndProposal(
	votingContract: string,
	proposal: string
): Promise<Array<MarketVotingVoteEvent> | []> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/disputes/${votingContract}/${proposal}`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}
