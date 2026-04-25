import type { AppConfig, DaoConfig, DaoOverview, StoredOpinionPoll, TokenPermissionEvent, TxResult } from "@bigmarket/bm-types";
import type { LinkedAccount } from "@bigmarket/sip18-forum-types";
export declare function getDefaultStacksLinkedAccount(stxAddress: string, bnsName: string): LinkedAccount;
export declare function getSignature(appConfig: AppConfig, daoConfig: DaoConfig, template: StoredOpinionPoll, daoOverview: DaoOverview): Promise<{
    dataHash: string;
    poll: StoredOpinionPoll;
}>;
export declare function confirmPoll(appConfig: AppConfig, daoConfig: DaoConfig, dataHash: string, template: StoredOpinionPoll, daoOverview: DaoOverview, tokenEvent: TokenPermissionEvent): Promise<TxResult | null>;
//# sourceMappingURL=market_creation.d.ts.map