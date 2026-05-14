import type { WalletAdapter } from "../../wallet/types.js";
import { ethereumWalletAdapter } from "./ethereum-wallet-adapter.js";
import { ethereumBridge } from "./deposit.js";
import {
  approveAllbridgeWithdrawIfNeeded,
  sendAllbridgeWithdraw,
} from "./withdraw.js";

/** Browser-only: wallet + Allbridge (import from `@bigmarket/sdk/ethereum`, not the main entry). */
export type EthereumAdapter = WalletAdapter &
  typeof ethereumBridge & {
    approveAllbridgeWithdrawIfNeeded: typeof approveAllbridgeWithdrawIfNeeded;
    sendAllbridgeWithdraw: typeof sendAllbridgeWithdraw;
  };

export const ethereumAdapter: EthereumAdapter = {
  ...ethereumWalletAdapter,
  ...ethereumBridge,
  approveAllbridgeWithdrawIfNeeded,
  sendAllbridgeWithdraw,
};

export function getEthereumAdapter(): EthereumAdapter {
  return ethereumAdapter;
}
