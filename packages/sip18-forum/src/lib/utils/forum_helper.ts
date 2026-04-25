import { bytesToHex, hexToBytes } from "@stacks/common";
import { hashSha256Sync } from "@stacks/encryption";
import { ChainId } from "@stacks/network";
import {
  encodeStructuredDataBytes,
  publicKeyFromSignatureRsv,
  publicKeyToAddressSingleSig,
  stringAsciiCV,
  tupleCV,
  uintCV,
  verifySignature,
  type ClarityValue,
  type TupleCV,
  type TupleData,
} from "@stacks/transactions";
import type {
  ForumMessage,
  BaseForumContent,
  LinkedAccount,
  ForumMessageBoard,
  AuthenticatedForumContent,
} from "@bigmarket/sip18-forum-types";
import { connect, getLocalStorage, request } from "./connection_wrapper";
import type { Domain, SignMessageResult } from "@bigmarket/bm-types";
import { stacks } from "@bigmarket/sdk";

export async function openWalletForSignature(
  config: Config,
  message: BaseForumContent,
): Promise<SignMessageResult | null> {
  const domain: Domain = {
    network: config.VITE_NETWORK,
    appName: config.VITE_PUBLIC_APP_NAME,
    appVersion: config.VITE_PUBLIC_APP_VERSION,
  };
  return await stacks.requestForumSignature(domain, message);
}

export interface SignatureData {
  signature: string;
  publicKey: string;
}

export async function getStxAddress() {
  try {
    if (typeof window === "undefined") return "???";
    const userData = await getLocalStorage();
    return userData?.addresses.stx[0].address || "???";
  } catch (err) {
    return "???";
  }
}
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

export async function getBnsNameFromAddress(
  api: string,
  address: string,
): Promise<string | undefined> {
  const res = await fetch(`${api}/v1/addresses/stacks/${address}`);
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.names?.[0] ?? undefined;
}

export function getNewBoardTemplate(
  stxAddress: string,
  bnsName: string,
): ForumMessageBoard {
  const created = new Date().getTime();
  const messageBoardId = crypto.randomUUID();
  const forumMessageBoard: ForumMessageBoard = {
    messageBoardId,
    linkedAccounts: [getDefaultStacksLinkedAccount(stxAddress, bnsName)],
    owner: stxAddress,
    title: "",
    content: "",
    created,
    deleted: false,
  };
  return forumMessageBoard;
}
export function getNewMessageTemplate(
  messageBoardId: string,
  parentId: string,
  stxAddress: string,
  level: number,
  bnsName: string,
): ForumMessage {
  const forumMessage: ForumMessage = {
    messageBoardId,
    parentId,
    messageId: crypto.randomUUID(),
    linkedAccounts: [getDefaultStacksLinkedAccount(stxAddress, bnsName)],
    title: "",
    content: "",
    created: new Date().getTime(),
    deleted: false,
    level,
  };
  return forumMessage;
}

export function getDefaultStacksLinkedAccount(
  stxAddress: string,
  bnsName: string,
): LinkedAccount {
  const linkedAccount: LinkedAccount = {
    source: "stacks",
    identifier: stxAddress,
    verified: true,
    preferred: true,
    displayName: bnsName,
  };
  return linkedAccount;
}
export function getPreferredLinkedAccount(
  linkedAccounts: Array<LinkedAccount>,
): LinkedAccount | undefined {
  return linkedAccounts.find((o) => o.preferred);
}

// export async function openWalletForSignature(
//   config: Config,
//   message: BaseForumContent,
// ) {
//   return (await request("stx_signStructuredMessage", {
//     message: forumMessageToTupleCV(message),
//     domain: domainCV(
//       getDomain(
//         config.VITE_NETWORK,
//         config.VITE_PUBLIC_APP_NAME,
//         config.VITE_PUBLIC_APP_VERSION,
//       ),
//     ),
//   })) as SignatureData;
// }
export async function authenticate(callback?: () => void) {
  try {
    const response = await connect({});
    console.log("authenticate: ", response);

    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const stxProvider = localStorage.getItem("STX_PROVIDER");
      console.log("STX Provider from LocalStorage:", stxProvider);
    }

    if (callback) callback();
  } catch (err) {
    console.error("Error in authenticate:", err);
  }
}

export function verifyPost(config: Config, wrapper: AuthenticatedForumContent) {
  try {
    const la = getPreferredLinkedAccount(wrapper.forumContent.linkedAccounts);
    if (!la) return false;
    const stxAddressFromKey = getC32AddressFromPublicKey(
      wrapper.auth.publicKey,
      config.VITE_NETWORK,
    );
    if (la.identifier !== stxAddressFromKey) {
      console.log(
        "/polls: wrong voter: " +
          la.identifier +
          " signer: " +
          stxAddressFromKey,
      );
      return false;
    }
    const domain: Domain = {
      network: config.VITE_NETWORK,
      appName: config.VITE_PUBLIC_APP_NAME,
      appVersion: config.VITE_PUBLIC_APP_VERSION,
    };

    const valid = stacks.verifyForumSignature(
      domain,
      wrapper.forumContent,
      wrapper.auth.publicKey,
      wrapper.auth.signature,
    );

    if (!valid) {
      console.warn("Signature verification failed");
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Post verification error:", err);
    throw new Error(`Post verification failed: ${err.message}`);
  }
}

export function getDomain(
  network: string,
  appName: string,
  appVersion: string,
) {
  const chainId = network === "mainnet" ? ChainId.Mainnet : ChainId.Testnet;
  console.log("chainId: " + chainId);
  console.log("appName: " + appName);
  console.log("appVersion: " + appVersion);
  return {
    name: appName,
    version: appVersion,
    "chain-id": chainId,
  };
}

export function domainCV(domain: any) {
  return tupleCV({
    name: stringAsciiCV(domain.name),
    version: stringAsciiCV(domain.version),
    "chain-id": uintCV(domain["chain-id"]),
  });
}

// SIP-018 domain (must match client signing)
export const domain = {
  name: "BigMarket",
  version: "1.0.0",
  chainId: 1,
};

export function getC32AddressFromPublicKey(
  publicKeyHex: string,
  network: string,
): string {
  //console.log("getC32AddressFromPublicKey: auth check");

  if (network === "mainnet" || network === "testnet" || network === "devnet") {
    const stacksAddress = publicKeyToAddressSingleSig(publicKeyHex, network);
    return stacksAddress;
  }
  return "unknown";
}
