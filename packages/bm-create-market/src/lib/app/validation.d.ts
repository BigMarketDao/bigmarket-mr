import { type ScalarMarketDataItem, type StoredOpinionPoll } from "@bigmarket/bm-types";
export type ValidationResult = {
    isValid: boolean;
    errors: Record<string, string>;
};
export declare function validatePoll(poll: StoredOpinionPoll, marketFeeBipsMax: number): ValidationResult;
export declare function isValidURL(string: string): boolean;
export declare function isValidStacksAddress(address: string): boolean;
export declare function isValidTwitterHandle(handle: string): boolean;
export declare function isValidDiscordServerId(serverId: string): boolean;
export declare function validateMarketFee(fee: number, marketFeeBipsMax: number): {
    isValid: boolean;
    message: string;
};
export declare function sanitizeInput(input: string): string;
export declare function validateTitle(title: string): {
    isValid: boolean;
    message: string;
};
export declare function validateDescription(description: string): {
    isValid: boolean;
    message: string;
};
export declare function validateTreasury(treasury: string): {
    isValid: boolean;
    message: string;
};
export declare function verifyAddressOwnership(address: string): boolean;
export declare function validateLogo(logo: string): {
    isValid: boolean;
    message: string;
};
export declare function validateTwitter(handle: string): {
    isValid: boolean;
    message: string;
};
export declare function validateDiscord(serverId: string): {
    isValid: boolean;
    message: string;
};
export declare function validateWebsite(url: string): {
    isValid: boolean;
    message: string;
};
export declare function validateMarketType(template: StoredOpinionPoll): {
    isValid: boolean;
    message: string;
} | undefined;
export declare function isContiguous(data: Array<ScalarMarketDataItem>): boolean;
export declare function validateOnInteraction(field: string, value: string, userHasInteracted: Record<string, boolean>): void;
//# sourceMappingURL=validation.d.ts.map