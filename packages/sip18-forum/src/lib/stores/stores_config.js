import { get } from "svelte/store";
import { writable } from "svelte/store";
export function switchConfig(env) {
    configStore.set(config[env]);
}
export function getConfig() {
    return get(configStore);
}
export function getNetworkFromUrl(url) {
    const chain = url.searchParams.get("chain");
    return chain && ["mainnet", "testnet", "devnet"].includes(chain)
        ? chain
        : "mainnet";
}
export const config = {
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
//# sourceMappingURL=stores_config.js.map