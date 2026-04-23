import { get } from "svelte/store";
import { writable } from "svelte/store";

export interface ForumConfig {
  VITE_PUBLIC_APP_NAME: string;
  VITE_PUBLIC_APP_VERSION: string;
  VITE_NETWORK: string;
  VITE_FORUM_API: string;
  VITE_STACKS_API: string;
}

export function switchConfig(env: string) {
  configStore.set(config[env]);
}

export function getConfig(): ForumConfig {
  return get(configStore);
}

export function getNetworkFromUrl(url: URL): string {
  const chain = url.searchParams.get("chain");
  return chain && ["mainnet", "testnet", "devnet"].includes(chain)
    ? chain
    : "mainnet";
}

export const config: { [key: string]: ForumConfig } = {
  devnet: {
    VITE_PUBLIC_APP_NAME: "BigMarket",
    VITE_PUBLIC_APP_VERSION: "1.0.0",
    VITE_NETWORK: "devnet",
    VITE_FORUM_API: "http://localhost:3025/forum-api",
    VITE_STACKS_API: "https://api.testnet.hiro.so",
  },
  testnet: {
    VITE_PUBLIC_APP_NAME: "BigMarket",
    VITE_PUBLIC_APP_VERSION: "1.0.0",
    VITE_NETWORK: "testnet",
    VITE_FORUM_API: "https://api.forum.bigmarket.ai/forum-api",
    VITE_STACKS_API: "https://api.testnet.hiro.so",
  },
  mainnet: {
    VITE_PUBLIC_APP_NAME: "BigMarket",
    VITE_PUBLIC_APP_VERSION: "1.0.0",
    VITE_NETWORK: "mainnet",
    VITE_FORUM_API: "https://api.forum.bigmarket.ai/forum-api",
    VITE_STACKS_API: "https://api.hiro.so",
  },
};
const initialConfig = config.testnet;
export let configStore = writable(initialConfig);
