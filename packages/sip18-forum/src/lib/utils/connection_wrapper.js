let _mod = null;
function assertBrowser() {
    if (typeof window === 'undefined')
        throw new Error('Wallet API is browser-only.');
}
async function mod() {
    assertBrowser();
    return (_mod ??= import('@stacks/connect'));
}
// implementation
export async function request(...args) {
    const { request } = await mod();
    return request(...args);
}
/* ----------- (optional) other wrappers ----------- */
export async function connect(opts) {
    const { connect } = await mod();
    return connect(opts ?? {});
}
export async function disconnect(opts) {
    const { disconnect } = await mod();
    return disconnect();
}
export async function isConnected() {
    const { isConnected } = await mod();
    return isConnected();
}
export async function getLocalStorage() {
    const { getLocalStorage } = await mod();
    return getLocalStorage?.();
}
//# sourceMappingURL=connection_wrapper.js.map