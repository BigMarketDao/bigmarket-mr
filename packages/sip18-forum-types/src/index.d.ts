interface PostAuthorisation {
    signature: string;
    publicKey: string;
}
interface BaseForumContent {
    title: string;
    content: string;
    linkedAccounts: LinkedAccount[];
    created: number;
    edited?: number;
    deleted?: boolean;
}
interface AuthenticatedForumMessageBoard {
    auth: PostAuthorisation;
    forumMessageBoard: ForumMessageBoard;
}
interface AuthenticatedForumContent {
    forumContent: ForumMessage;
    auth: PostAuthorisation;
}
interface ForumMessageBoard extends BaseForumContent {
    messageBoardId: string;
    owner: string;
    messages?: Array<AuthenticatedForumContent>;
}
interface ForumMessage extends BaseForumContent {
    messageBoardId: string;
    parentId: string;
    messageId: string;
    replies?: Array<AuthenticatedForumContent>;
    level: number;
}
interface LinkedAccount {
    source: "stacks" | "ethereum" | "solana" | "github" | "twitter" | "email" | "phone";
    identifier: string;
    verified?: boolean;
    preferred?: boolean;
    displayName?: string;
    profileUrl?: string;
    avatarUrl?: string;
    publicKey?: string;
}
export type { BaseForumContent, AuthenticatedForumMessageBoard, AuthenticatedForumContent, PostAuthorisation, ForumMessageBoard, ForumMessage, LinkedAccount };
//# sourceMappingURL=index.d.ts.map