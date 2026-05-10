// src/lib/utils/transactionWatcher.ts
import { writable } from "svelte/store";
import { errorCodes } from "./contractErrors.js";

export interface TxStatus {
  txid: string;
  status: "pending" | "success" | "abort_by_response" | "failed";
  txResult?: any;
}

export const txStatus = writable<TxStatus | null>(null);

export async function watchTransaction(
  bmApi: string,
  stacksApi: string,
  fullDaoContract: string,
  txid: string,
) {
  localStorage.setItem("pendingTx", txid);
  txStatus.set({ txid, status: "pending" });
  const result = await fetch(`${bmApi}/transactions/${txid}`).catch(() => {});

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${stacksApi}/extended/v1/tx/${txid}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.tx_status !== "pending") {
        txStatus.set({
          txid,
          status: data.tx_status,
          txResult: data,
        });
        clearInterval(interval);
        localStorage.removeItem("pendingTx");
        if (data.tx_status === "success") {
          await readBaseDaoEvents(bmApi, fullDaoContract);
          //if (window) window.location.reload();
        }
      }
    } catch (e) {
      console.warn("Polling error:", e);
    }
  }, 5000);

  // Return a cancel handle
  return () => clearInterval(interval);
}

export function lookupError(txStatus: TxStatus) {
  // if ((txStatus.txResult?.tx_result?.repr as string).indexOf("u10039") > -1) {
  //   return "oracle failed to lookup price";
  // }
  return getErrorMessage(txStatus);
}
const getErrorMessage = (txStatus: any): string => {
  const repr = txStatus.txResult?.tx_result?.repr;
  if (typeof repr !== "string") {
    return "unknown error";
  }
  const match = repr.match(/^\(?err\s+(u\d+)\)?$/);
  if (!match) {
    return "unknown error";
  }
  return errorCodes[match[1]] ?? "unknown error";
};

export async function readBaseDaoEvents(
  bmApi: string,
  fullDaoContract: string,
) {
  const path = `${bmApi}/dao/events/latest-events/${fullDaoContract}`;
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (response.status >= 400 && response.status < 500) return "not allowed";
  else if (response.status >= 500) return "error on server";
  const res = await response.json();
  return res;
}
