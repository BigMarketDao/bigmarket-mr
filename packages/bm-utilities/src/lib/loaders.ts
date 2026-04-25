import type {
  GateKeeper,
  PredictionMarketStakeEvent,
  StoredOpinionPoll,
  TokenBalances,
  TransactionObject,
} from "@bigmarket/bm-types";
import { isSTX } from "./market-utilities.js";

export async function getGateKeeper(bmApiUrl: string): Promise<GateKeeper> {
  const path = `${bmApiUrl}/gating/create-market`;
  const response = await fetch(path);
  const gateKeeper: GateKeeper = await response.json();
  return gateKeeper;
}

export async function createMarketAI(
  bmApiUrl: string,
  proposer: string,
  market: { mechanism: number; source: string; suggestion: string },
): Promise<StoredOpinionPoll> {
  let path = `${bmApiUrl}/agent/create/by-discovery`;
  if (market.mechanism === 1) {
    path = `${bmApiUrl}/agent/create/by-suggestion`;
  }
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "" },
    body:
      market.mechanism === 1
        ? JSON.stringify({ proposer, suggestion: market.suggestion })
        : JSON.stringify({ proposer, source: market.source }),
  });
  if (response.status !== 200) throw new Error("Error on server");
  const res = await response.json();
  return res;
}

export async function fullBalanceInSip10Token(
  stacksApi: string,
  stxAddress: string,
  tokenContract: string,
  stacksHiroKey?: string,
): Promise<number> {
  let totalBalanceAtHeight = 0;
  try {
    if (isSTX(tokenContract)) return fullBalanceAtHeight(stacksApi, stxAddress);
    const response = await getTokenBalances(stacksApi, stxAddress);
    const tokenEntry = Object.entries(response.fungible_tokens).find(([key]) =>
      key.startsWith(tokenContract),
    );
    if (tokenEntry) {
      const [tokenKey, tokenData] = tokenEntry;
      const assetName = tokenKey.split("::")[1]; // Extract the asset name
      console.log(`Asset Name: ${assetName}`);
      console.log(`Token Data:`, tokenData);
      totalBalanceAtHeight = Number((tokenData as any)?.balance || 0);
      return totalBalanceAtHeight;
    } else {
      console.log("Token not found.");
    }
  } catch (e: any) {
    totalBalanceAtHeight = 0;
  }
  return totalBalanceAtHeight;
}

export async function fullBalanceAtHeight(
  stacksApi: string,
  stxAddress: string,
  height?: number,
  stacksHiroKey?: string,
): Promise<number> {
  let totalBalanceAtHeight = 0;
  try {
    const response = await getBalanceAtHeight(stacksApi, stxAddress);
    totalBalanceAtHeight = Number(response.stx?.balance || 0);
    return totalBalanceAtHeight;
  } catch (e: any) {
    totalBalanceAtHeight = 0;
  }
  return totalBalanceAtHeight;
}

export async function getBalanceAtHeight(
  stacksApi: string,
  stxAddress: string,
  height?: number,
  stacksHiroKey?: string,
): Promise<{ stx: { balance: number; locked: number } }> {
  if (!stxAddress)
    return {
      stx: {
        balance: 0,
        locked: 0,
      },
    };
  let url = `${stacksApi}/extended/v1/address/${stxAddress}/balances`;
  if (height) url += `?until_block=${height}`;
  let val;
  try {
    const response = await fetch(url, {
      headers: { ...(stacksHiroKey ? { "x-api-key": stacksHiroKey } : {}) },
    });
    val = await response.json();
  } catch (err) {
    console.log("getBalanceAtHeight: ", err);
  }
  return val;
}
export async function getTokenBalances(
  stacksApi: string,
  principal: string,
  stacksHiroKey?: string,
): Promise<TokenBalances> {
  const path = `${stacksApi}/extended/v1/address/${principal}/balances`;
  const response = await fetch(path, {
    headers: { ...(stacksHiroKey ? { "x-api-key": stacksHiroKey } : {}) },
  });
  const res = await response.json();
  return res;
}

export async function getTransaction(
  stacksApi: string,
  tx: string,
  stacksHiroKey?: string,
): Promise<TransactionObject> {
  const url = `${stacksApi}/extended/v1/tx/${tx}`;
  let val;
  try {
    const response = await fetch(url, {
      headers: { ...(stacksHiroKey ? { "x-api-key": stacksHiroKey } : {}) },
    });
    val = await response.json();
  } catch (err) {
    console.log("getTransaction: ", err);
  }
  return val;
}
export async function fetchMarketStakes(
  bmApiUrl: string,
  marketId: number,
  marketType: number,
): Promise<Array<PredictionMarketStakeEvent>> {
  const path = `${bmApiUrl}/pm/stakes/${marketId}/${marketType}`;
  const response = await fetch(path);
  if (response.status === 404) return [] as PredictionMarketStakeEvent[];
  const res = await response.json();
  return res;
}

export async function getBnsNameFromAddress(
  forumApi: string,
  address: string,
): Promise<string | undefined> {
  const res = await fetch(`${forumApi}/v1/addresses/stacks/${address}`);
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.names?.[0] ?? undefined;
}

export async function postCreatePollMessage(
  bmApiUrl: string,
  newPoll: StoredOpinionPoll,
) {
  const path = `${bmApiUrl}/pm/markets`;

  try {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newPoll }),
    });

    // Handle HTTP errors (fetch does NOT throw on 4xx/5xx)
    if (!response.ok) {
      const status = response.status;

      if (status === 502) {
        return "Market with this question already exists";
      } else if (status >= 400 && status < 500) {
        return "not allowed";
      } else if (status >= 500) {
        return "error on server";
      }
    }

    const data = await response.json();
    console.log("postCreatePollMessage: response: ", data);

    return data;
  } catch (error) {
    console.log("postCreatePollMessage: error: ", error);

    // Network / unexpected errors
    return "An unexpected error occurred";
  }
}
