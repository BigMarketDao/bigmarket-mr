export {
  ethereumAdapter,
  getEthereumAdapter,
  type EthereumAdapter,
} from "./chains/ethereum/adapter.js";
export {
  approveAllbridgeDepositIfNeeded,
  sendAllbridgeDeposit,
  type ApproveAllbridgeDepositParams,
  type SendAllbridgeDepositParams,
} from "./chains/ethereum/deposit.js";
export {
  approveAllbridgeWithdrawIfNeeded,
  sendAllbridgeWithdraw,
  type SendAllbridgeWithdrawParams,
} from "./chains/ethereum/withdraw.js";
export { ChainSymbol, Messenger } from "@allbridge/bridge-core-sdk";
