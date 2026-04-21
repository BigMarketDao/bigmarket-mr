export interface SignatureData {
  signature: string;
  publicKey: string;
}

export interface StoredVoteMessage extends VoteMessage {
  _id?: string;
  voteObjectHash: string;
  processed: boolean;
  signature: string;
  publicKey: string;
}
export interface VoteMessage {
  attestation: string;
  proposal: string;
  timestamp: number;
  vote: boolean;
  voter: string;
  voting_power: number;
}
export enum ChainID {
  Testnet = 2147483648,
  Mainnet = 1,
}
// see https://github.com/hirosystems/stacks.js/blob/fd0bf26b5f29fc3c1bf79581d0ad9b89f0d7f15a/packages/transactions/src/structuredDataSignature.ts#L55
export const STRUCTURED_DATA_PREFIX = new Uint8Array([
  0x53, 0x49, 0x50, 0x30, 0x31, 0x38,
]);
export interface SignMessageResult {
  signature: string;
  publicKey: string;
}
