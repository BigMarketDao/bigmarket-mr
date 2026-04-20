import type { LeaderBoard, UserReputationContractData } from '@bigmarket/bm-types';

export async function getLeaderBoard(bigMarketApi: string): Promise<LeaderBoard> {
	const path = `${bigMarketApi}/pm/markets/leader-board`;
	const response = await fetch(path);
	const res = (await response.json()) || [];
	return res;
}
export async function getUserReputation(
	bigMarketApi: string,
	address: string
): Promise<UserReputationContractData> {
	const path = `${bigMarketApi}/reputation/${address}`;
	const response = await fetch(path);
	const res = (await response.json()) || 0;
	return res;
}
