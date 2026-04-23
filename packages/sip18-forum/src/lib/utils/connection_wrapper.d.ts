type ConnectModule = typeof import('@stacks/connect');
type RequestOptions = {
    forceWalletSelect?: boolean;
    walletConnectProjectId?: string;
};
export declare function request<M extends string, P = unknown, R = unknown>(method: M, params?: P): Promise<R>;
export declare function request<M extends string, P = unknown, R = unknown>(options: RequestOptions, method: M, params?: P): Promise<R>;
export declare function connect(opts?: Parameters<ConnectModule['connect']>[0]): Promise<import("@stacks/connect/dist/types/methods").GetAddressesResult>;
export declare function disconnect(opts?: Parameters<ConnectModule['disconnect']>): Promise<void>;
export declare function isConnected(): Promise<ReturnType<ConnectModule['isConnected']>>;
export declare function getLocalStorage(): Promise<ReturnType<ConnectModule['getLocalStorage']>>;
export {};
//# sourceMappingURL=connection_wrapper.d.ts.map