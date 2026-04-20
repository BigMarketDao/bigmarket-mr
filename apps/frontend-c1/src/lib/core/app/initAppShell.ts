import { browser } from '$app/environment';
import type { ChainInfo, StacksInfo } from '@bigmarket/bm-types';
import { fetchStacksInfo } from '../server/loaders/blockchainLoaders';
import { connectWebsockets } from './wsClient';
import { chainStore } from '@bigmarket/bm-common/src/lib/stores/ui/chainStore';

export function initAppShell(stackApiUrl: string) {
	connectWebsockets();
	initApp(stackApiUrl);
}
const initApp = async (stackApiUrl: string) => {
	if (!browser) return;
	setInterval(async function () {
		const stacksInfo = (await fetchStacksInfo(stackApiUrl)) || ({} as StacksInfo);
		chainStore.update((conf: ChainInfo) => {
			conf.stacks = { ...conf.stacks, ...stacksInfo };
			return conf;
		});
	}, 60000);
};
