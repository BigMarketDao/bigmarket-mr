export interface ForumConfig {
    VITE_PUBLIC_APP_NAME: string;
    VITE_PUBLIC_APP_VERSION: string;
    VITE_NETWORK: string;
    VITE_FORUM_API: string;
    VITE_STACKS_API: string;
}
export declare function switchConfig(env: string): void;
export declare function getConfig(): ForumConfig;
export declare function getNetworkFromUrl(url: URL): string;
export declare const config: {
    [key: string]: ForumConfig;
};
export declare let configStore: import("svelte/store").Writable<ForumConfig>;
//# sourceMappingURL=stores_config.d.ts.map