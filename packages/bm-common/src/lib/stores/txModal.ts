import { writable } from "svelte/store";

export const txModal = writable<{
  open: boolean;
  txId?: string;
}>({
  open: false,
  txId: undefined,
});

export function showTxModal(txId: string) {
  txModal.set({ open: true, txId });
}

export function closeTxModal() {
  txModal.set({ open: false });
}
