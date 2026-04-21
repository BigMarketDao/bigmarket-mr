import { stringAsciiCV, tupleCV, uintCV } from '@stacks/transactions';
import { requestSignature } from '@bigmarket/bm-common';
import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import { ChainId } from '@stacks/network';
import {
	ADMIN_MESSAGE,
	adminMessageToTupleCV,
	verifyBaseAdminSignature,
	voteMessageToTupleCV,
	votesToClarityValue,
	type BaseAdminMessage,
	type SignatureData,
	type StoredVoteMessage,
	type VoteMessage,
	type VotingEventProposeProposal
} from '@bigmarket/bm-helpers';
import { domainCV, getStxAddress } from '@bigmarket/bm-common';
import { domain } from '@bigmarket/sip18-forum';
import { daoConfigStore, requireDaoGoveranceClient } from '$lib/stores/config/daoConfigStore';
import { stacks } from '@bigmarket/sdk';

export async function fetchTimestamp() {
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

export async function submitSip18Votes(
	proposal: VotingEventProposeProposal,
	votes: Array<StoredVoteMessage>
) {
	const client = requireDaoGoveranceClient(get(daoConfigStore));
	const args = votesToClarityValue(proposal.proposal, votes);
	const response = await client.batchVote(proposal.extension, args.votesCV);
	return response.txid;
}

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

export async function signAdminMessage() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const adminMessage: BaseAdminMessage = {
		message: ADMIN_MESSAGE,
		timestamp: new Date().getTime(),
		admin: getStxAddress()
	};
	const chainId = appConfig.VITE_NETWORK === 'mainnet' ? ChainId.Mainnet : ChainId.Testnet;

	console.log('domainCV: ', domainCV);
	console.log('chainId: ', chainId);
	//const message = messageCV(adminMessage);

	// openStructuredDataSignatureRequestPopup({
	// 	message: tupleCV({
	// 		message: stringAsciiCV(adminMessage.message),
	// 		timestamp: uintCV(adminMessage.timestamp),
	// 		admin: stringAsciiCV(adminMessage.admin)
	// 	}),
	// 	domain: tupleCV({
	// 		name: stringAsciiCV(appConfig.VITE_PUBLIC_APP_NAME),
	// 		version: stringAsciiCV(appConfig.VITE_PUBLIC_APP_VERSION),
	// 		'chain-id': uintCV(chainId)
	// 	}),
	// 	network: getStxNetwork(),
	// 	appDetails: {
	// 		name: appDetails.name,
	// 		icon: (window?.location?.origin || '') + appDetails.icon
	// 	},
	// 	onFinish(signature) {
	// 		const network = appConfig.VITE_NETWORK;
	// 		const appName = appConfig.VITE_PUBLIC_APP_NAME;
	// 		const appVersion = appConfig.VITE_PUBLIC_APP_VERSION;
	// 		console.log('/votes: network: ' + appConfig.VITE_NETWORK);
	// 		console.log('/votes: publicAppName: ' + appConfig.VITE_PUBLIC_APP_NAME);
	// 		console.log('/votes: publicAppVersion: ' + appConfig.VITE_PUBLIC_APP_VERSION);
	// 		console.log('/votes: signature: ' + signature.signature);
	// 		console.log('/votes: publicKey: ' + signature.publicKey);
	// 		console.log('/votes: message: ', adminMessage);
	// 		let res = verifyBaseAdminSignature(network, appName, appVersion, adminMessage, signature.signature, signature.publicKey);
	// 		callback({ message: adminMessage, signature });
	// 	}
	// });
	const message = tupleCV({
		message: stringAsciiCV(adminMessage.message),
		timestamp: uintCV(adminMessage.timestamp),
		admin: stringAsciiCV(adminMessage.admin)
	});

	const signature = await stacks.requestSignature(appConfig, message);
	// const signature = await request('stx_signStructuredMessage', {
	//   message: tupleCV({
	//     message: stringAsciiCV(adminMessage.message),
	//     timestamp: uintCV(adminMessage.timestamp),
	//     admin: stringAsciiCV(adminMessage.admin),
	//   }),
	//   domain: tupleCV({
	//     name: stringAsciiCV(appConfig.VITE_PUBLIC_APP_NAME),
	//     version: stringAsciiCV(appConfig.VITE_PUBLIC_APP_VERSION),
	//     'chain-id': uintCV(chainId),
	//   }),
	// });
	const network = appConfig.VITE_NETWORK;
	const appName = appConfig.VITE_PUBLIC_APP_NAME;
	const appVersion = appConfig.VITE_PUBLIC_APP_VERSION;
	console.log('/votes: network: ' + appConfig.VITE_NETWORK);
	console.log('/votes: publicAppName: ' + appConfig.VITE_PUBLIC_APP_NAME);
	console.log('/votes: publicAppVersion: ' + appConfig.VITE_PUBLIC_APP_VERSION);
	console.log('/votes: signature: ' + signature.signature);
	console.log('/votes: publicKey: ' + signature.publicKey);
	console.log('/votes: message: ', adminMessage);
	const res = verifyBaseAdminSignature(
		network,
		appName,
		appVersion,
		adminMessage,
		signature.signature,
		signature.publicKey
	);
	return { message: adminMessage, signature, res };
}
export async function signAdminMessageXverse() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const adminMessage: BaseAdminMessage = {
		message: ADMIN_MESSAGE,
		timestamp: 1736281142366, //new Date().getTime(),
		admin: getStxAddress()
	};
	// const response = await request('stx_signStructuredMessage', {
	//   message: adminMessageToTupleCV(adminMessage),
	//   domain: tupleCV({
	//     name: stringAsciiCV('sats-connect-example'),
	//     version: stringAsciiCV('1.2.3'),
	//     'chain-id': uintCV(
	//       appConfig.VITE_NETWORK === 'mainnet' ? ChainId.Mainnet : ChainId.Testnet,
	//     ),
	//   }),
	// });
	const domain = tupleCV({
		name: stringAsciiCV('sats-connect-example'),
		version: stringAsciiCV('1.2.3'),
		'chain-id': uintCV(appConfig.VITE_NETWORK === 'mainnet' ? ChainId.Mainnet : ChainId.Testnet)
	});

	const signature = await requestSignature(appConfig, adminMessageToTupleCV(adminMessage), domain);
	return signature;
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

export async function signProposal(voteMessage: VoteMessage, callback: any) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const signature = await requestSignature(appConfig, voteMessageToTupleCV(voteMessage));
	// const signature = await request('stx_signStructuredMessage', {
	//   message: voteMessageToTupleCV(voteMessage), // remove 0x,
	//   domain: domainCV(domain),
	// });
	callback(signature);
}
