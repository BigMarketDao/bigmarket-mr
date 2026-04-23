export type AddressObject = {
    stxAddress: string;
    cardinal: string;
    ordinal: string;
    sBTCBalance: number;
    stxBalance?: number;
    bnsNameInfo?: any;
    btcPubkeySegwit0?: string;
    btcPubkeySegwit1?: string;
};
export declare function isLoggedIn(): Promise<boolean>;
export declare function logUserOut(): Promise<void>;
export declare function isXverse(): boolean;
export declare function isLeather(): boolean;
//# sourceMappingURL=signer.d.ts.map