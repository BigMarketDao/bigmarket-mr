import type { AppConfig, DaoConfig } from '@bigmarket/bm-config';
import type {
	DaoOverview,
	ExchangeRate,
	MarketCategory,
	StacksInfo,
	TokenPermissionEvent
} from '@bigmarket/bm-types';

export type LayoutData = {
	exchangeRates: ExchangeRate[];
	stacksInfo: StacksInfo;
	daoOverview: DaoOverview;
	tokens: TokenPermissionEvent[];
	marketCategories: MarketCategory[];
	network: string;
	appConfig: AppConfig;
	daoConfig: DaoConfig;
};
