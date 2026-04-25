import { ChainId } from "@stacks/network";
import { type TupleCV, type TupleData } from "@stacks/transactions";
import type { ForumMessage, BaseForumContent, LinkedAccount, ForumMessageBoard, AuthenticatedForumContent } from "@bigmarket/sip18-forum-types";
import type { SignMessageResult } from "@bigmarket/bm-types";
export declare function openWalletForSignature(config: Config, message: BaseForumContent): Promise<SignMessageResult | null>;
export interface SignatureData {
    signature: string;
    publicKey: string;
}
export declare function getStxAddress(): Promise<string>;
export interface Classes {
    root?: string;
    messageCard?: {
        container: string;
        title: string;
        author: string;
        iconSuccess: string;
        iconError: string;
        body: string;
    };
    newMessageCard?: {
        container: string;
        titleInput: string;
        contentLabel: string;
        contentEditor: string;
        contentPreview: string;
        error: string;
        buttonCancel: string;
        buttonPost: string;
        replyLink: string;
    };
}
export interface Config {
    VITE_PUBLIC_APP_NAME: string;
    VITE_PUBLIC_APP_VERSION: string;
    VITE_NETWORK: string;
    VITE_FORUM_API: string;
    VITE_STACKS_API: string;
}
export declare function getBnsNameFromAddress(api: string, address: string): Promise<string | undefined>;
export declare function getNewBoardTemplate(stxAddress: string, bnsName: string): ForumMessageBoard;
export declare function getNewMessageTemplate(messageBoardId: string, parentId: string, stxAddress: string, level: number, bnsName: string): ForumMessage;
export declare function getDefaultStacksLinkedAccount(stxAddress: string, bnsName: string): LinkedAccount;
export declare function getPreferredLinkedAccount(linkedAccounts: Array<LinkedAccount>): LinkedAccount | undefined;
export declare function authenticate(callback?: () => void): Promise<void>;
export declare function verifyPost(config: Config, wrapper: AuthenticatedForumContent): boolean;
export declare function getDomain(network: string, appName: string, appVersion: string): {
    name: string;
    version: string;
    "chain-id": ChainId;
};
export declare function domainCV(domain: any): TupleCV<TupleData<import("@stacks/transactions").UIntCV | import("@stacks/transactions").StringAsciiCV>>;
export declare const domain: {
    name: string;
    version: string;
    chainId: number;
};
export declare function getC32AddressFromPublicKey(publicKeyHex: string, network: string): string;
//# sourceMappingURL=forum_helper.d.ts.map