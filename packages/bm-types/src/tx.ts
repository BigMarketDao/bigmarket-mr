export type TxResult =
  | { success: true; txid: string }
  | { success: false; error?: string };
export type TransactionObject = {
  tx_id: string;
  tx_status: string;
  tx_result?: string;
  tx_events?: string;
  tx_fee?: string;
  sender_address: string;
  tx_receiver?: string;
  tx_amount?: string;
};
