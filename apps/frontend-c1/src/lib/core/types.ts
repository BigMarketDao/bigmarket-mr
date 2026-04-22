import type { AppConfig, DaoConfig } from '@bigmarket/bm-types';
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
export type VoteSummary = {
	stxFor: number;
	stxAgainst: number;
	accountsFor: number;
	accountsAgainst: number;
	inFavour: string;
	passed: boolean;
	customMajority: number;
};
