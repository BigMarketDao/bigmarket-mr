import { appConfigByNetwork, daoConfigByNetwork } from "./networks";
import type { AppConfig, DaoConfig, Network } from "@bigmarket/bm-types";

export function getNetworkFromUrl(url: URL): Network {
  const chain = url.searchParams.get("chain");
  return chain === "devnet" || chain === "testnet" || chain === "mainnet"
    ? chain
    : "devnet";
}

export function getAppConfig(network: Network): AppConfig {
  return appConfigByNetwork[network];
}
export function getDaoConfig(network: Network): DaoConfig {
  return daoConfigByNetwork[network];
}
