/**
 * SSR-only stub for `@stacks/connect`.
 * Real v8 connect depends on @reown/appkit → pino/thread-stream which uses `__dirname`
 * (invalid in bundled ESM). Wallet/session APIs are browser-only; this module is only
 * resolved when Vite bundles the server graph (`resolveId` with `ssr: true`).
 */
export async function connect(): Promise<void> {
  throw new Error("Wallet connect is only available in the browser.");
}

export async function disconnect(): Promise<void> {}

export async function isConnected(): Promise<boolean> {
  return false;
}

export async function getLocalStorage(): Promise<null> {
  return null;
}

/** Used by SIP-030 RPC / contract calls from the wallet. */
export async function request(): Promise<never> {
  throw new Error("Stacks wallet request is only available in the browser.");
}
