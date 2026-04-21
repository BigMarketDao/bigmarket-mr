import type { DaoConfig } from '@bigmarket/bm-config';
import { stacks } from '@bigmarket/sdk';
import { writable } from 'svelte/store';

export const daoConfigStore = writable<DaoConfig | null>(null);

export function requireDaoConfig(config: DaoConfig | null): DaoConfig {
	if (!config) throw new Error('DAO config not loaded');
	return config;
}
export function requireDaoClient(config: DaoConfig | null) {
	return stacks.createDaoClient(requireDaoConfig(config));
}
export function requireDaoGovernanceClient(config: DaoConfig | null) {
	return stacks.createDaoGovernanceClient(requireDaoConfig(config));
}
