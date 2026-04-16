import { requestWallet } from "./stacks/wallet";

export async function deposit(token: string, amount: number) {
  return requestWallet(
    "SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z",
    "bme050-0-vault",
    "deposit",
    [],
  );
}
