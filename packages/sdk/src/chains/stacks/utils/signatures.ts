import {
  BaseAdminMessage,
  ChainID,
  SignMessageResult,
  VoteMessage,
} from "@bigmarket/bm-types";
import { bytesToHex, hexToBytes } from "@stacks/common";
import {
  bufferCV,
  ClarityValue,
  encodeStructuredDataBytes,
  principalCV,
  publicKeyFromSignatureRsv,
  publicKeyToAddressSingleSig,
  serializeCV,
  stringAsciiCV,
  TupleCV,
  tupleCV,
  TupleData,
  uintCV,
} from "@stacks/transactions";
import { callContractReadOnly } from "./contract";
import {
  hashSha256Sync,
  verifySignature as verifySignatureStacks,
} from "@stacks/encryption";

export function getDomain(
  network: string,
  appName: string,
  appVersion: string,
) {
  const chainId = network === "mainnet" ? ChainID.Mainnet : ChainID.Testnet;
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

export async function requestSignature(
  network: string,
  appName: string,
  appVersion: string,
  message: TupleCV<TupleData<ClarityValue>>,
  domain?: TupleCV<TupleData<ClarityValue>>,
): Promise<SignMessageResult | null> {
  const { request } = await import("@stacks/connect");
  return await request("stx_signStructuredMessage", {
    message,
    domain: domain || domainCV(getDomain(network, appName, appVersion)),
  });
}

export function verifyBaseAdminSignature(
  network: string,
  appName: string,
  appVersion: string,
  adminMessage: BaseAdminMessage,
  publicKey: string,
  signature: string,
) {
  const message = adminMessageToTupleCV(adminMessage);
  return verifyDaoSignature(
    network,
    appName,
    appVersion,
    message,
    publicKey,
    signature,
  );
}

export function adminMessageToTupleCV(message: BaseAdminMessage) {
  return tupleCV({
    message: stringAsciiCV(message.message),
    timestamp: uintCV(message.timestamp),
    admin: stringAsciiCV(message.admin),
  });
}
export function verifyDaoSignature(
  network: string,
  appName: string,
  appVersion: string,
  message: TupleCV<TupleData<ClarityValue>>,
  publicKey: string,
  signature: string,
): string | undefined {
  const chainId = network === "mainnet" ? ChainID.Mainnet : ChainID.Testnet;
  const domain = tupleCV({
    name: stringAsciiCV(appName),
    version: stringAsciiCV(appVersion),
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
      network === "mainnet" ||
      network === "testnet" ||
      network === "devnet"
    ) {
      stacksAddress = publicKeyToAddressSingleSig(pubkey, network);
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
