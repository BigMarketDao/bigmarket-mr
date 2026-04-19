import { getNetworkFromUrl, getAppConfig, getDaoConfig } from '@bigmarket/bm-config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);
	const daoConfig = getDaoConfig(network);

	return {
		appConfig,
		daoConfig
	};
};
