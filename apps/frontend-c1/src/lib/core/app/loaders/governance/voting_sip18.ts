import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
import { getStxAddress } from '@bigmarket/bm-common';
import { stacks } from '@bigmarket/sdk';
import {
	type Auth,
	type BaseAdminMessage,
	type Domain,
	type SignatureData,
	type VoteMessage,
	type VotingEventProposeProposal
} from '@bigmarket/bm-types';
import type { AppConfig } from '@bigmarket/bm-config';

export const ADMIN_MESSAGE = 'please sign this message to authorise DAO management task.';
export function getDomain(appConfig: AppConfig): Domain {
	return {
		network: appConfig.VITE_NETWORK,
		appName: appConfig.VITE_PUBLIC_APP_NAME,
		appVersion: appConfig.VITE_PUBLIC_APP_VERSION
	};
}
async function fetchTimestamp() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/sip18-voting/timestamp`;
	const response = await fetch(path);
	const res = await response.json();
	return res.serverTime;
}

export async function fetchSip18Votes(proposal: string) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/sip18-voting/votes/${proposal}`;
	const response = await fetch(path);
	if (response.status === 404) return 'not found';
	const res = await response.json();
	return res;
}

// export async function submitSip18Votes(
// 	proposal: VotingEventProposeProposal,
// 	votes: Array<StoredVoteMessage>
// ) {
// 	const client = requireDaoGovernanceClient(get(daoConfigStore));
// 	const response = await client.batchVote(proposal.extension, proposal.proposal, votes);
// 	return response.success ? response.txid : undefined;
// }

export async function postVoteMessage(
	hash: string,
	auth: { message: VoteMessage; signature: SignatureData }
) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/sip18-voting/votes/${hash}`;
	const response = await fetch(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: '' },
		body: JSON.stringify(auth)
	});
	if (response.status >= 400 && response.status < 500) return 'not allowed';
	else if (response.status >= 500) return 'error on server';
	const res = await response.json();
	return res;
}

export async function signAdminMessage(): Promise<Auth | undefined> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const adminMessage: BaseAdminMessage = {
		message: ADMIN_MESSAGE,
		timestamp: new Date().getTime(),
		admin: getStxAddress()
	};
	const domain = getDomain(appConfig);
	const signature = await stacks.requestAdminSignature(adminMessage, domain);
	if (signature?.signature && signature?.publicKey) {
		stacks.verifyBaseAdminSignature(
			domain,
			adminMessage,
			signature?.signature,
			signature?.publicKey
		);
		return { message: adminMessage, signature };
	}
}
export async function newVoteMessage(
	proposal: VotingEventProposeProposal,
	vote: boolean,
	amount: number,
	voter: string
): Promise<VoteMessage> {
	const ts = await fetchTimestamp();
	return {
		attestation: vote ? 'I vote in favour of the proposal' : 'I vote against the proposal',
		proposal: proposal.proposal,
		timestamp: ts,
		vote,
		voter,
		voting_power: amount
	};
}
