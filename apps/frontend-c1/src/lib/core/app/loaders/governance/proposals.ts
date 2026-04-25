import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
import type { VotingEventProposeProposal, VotingEventVoteOnProposal } from '@bigmarket/bm-types';
import { get } from 'svelte/store';
import { chainStore } from '@bigmarket/bm-common';

export function isFunding() {
	return false;
}

export function getProposalColor(proposal: VotingEventProposeProposal) {
	if (isProposedPreVoting(proposal)) {
		return 'warning';
	} else if (isVoting(proposal)) {
		return 'green';
	} else {
		return 'danger';
	}
}

export function getProposalStatus(proposal: VotingEventProposeProposal) {
	if (isProposedPreVoting(proposal)) {
		return 'voting not started';
	} else if (isVoting(proposal)) {
		return 'voting';
	} else if (isConclusionPending(proposal)) {
		return 'pending conclusion';
	} else if (isPostVoting(proposal)) {
		return 'voting closed';
	} else {
		return 'unknown';
	}
}

export function isProposedPreVoting(proposal: VotingEventProposeProposal) {
	const currentHeight = get(chainStore).stacks.burn_block_height;
	return currentHeight < proposal.proposalData.burnStartHeight;
}

export async function getDaoVotesByProposalAndVoter(proposal: string, stxAddress: string) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const url = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/votes/${proposal}/${stxAddress}`;
	const response = await fetch(url);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export function isVoting(proposal: VotingEventProposeProposal) {
	//if (window.location.href.indexOf('localhost') > -1) return true;
	const currentHeight = get(chainStore).stacks.burn_block_height;
	const res = currentHeight >= proposal.proposalData.burnStartHeight;
	return res && currentHeight < proposal.proposalData.burnEndHeight;
}

export function isConclusionPending(proposal: VotingEventProposeProposal) {
	return isPostVoting(proposal) && !proposal.proposalData.concluded;
}

export function isConcluded(proposal: VotingEventProposeProposal) {
	return proposal.proposalData.concluded;
}

export function isPostVoting(proposal: VotingEventProposeProposal) {
	const currentHeight = get(chainStore).stacks.burn_block_height || 0;
	const endHeight = proposal.proposalData?.burnEndHeight || 0;
	return currentHeight >= endHeight;
}

export async function getFunding(submissionContract: string, proposalContract: string) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/proposals/v1/get-funding/${submissionContract}/${proposalContract}`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getAllProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/proposals/v1/all-proposals`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getActiveProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/proposals/v1/active-proposals`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getTentativeProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/proposals/v1/tentative-proposals`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getConcludedProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/proposals/v1/concluded-proposals`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getVotesByVoterAndProposal(
	voter: string,
	proposal: string
): Promise<Array<VotingEventVoteOnProposal> | []> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/voter/${voter}/${proposal}`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getVotesByVoter(
	voter: string
): Promise<Array<VotingEventVoteOnProposal> | []> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/voter/${voter}`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}

export async function getExecutedProposal(
	proposal: string
): Promise<VotingEventProposeProposal | undefined> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/executed-proposal/${proposal}`;
	const response = await fetch(path);
	if (response.status === 404) return;
	const res = await response.json();
	return res;
}

export async function getProposalLatest(
	proposal: string
): Promise<VotingEventProposeProposal | undefined> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/proposal/${proposal}`;
	const response = await fetch(path);
	if (response.status === 404) return;
	const res = await response.json();
	return res;
}

export async function getBaseDaoExecutedProposalEvents(daoContract: string) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/proposals/v1/get-executed-proposals/${daoContract}`;
	const response = await fetch(path);
	if (response.status === 404) return;
	const res = await response.json();
	return res;
}

export function getCurrentProposalLink(name: string): { name: string; address: string } {
	return { name: name ?? 'Proposal is loading', address: '/' };
}

export function getProposalNotFoundLink(): { name: string; address: string } {
	return { name: 'Proposal not found', address: '/' };
}

export async function fetchConcludedProposalsByDao(daoContract: string) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/proposed/${daoContract}`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
export async function fetchConcludedProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/concluded`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}

export async function fetchProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
export async function fetchProposedProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/proposed`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
export async function fetchAllProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
export async function fetchBootstrapProposals() {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/bootstrap`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
