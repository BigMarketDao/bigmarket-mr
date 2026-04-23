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
  identifier: string; // could be an address, username, email, phone number, etc.
  verified?: boolean;
  preferred?: boolean;
  displayName?: string; // fallback if not found in `identities`
  profileUrl?: string;
  avatarUrl?: string; // optional for OAuth/Web2
  publicKey?: string; // for Web3 accounts
}

const __typesOnly = true;

export type { BaseForumContent, AuthenticatedForumMessageBoard, AuthenticatedForumContent, PostAuthorisation, ForumMessageBoard, ForumMessage, LinkedAccount };
