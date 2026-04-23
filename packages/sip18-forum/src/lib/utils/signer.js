import { disconnect, isConnected } from './connection_wrapper';
export async function isLoggedIn() {
    try {
        if (typeof window === 'undefined')
            return false;
        return await isConnected();
    }
    catch (err) {
        return false;
    }
}
export async function logUserOut() {
    if (typeof window === 'undefined')
        return;
    return await disconnect();
}
export function isXverse() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
            const stxProvider = localStorage.getItem('STX_PROVIDER') || '';
            return stxProvider.toLowerCase().includes('xverse');
        }
        catch (err) {
            return false;
        }
    }
    return false;
}
export function isLeather() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
            const stxProvider = localStorage.getItem('STX_PROVIDER') || '';
            return stxProvider.toLowerCase().includes('leather');
        }
        catch (err) {
            return false;
        }
    }
    return false;
}
//# sourceMappingURL=signer.js.map