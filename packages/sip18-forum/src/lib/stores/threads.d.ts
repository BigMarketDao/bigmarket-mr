import type { AuthenticatedForumMessageBoard, ForumMessage, ForumMessageBoard, PostAuthorisation } from '@bigmarket/sip18-forum-types';
export declare const storedBnsData: import("svelte/store").Writable<string>;
export declare const storedBoard: import("svelte/store").Writable<AuthenticatedForumMessageBoard>;
export declare const storedBoards: import("svelte/store").Writable<AuthenticatedForumMessageBoard[]>;
export declare function loadBoards(api: string): Promise<Array<AuthenticatedForumMessageBoard>>;
export declare function loadBoard(api: string, messageBoardId: string): Promise<AuthenticatedForumMessageBoard | undefined>;
export declare function loadBoardMessages(api: string, messageBoardId: string): Promise<any>;
/**
 * Top level message/thread returned with nested replies. There is one thread per prediciton market!
 * @param api
 * @param messageId
 * @returns
 */
export declare function loadThread(api: string, messageId: string): Promise<any>;
export declare function createThread(api: string, threadId: string, payload: {
    forumContent: ForumMessage;
    auth: PostAuthorisation;
}): Promise<any>;
export declare function createBoard(api: string, payload: {
    forumContent: ForumMessageBoard;
    auth: PostAuthorisation;
}): Promise<void>;
//# sourceMappingURL=threads.d.ts.map