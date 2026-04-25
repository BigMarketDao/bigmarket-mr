import { hashSha256Sync } from "@stacks/encryption";
import { MerkleTree } from "merkletreejs";
import { Cl, ClarityValue, ListCV } from "@stacks/transactions";
import { c32addressDecode } from "c32check"; // Decode principal to version + hash160
import { hexToBytes, bytesToHex, concatBytes } from "@stacks/common";
import { GateKeeper } from "@bigmarket/bm-types";
import { getGateKeeper } from "@bigmarket/bm-utilities";

export async function canCreateMarket(
  bmApiUrl: string,
  address: string,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const gateKeeper: GateKeeper = await getGateKeeper(bmApiUrl);
  const { tree, root } = generateMerkleTreeUsingStandardPrincipal(
    gateKeeper.merkleRootInput,
  );
  const { proof, valid } = generateMerkleProof(tree, address);
  return valid;
}

export function generateMerkleTreeUsingStandardPrincipal(
  addresses: Array<string>,
) {
  const leaves = addresses.map((address) => {
    const [version, hash160] = c32addressDecode(address);
    const hashBytes = hexToBytes(hash160);
    console.log(
      "generateMerkleTreeUsingStandardPrincipal ===> " +
        address +
        " ===> " +
        bytesToHex(hashSha256Sync(hashBytes)),
    );
    return hashSha256Sync(hashBytes);
  });
  const tree = new MerkleTree(leaves, hashSha256Sync);
  const root = tree.getRoot().toString("hex");
  return { tree, root };
}
export function generateMerkleProof(tree: MerkleTree, address: string) {
  const root = tree.getRoot().toString("hex");
  const [version, hash160] = c32addressDecode(address);
  const hashBytes = hexToBytes(hash160);
  // const clarityHash = hashSha256Sync(hashBytes);
  // console.log(bytesToHex(clarityHash));
  // console.log("generateMerkleProof ===> " + hash160);

  // Hash the resulting buffer with SHA-256
  const leaf = bytesToHex(hashSha256Sync(hashBytes));
  const proof = tree.getProof(leaf);
  const valid = tree.verify(proof, leaf, root);
  // console.log("Merkle version:" + version);
  // console.log("Merkle hash160:" + hash160);
  // console.log("Merkle address:" + address);
  // console.log("Merkle root:" + root);
  // console.log("Merkle leaf:" + leaf);
  // console.log("Is valid proof:", valid);
  // console.log("Leaves (Tree):", tree.getLeaves().map(bytesToHex));

  return { proof, valid, leaf };
}
export function proofToClarityValue(
  proof: Array<{ data: Uint8Array; position: string }>,
): ListCV<ClarityValue> {
  const clarityProof = proof.map((p: { data: any; position: string }) => {
    const hashBuffer = p.data; // Extract the hash
    if (hashBuffer.length !== 32) {
      throw new Error("Hash length must be 32 bytes for Clarity proof.");
    }
    console.log(
      "proofToClarityValue ===> " +
        hashBuffer.toString("hex") +
        " " +
        p.position,
    );
    return Cl.tuple({
      hash: Cl.bufferFromHex(hashBuffer.toString("hex")),
      position: Cl.bool(p.position === "left"),
    });
  });
  const proofList = Cl.list(clarityProof);
  return proofList;
}
