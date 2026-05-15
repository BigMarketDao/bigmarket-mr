import { keccak256, encodePacked, concat, toBytes } from "viem";
const CHAIN_IDS = {
  evm: "0x00000001",
  btc: "0x00000002",
  stacks: "0x00000003",
  solana: "0x00000004",
} as const;

const WITHDRAW_DOMAIN = toBytes("bigmarket-vault-withdraw-v1");

function padAddress20(addr: `0x${string}`): Uint8Array {
  const bytes = toBytes(addr); // 20 bytes
  const padded = new Uint8Array(32);
  padded.set(bytes, 12); // left-pad with 12 zeros
  return padded;
}

export function buildWithdrawHash(params: {
  chainId: `0x${string}`;
  userAddress: `0x${string}`; // 20-byte raw address
  tokenPrincipal: string; // consensus-serialised — match Clarity to-consensus-buff?
  amount: bigint;
  recipient: string; // consensus-serialised principal
  nonce: bigint;
}): `0x${string}` {
  return keccak256(
    concat([
      WITHDRAW_DOMAIN,
      toBytes(params.chainId), // 4 bytes
      padAddress20(params.userAddress), // 32 bytes
      toBytes(params.tokenPrincipal), // consensus principal bytes
      encodePacked(["uint128"], [params.amount]), // 16 bytes
      toBytes(params.recipient),
      encodePacked(["uint128"], [params.nonce]), // 16 bytes
    ]),
  );
}

export async function registerDepositIntent(
  bmApiUrl: string,
  params: {
    amount: string;
    sourceChain?: string;
    destinationChain: string;
    stxIsTestnet?: boolean;
    provider?: any;
  },
) {
  // 1. Ask backend for mapped Stacks deposit address
  const intentRes = await fetch(`${bmApiUrl}/cross-chain/deposit-intent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      amount: params.amount,
      sourceChain: params.sourceChain ?? "eth",
      destinationChain: params.destinationChain,
      stxIsTestnet: params.stxIsTestnet ?? false,
    }),
  });
  return intentRes;

  // if (!intentRes.ok) throw new Error(await intentRes.text());
}
