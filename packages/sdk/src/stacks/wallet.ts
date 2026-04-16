// SSR-safe wrappers for @stacks/connect (dynamic import only inside functions)
import { TransactionResult } from "@stacks/connect/dist/types/methods";
import { type ClarityValue, type PostCondition } from "@stacks/transactions";

export type CallContractResponse = { txid: string };

export async function getUserData() {
  const { getLocalStorage } = await import("@stacks/connect");
  return getLocalStorage();
}

export async function authenticate(callback?: () => void) {
  const { connect, isConnected } = await import("@stacks/connect");

  if (await isConnected()) {
    console.log("Already connected");
  } else {
    await connect({ forceWalletSelect: true });
  }

  if (callback) callback();
}

export async function requestWallet(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: Array<ClarityValue>,
  postConditions?: Array<PostCondition>,
  postConditionMode?: "allow" | "deny",
): Promise<TransactionResult | null> {
  const { request } = await import("@stacks/connect");
  try {
    return await request("stx_callContract", {
      contract: `${contractAddress}.${contractName}`,
      functionName,
      functionArgs,
      network: "testnet",
      postConditions: postConditions ?? [],
      postConditionMode: postConditionMode ?? "deny",
    });
  } catch (e) {
    console.error("Wallet request failed", e);
    return null;
  }
}

/** Call once on mount (e.g., in +layout.svelte) */
export async function initWalletSession(): Promise<{
  stx: string;
  btc: string;
  ord: string;
}> {
  const { isConnected, getLocalStorage } = await import("@stacks/connect");
  const connected = await isConnected();
  if (connected) {
    const data = await getLocalStorage();
    const stx = data?.addresses?.stx?.[0]?.address ?? null;
    const btc = data?.addresses?.btc?.[0]?.address ?? null;
    const ord = data?.addresses?.btc?.[1]?.address ?? null;
    //walletState.set({ status: 'connected', stx, btc, ord, raw: data });
    return { stx: stx || "", btc: btc || "", ord: ord || "" };
  }
  return { stx: "", btc: "", ord: "" };
}

export async function disconnectWallet() {
  const { disconnect } = await import("@stacks/connect");
  await disconnect();
  await initWalletSession();
}
