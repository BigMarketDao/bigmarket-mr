export function explorerTxUrl(
  network: string,
  stacksExplorer: string,
  txid: string,
) {
  if (network === "devnet") {
    return `${stacksExplorer}/txid/${txid}?chain=testnet&api=http://localhost:3999`;
  } else if (network === "testnet") {
    return `${stacksExplorer}/txid/${txid}?chain=testnet`;
  } else {
    return `${stacksExplorer}/txid/${txid}?chain=mainnet`;
  }
}

export function explorerAddressUrl(
  network: string,
  stacksExplorer: string,
  addr: string,
) {
  if (network === "devnet") {
    return `${stacksExplorer}/address/${addr}?chain=testnet&api=http://localhost:3999`;
  } else if (network === "testnet") {
    return `${stacksExplorer}/address/${addr}?chain=testnet`;
  } else {
    return `${stacksExplorer}/address/${addr}?chain=mainnet`;
  }
}
export function explorerBtcTxUrl(mempoolApi: string, txid: string | undefined) {
  if (!txid) return "?";
  if (txid.startsWith("0x")) txid = txid.split("x")[1];
  return mempoolApi + "/tx/" + txid;
}
export function exchangeUrl(_txid: string | undefined) {
  return "https://coinbase.com";
}
export function explorerBtcAddressUrl(
  mempoolApi: string,
  address: string | undefined,
) {
  if (!address) return "";
  return mempoolApi + "/address/" + address;
}
