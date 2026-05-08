// /**
//  * phantom-signing.ts
//  * Frontend integration — what Phantom signs for each vault operation.
//  *
//  * Deposit:   No sig needed from Phantom. User just bridges via Allbridge UI.
//  * Register:  One-time sig to link Stacks wallet to Solana pubkey (Path A only).
//  * Withdraw:  Phantom signs (nonce + amount + destination) — relayer cannot forge or redirect.
//  */

// import { buildWithdrawMessage, buildRegisterMessage } from "./relayer";

// // ---------------------------------------------------------------------------
// // PHANTOM WALLET INTERFACE
// // ---------------------------------------------------------------------------

// interface PhantomProvider {
//   publicKey: { toBytes(): Uint8Array; toBase58(): string };
//   signMessage(message: Uint8Array, encoding: "utf8" | "hex"): Promise<{ signature: Uint8Array }>;
//   connect(): Promise<void>;
// }

// declare const window: Window & { phantom?: { solana?: PhantomProvider } };

// function getPhantom(): PhantomProvider {
//   const phantom = window.phantom?.solana;
//   if (!phantom) throw new Error("Phantom wallet not found");
//   return phantom;
// }

// // ---------------------------------------------------------------------------
// // DEPOSIT FLOW (Path B — no Stacks wallet)
// //
// // 1. User specifies amount
// // 2. Frontend calls backend to register deposit intent → gets depositId + bridgeToAddress
// // 3. User bridges via Allbridge to bridgeToAddress (standard Allbridge UI or SDK)
// // 4. Backend watches for arrival and calls vault.deposit() automatically
// //
// // No Phantom signing required for deposit. The solanaPubkey is read from the
// // connected wallet and sent to the backend as the vault key.
// // ---------------------------------------------------------------------------

// export async function initiateDeposit(amount: bigint): Promise<{
//   depositId: string;
//   bridgeToAddress: string;
//   instructions: string;
// }> {
//   const phantom = getPhantom();
//   const solanaPubkey = phantom.publicKey.toBase58();

//   // Register with backend — backend puts pending deposit on-chain
//   const response = await fetch("/api/vault/deposit/register", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ solanaPubkey, amount: amount.toString() }),
//   });

//   const { depositId, bridgeToAddress, expiryBlocks } = await response.json();

//   return {
//     depositId,
//     bridgeToAddress,
//     instructions:
//       `Bridge ${amount} tokens to Stacks address: ${bridgeToAddress}\n` +
//       `Use deposit ID ${depositId} as the bridge memo if supported.\n` +
//       `This deposit expires in ~${expiryBlocks} Stacks blocks.`,
//   };
// }

// // ---------------------------------------------------------------------------
// // WITHDRAWAL FLOW (Path B — Phantom signs, relayer submits)
// //
// // 1. Frontend fetches current nonce for this Solana key from vault (read-only)
// // 2. User signs (nonce+1, amount, destinationSolanaAddr) with Phantom
// // 3. Frontend sends sig to backend
// // 4. Backend verifies sig locally, submits to vault, initiates bridge on confirmation
// //
// // The destination address is locked into the sig — relayer cannot redirect.
// // ---------------------------------------------------------------------------

// export async function initiateWithdrawal(
//   amount: bigint,
//   destinationSolanaAddr?: string,  // defaults to the user's own connected address
// ): Promise<{ txId: string }> {

//   const phantom = getPhantom();
//   const solanaPubkey = phantom.publicKey.toBase58();
//   const destination = destinationSolanaAddr ?? solanaPubkey;

//   // Fetch current nonce from vault (read-only call to Stacks)
//   const currentNonce = await fetchVaultNonce(solanaPubkey);
//   const nonce = currentNonce + 1n;

//   // Build the exact message the vault contract will verify
//   const destinationBytes = Buffer.from(
//     (await import("bs58")).default.decode(destination)
//   );
//   const message = buildWithdrawMessage(nonce, amount, destinationBytes);

//   // Sign with Phantom
//   // Phantom's signMessage signs the raw bytes — no hashing — matching ed25519-verify in Clarity
//   const { signature } = await phantom.signMessage(message, "utf8");

//   // Send to backend relayer
//   const response = await fetch("/api/vault/withdraw", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       solanaPubkey,
//       amount: amount.toString(),
//       nonce: nonce.toString(),
//       destinationSolanaAddr: destination,
//       sig: Buffer.from(signature).toString("hex"),
//     }),
//   });

//   return response.json();
// }

// // ---------------------------------------------------------------------------
// // PATH A — REGISTRATION (one-time, links Stacks wallet to Solana pubkey)
// //
// // Called once when a user with a Stacks wallet wants to use Path A.
// // Phantom signs a message approving the Stacks principal.
// // The Stacks wallet then submits the registration tx to vault.register-stacks-address().
// // ---------------------------------------------------------------------------

// export async function registerStacksWallet(stacksAddress: string): Promise<{
//   solanaPubkey: string;
//   sig: string;
//   stacksAddress: string;
// }> {
//   const phantom = getPhantom();
//   const solanaPubkey = phantom.publicKey.toBase58();

//   const message = buildRegisterMessage(stacksAddress);
//   const { signature } = await phantom.signMessage(message, "utf8");

//   // Return sig for the Stacks wallet to include in the register-stacks-address tx
//   // The Stacks wallet (Leather/Xverse) submits this — not the relayer
//   return {
//     solanaPubkey,
//     sig: Buffer.from(signature).toString("hex"),
//     stacksAddress,
//   };
// }

// // ---------------------------------------------------------------------------
// // HELPERS
// // ---------------------------------------------------------------------------

// async function fetchVaultNonce(solanaPubkey: string): Promise<bigint> {
//   // Read-only call to vault.get-nonce() on Stacks
//   const pubkeyHex = Buffer.from(
//     (await import("bs58")).default.decode(solanaPubkey)
//   ).toString("hex");

//   const response = await fetch(
//     `https://api.mainnet.hiro.so/v2/contracts/call-read/` +
//     `${process.env.NEXT_PUBLIC_VAULT_CONTRACT}/vault/get-nonce`,
//     {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         sender: process.env.NEXT_PUBLIC_RELAYER_ADDRESS,
//         arguments: [`0x02${pubkeyHex}`], // Clarity buffer encoding
//       }),
//     }
//   );

//   const { result } = await response.json();
//   // Parse the Clarity uint response
//   return BigInt(result.replace("0x", "").replace("u", ""));
// }
