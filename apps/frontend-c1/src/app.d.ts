// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	interface Window {
		phantom?: {
			solana?: PhantomSolanaProvider;
		};
	}

	// interface Window {

	// 	phantom?: {
	// 		solana?: {
	// 			isConnected: boolean;
	// 			connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<unknown>;
	// 			disconnect: () => Promise<void>;
	// 			publicKey?: {
	// 				toString: () => string;
	// 			};
	// 		};
	// 	};
	// }
}

export {};
