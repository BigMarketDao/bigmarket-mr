import type {
  BaseAdminMessage,
  Domain,
  SignMessageResult,
  VoteMessage,
} from "@bigmarket/bm-types";
import { ChainID } from "@bigmarket/bm-types";
import { bytesToHex, hexToBytes } from "@stacks/common";
import {
  boolCV,
  bufferCV,
  type ClarityValue,
  encodeStructuredDataBytes,
  principalCV,
  publicKeyFromSignatureRsv,
  publicKeyToAddressSingleSig,
  serializeCV,
  stringAsciiCV,
  type TupleCV,
  tupleCV,
  type TupleData,
  uintCV,
} from "@stacks/transactions";
import { callContractReadOnly } from "./contract.js";
import {
  hashSha256Sync,
  verifySignature as verifySignatureStacks,
} from "@stacks/encryption";
import {
  type BaseForumContent,
  type ForumMessage,
  type LinkedAccount,
} from "@bigmarket/sip18-forum-types";

function getDomainInternal(domain: Domain) {
  const chainId =
    domain.network === "mainnet" ? ChainID.Mainnet : ChainID.Testnet;
  return {
    name: domain.appName,
    version: domain.appVersion,
    "chain-id": chainId,
  };
}

export function domainCV(domain: Domain) {
  const domainInternal = getDomainInternal(domain);
  return tupleCV({
    name: stringAsciiCV(domainInternal.name),
    version: stringAsciiCV(domainInternal.version),
    "chain-id": uintCV(domainInternal["chain-id"]),
  });
}

export async function verifySignature(
  stacksApi: string,
  vote: VoteMessage,
  hash: string,
  signature: string,
  votingContract: string,
): Promise<{ result: boolean }> {
  const functionArgs = [
    `0x${serializeCV(bufferCV(hexToBytes(hash)))}`,
    `0x${serializeCV(bufferCV(hexToBytes(signature)))}`,
    `0x${serializeCV(principalCV(vote.voter))}`,
  ];

  const data = {
    contractAddress: votingContract.split(".")[0],
    contractName: votingContract.split(".")[1],
    functionName: "verify-signature",
    functionArgs,
  };
  let res: { value: boolean; type: string };
  try {
    res = await callContractReadOnly(stacksApi, data);
    return { result: res.value };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return { result: false };
  }
}

export function dataHashSip18(domain: Domain, voteMessage: VoteMessage) {
  const domainCVValue = domainCV(domain);
  const structuredDataHash = bytesToHex(
    hashSha256Sync(
      encodeStructuredDataBytes({
        message: voteMessageToTupleCV(voteMessage),
        domain: domainCVValue,
      }),
    ),
  );
  return structuredDataHash;
}

export function dataHashSip18Forum(
  domain: Domain,
  forumMessage: BaseForumContent,
) {
  const domainCVValue = domainCV(domain);
  const structuredDataHash = bytesToHex(
    hashSha256Sync(
      encodeStructuredDataBytes({
        message: forumMessageToTupleCV(forumMessage),
        domain: domainCVValue,
      }),
    ),
  );
  return structuredDataHash;
}

export function dataHashMarketSip18(
  domain: Domain,
  message: TupleCV<TupleData<ClarityValue>>,
) {
  const domainCVValue = domainCV(domain);
  const structuredDataHash = bytesToHex(
    hashSha256Sync(
      encodeStructuredDataBytes({
        message: message,
        domain: domainCVValue,
      }),
    ),
  );
  return structuredDataHash;
}

export function verifySip18VoteSignature(
  domain: Domain,
  voteMessage: VoteMessage,
  publicKey: string,
  signature: string,
) {
  const message = voteMessageToTupleCV(voteMessage);
  return verifyDaoSignature(domain, message, publicKey, signature);
}
function voteMessageToTupleCV(message: VoteMessage) {
  return tupleCV({
    attestation: stringAsciiCV(message.attestation),
    proposal: principalCV(message.proposal),
    timestamp: uintCV(message.timestamp),
    vote: boolCV(message.vote),
    voter: principalCV(message.voter),
    voting_power: uintCV(message.voting_power),
  });
}
export function marketDataToTupleCV(
  name: string,
  category: string,
  createdAt: number,
  proposer: string,
  token: string,
) {
  return tupleCV({
    name: stringAsciiCV(name),
    category: stringAsciiCV(category),
    createdAt: uintCV(createdAt),
    proposer: principalCV(proposer),
    token: stringAsciiCV(token),
  });
}

export async function requestAdminSignature(
  adminMessage: BaseAdminMessage,
  domain: Domain,
): Promise<SignMessageResult | null> {
  const message = tupleCV({
    message: stringAsciiCV(adminMessage.message),
    timestamp: uintCV(adminMessage.timestamp),
    admin: stringAsciiCV(adminMessage.admin),
  });
  const domainCVValue = domainCV(domain);
  return await requestSignature(message, domainCVValue);
}

