export type TxResult =
  | { success: true; txid: string }
  | { success: false; error?: string };
