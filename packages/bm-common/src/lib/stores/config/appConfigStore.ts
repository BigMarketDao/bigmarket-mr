import { type AppConfig } from '@bigmarket/bm-types';
import { writable } from 'svelte/store';

export const appConfigStore = writable<AppConfig | null>(null);

export function requireAppConfig(config: AppConfig | null): AppConfig {
	if (!config) throw new Error('APP config not loaded');
	return config;
}
