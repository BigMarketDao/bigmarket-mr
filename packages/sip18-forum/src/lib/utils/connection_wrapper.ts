// connection_wrapper.ts
type ConnectModule = typeof import('@stacks/connect');

let _mod: Promise<ConnectModule> | null = null;
function assertBrowser() {
	if (typeof window === 'undefined') throw new Error('Wallet API is browser-only.');
}
async function mod(): Promise<ConnectModule> {
	assertBrowser();
	return (_mod ??= import('@stacks/connect'));
}

// minimal options shape (extend if you use more fields)
type RequestOptions = {
	forceWalletSelect?: boolean;
	walletConnectProjectId?: string;
	// timeoutMs?: number; // add if you need it
};

/* ----------- request overloads (no external types needed) ----------- */

// form 1: request('method', params?)
export async function request<M extends string, P = unknown, R = unknown>(
	method: M,
	params?: P
): Promise<R>;

// form 2: request(options, 'method', params?)
export async function request<M extends string, P = unknown, R = unknown>(
	options: RequestOptions,
	method: M,
	params?: P
): Promise<R>;

// implementation
export async function request(...args: any[]): Promise<any> {
	const { request } = await mod();
	return request(...(args as [any, any?, any?]));
}

/* ----------- (optional) other wrappers ----------- */
export async function connect(opts?: Parameters<ConnectModule['connect']>[0]) {
	const { connect } = await mod();
	return connect(opts ?? {});
}
export async function disconnect(opts?: Parameters<ConnectModule['disconnect']>) {
	const { disconnect } = await mod();
	return disconnect();
}
export async function isConnected(): Promise<ReturnType<ConnectModule['isConnected']>> {
	const { isConnected } = await mod();
	return isConnected();
}
export async function getLocalStorage(): Promise<ReturnType<ConnectModule['getLocalStorage']>> {
	const { getLocalStorage } = await mod();
	return getLocalStorage?.();
}
