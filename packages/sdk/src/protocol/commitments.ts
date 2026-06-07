import { hexToBytes } from "@stacks/common";
import {
  contractPrincipalCV,
  principalCV,
  serializeCV,
  type ClarityValue,
} from "@stacks/transactions";

/** keccak256(consensus-serialized principal) — matches vault commitment slots. */
export async function principalCommitment(
  principal: string,
  isContract = false,
): Promise<Uint8Array> {
  const { keccak_256 } = await import("@noble/hashes/sha3");
  const parts = principal.split(".");
  if (parts.length !== 2 && isContract) {
    throw new Error(`Invalid principal: ${principal}`);
  }
  const cv: ClarityValue = isContract
    ? contractPrincipalCV(parts[0], parts[1])
    : principalCV(principal);
  return keccak_256(hexToBytes(serializeCV(cv)));
}

export function splitPrincipal(principal: string): {
  address: string;
  name: string;
} {
  const parts = principal.split(".");
  if (parts.length !== 2) {
    throw new Error(`Invalid principal: ${principal}`);
  }
  return { address: parts[0], name: parts[1] };
}