export async function requestForumSignature(
  domain: Domain,
  forumMessage: BaseForumContent,
): Promise<SignMessageResult | null> {
  const forumPostCV = forumMessageToTupleCV(forumMessage);
  const domainCVValue = domainCV(domain);
  return await requestSignature(forumPostCV, domainCVValue);
}

export async function requestVoteMessageSignature(
  voteMessage: VoteMessage,
  domain: Domain,
): Promise<SignMessageResult | null> {
  const message = voteMessageToTupleCV(voteMessage);
  const domainCVValue = domainCV(domain);
  return await requestSignature(message, domainCVValue);
}

async function requestSignature(
  message: TupleCV<TupleData<ClarityValue>>,
  domain: TupleCV<TupleData<ClarityValue>>,
): Promise<SignMessageResult | null> {
  const { request } = await import("@stacks/connect");
  return await request("stx_signStructuredMessage", {
    message,
    domain,
  });
}

export function verifyBaseAdminSignature(
  domain: Domain,
  adminMessage: BaseAdminMessage,
  publicKey: string,
  signature: string,
) {
  const message = adminMessageToTupleCV(adminMessage);
  return verifyDaoSignature(domain, message, publicKey, signature);
}

export function adminMessageToTupleCV(message: BaseAdminMessage) {
  return tupleCV({
    message: stringAsciiCV(message.message),
    timestamp: uintCV(message.timestamp),
    admin: stringAsciiCV(message.admin),
  });
}
export function verifyDaoSignature(
  domainIn: Domain,
  message: TupleCV<TupleData<ClarityValue>>,
  publicKey: string,
  signature: string,
): string | undefined {
  const chainId =
    domainIn.network === "mainnet" ? ChainID.Mainnet : ChainID.Testnet;
  const domain = tupleCV({
    name: stringAsciiCV(domainIn.appName),
    version: stringAsciiCV(domainIn.appVersion),
    "chain-id": uintCV(chainId),
  });
  const structuredDataHash = bytesToHex(
    hashSha256Sync(encodeStructuredDataBytes({ message, domain })),
  );

  //console.log("signature.hash: " + structuredDataHash);

  const signatureBytes = hexToBytes(signature);
  const strippedSignature = signatureBytes.slice(0, -1);
  //console.log("Stripped Signature (Hex):", bytesToHex(strippedSignature));

  let pubkey: string = "-";
  let stacksAddress: string = "-";
  try {
    pubkey = publicKeyFromSignatureRsv(structuredDataHash, signature);

    if (
      domainIn.network === "mainnet" ||
      domainIn.network === "testnet" ||
      domainIn.network === "devnet"
    ) {
      stacksAddress = publicKeyToAddressSingleSig(pubkey, domainIn.network);
    }

    //console.log("sa: " + pubkey);
  } catch (err: any) {}
  //console.log("pubkey: " + pubkey);
  let result = false;
  try {
    result = verifySignatureStacks(
      bytesToHex(strippedSignature),
      structuredDataHash,
      publicKey,
    );
    //console.log("verifySignatureRsv: result: " + result);
  } catch (err: any) {}
  return result ? stacksAddress : undefined;
}

export function getPreferredLinkedAccount(
  linkedAccounts: Array<LinkedAccount>,
): LinkedAccount | undefined {
  return linkedAccounts.find((o) => o.preferred);
}

export function forumMessageToTupleCV(
  message: BaseForumContent,
): TupleCV<TupleData<ClarityValue>> {
  const la = getPreferredLinkedAccount(message.linkedAccounts);
  if (!la) throw new Error("Unable to convert this message");
  return tupleCV({
    identifier: stringAsciiCV(la.identifier),
    created: uintCV(message.created),
    title: stringAsciiCV(message.title),
    content: stringAsciiCV(message.content),
  });
}

export function verifyForumSignature(
  domain: Domain,
  forumContent: ForumMessage,
  publicKey: string,
  signature: string,
): string | undefined {
  const domainCVValue = domainCV(domain);
  const structuredDataHash = bytesToHex(
    hashSha256Sync(
      encodeStructuredDataBytes({
        message: forumMessageToTupleCV(forumContent),
        domain: domainCVValue,
      }),
    ),
  );
  const signatureBytes = hexToBytes(signature);
  const strippedSignature = signatureBytes.slice(0, -1);

  let pubkey: string = "-";
  let stacksAddress: string = "-";
  try {
    pubkey = publicKeyFromSignatureRsv(structuredDataHash, signature);

    if (
      domain.network === "mainnet" ||
      domain.network === "testnet" ||
      domain.network === "devnet"
    ) {
      stacksAddress = publicKeyToAddressSingleSig(pubkey, domain.network);
    }

    //console.log("sa: " + pubkey);
  } catch (err: any) {}
  //console.log("pubkey: " + pubkey);
  let result = false;
  try {
    result = verifySignatureStacks(
      bytesToHex(strippedSignature),
      structuredDataHash,
      publicKey,
    );
  } catch (err: any) {}
  return result ? stacksAddress : undefined;
}
