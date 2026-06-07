# BigMarket Protocol Message v1 (BMP1)

Status: draft
Owner: vault / cross-chain
Scope: `contracts/stacks/bigmarket-dao/contracts/extensions/vault/bme050-0-vault.clar`

## Why

The vault custodies user funds keyed by

```
(controller-chain, controller-address, mapped-address, token)
```

`tx-sender` does not control those funds. Every action that moves them
(withdraw, buy, sell, claim) must therefore be authorised by a signature
from the controller key — not by whoever happens to broadcast the
transaction.

To keep wallet signing UX uniform across chains (EVM `personal_sign`,
Bitcoin `signMessage`, Stacks structured data, Solana / Sui ed25519,
WebAuthn P-256), all vault-bound user actions are expressed as the same
**fixed-length 256-byte byte string** that we sign and verify. The
on-chain parser reads the same offsets every time; only the per-opcode
body slots are interpreted differently.

## Wire format

The message is exactly **256 bytes**. All multi-byte integers are
big-endian.

```
═══════════════════════════════════════════════════════════════════════
Offset  Len   Field                Notes
─────────────────────────────────────────────────────────────────────
0x00    8     magic                "BMP1MSG\0"  = 0x424d50314d534700
0x08    1     opcode               1 withdraw | 2 buy | 3 sell | 4 claim
0x09    1     version              0x01
0x0A    2     flags                reserved, must be 0x0000
0x0C    4     controller-chain     0x00000001 EVM
                                   0x00000002 BTC
                                   0x00000003 Stacks
                                   0x00000004 Solana / Sui (ed25519)
                                   0x00000005 WebAuthn (secp256r1)
0x10    32    controller-address   normalised 32-byte form
                                   - secp256k1 chains: 12 zero bytes ||
                                     20-byte address
                                   - ed25519 chains:  raw 32-byte pubkey
0x30    16    nonce                u128, must equal the vault's stored
                                   per-controller nonce
0x40    32    slot0                per-opcode (see below)
0x60    32    slot1                per-opcode
0x80    32    slot2                per-opcode
0xA0    32    slot3                per-opcode
0xC0    32    slot4                per-opcode
0xE0    32    slot5                per-opcode
0x100   ----  end (256 bytes)
═══════════════════════════════════════════════════════════════════════
```

The first 0x40 bytes are the **envelope**. The next 0xC0 bytes are the
**body** (six 32-byte slots).

### Commitments

To keep the body fixed-length while still committing to variable-length
Stacks principals, the body uses _commitments_ rather than the principals
themselves:

```
commit(principal) = keccak256( consensus-serialised-buff(principal) )
```

where the consensus serialisation is whatever `to-consensus-buff?`
produces for that principal — the same bytes used in receipts and
runtime serialisation. The on-chain entrypoint takes the raw principal
as a parameter and recomputes the commitment to check equality.

## Opcode body schemas

For every opcode `slot0` is the token-commit and `slot1` is the
mapped-address commit (the Stacks principal under which the balance
slot is stored). This locks the message to a specific balance entry.

### 0x01 — WITHDRAW

```
slot0   keccak256(consensus(token-principal))
slot1   keccak256(consensus(mapped-address-principal))
slot2   keccak256(consensus(recipient-principal))
slot3   0x00..00 (16) || amount      u128 BE
slot4   0x00..00 (16) || expiry      u128 BE, stacks-block-height; 0 = no expiry
slot5   0x00..00 (32) reserved
```

### 0x02 — BUY_SHARES

```
slot0   keccak256(consensus(token-principal))
slot1   keccak256(consensus(mapped-address-principal))
slot2   0x00..00 (16) || market-id   u128 BE
slot3   0x00..00 (16) || outcome     u128 BE
slot4   amount-in (u128 BE, 16 bytes) || min-shares-out (u128 BE, 16 bytes)
slot5   0x00..00 (16) || expiry      u128 BE
```

### 0x03 — SELL_SHARES

```
slot0   keccak256(consensus(token-principal))
slot1   keccak256(consensus(mapped-address-principal))
slot2   0x00..00 (16) || market-id   u128 BE
slot3   0x00..00 (16) || outcome     u128 BE
slot4   shares-in (u128 BE, 16 bytes) || min-tokens-out (u128 BE, 16 bytes)
slot5   0x00..00 (16) || expiry      u128 BE
```

### 0x04 — CLAIM_WINNINGS

```
slot0   keccak256(consensus(token-principal))
slot1   keccak256(consensus(mapped-address-principal))
slot2   0x00..00 (16) || market-id   u128 BE
slot3   0x00..00 (32) reserved
slot4   0x00..00 (32) reserved
slot5   0x00..00 (16) || expiry      u128 BE
```

Reserved slots and reserved zero halves of partial slots **must** be
zero — the verifier may reject non-zero reserved bytes in a future
revision.

## Replay protection

Two mechanisms, both required:

1. **Nonce** at offset 0x30 must equal the current
   `(get-nonce controller-chain controller-address)`. The vault
   increments this nonce on every successful state-changing call from
   this controller, across _all_ opcodes.
2. **Expiry** (when non-zero) must be ≥ `stacks-block-height`.

Because the nonce is per-controller and shared across opcodes, the
signer cannot reorder pending operations or replay a stale one.

## Signing schemes

The same 256-byte payload is signed using each chain's native message
flow. The verifier reconstructs the chain-specific digest before
recovery / verification.

| chain        | curve     | digest                                                               | signature                  |
| ------------ | --------- | -------------------------------------------------------------------- | -------------------------- |
| `CHAIN_EVM`  | secp256k1 | `keccak256("\x19Ethereum Signed Message:\n256" \|\| msg)`            | 65 bytes `r \|\| s \|\| v` |
| `CHAIN_BTC`  | secp256k1 | `dsha256("\x18Bitcoin Signed Message:\n" \|\| varint(256) \|\| msg)` | 65 bytes recoverable       |
| `CHAIN_STX`  | secp256k1 | Stacks signed-structured-data envelope over `msg`                    | 65 bytes recoverable       |
| `CHAIN_SOL`  | ed25519   | `msg` (raw bytes)                                                    | 64 bytes `R \|\| s`        |
| `CHAIN_P256` | secp256r1 | WebAuthn-wrapped over `msg`                                          | scheme-specific            |

> **This revision implements `CHAIN_EVM` only.** The other chain ids
> are accepted in the envelope but the on-chain verifier currently
> returns `ERR_SIG_SCHEME (u7118)`. The plumbing is shaped so that the
> additional verifiers slot in without changing the entrypoint.

### EVM verification flow

`secp256k1-recover?` in Clarity returns the **compressed** pubkey, but
the canonical EVM address derivation requires the **uncompressed**
form. The relayer therefore supplies the controller's uncompressed
pubkey alongside the signature. The contract:

1. Computes `digest = keccak256(EIP191_PREFIX_256 || message)`.
2. Recovers the compressed pubkey from `(digest, signature)`.
3. Recompresses the caller-supplied uncompressed pubkey
   (`prefix = 0x02` if Y is even, else `0x03`; concatenated with X)
   and asserts it equals the recovered compressed key. This proves
   the supplied uncompressed key really is the signer's.
4. Derives `addr = keccak256(uncompressed)[12:32]` and asserts it
   equals the low 20 bytes of `controller-address` in the message.

## On-chain entrypoint

```clarity
(define-public (withdraw
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (token          <sip010>)
    (mapped-address principal)
    (recipient      principal))
  ...)
```

### Vault market relay (single API)

All three market opcodes share one HTTP handler:

`POST /cross-chain/protocol/vault-market-op`

```json
{
  "operation": "buy-shares | sell-shares | claim-winnings",
  "message": "0x…",
  "signature": "0x…",
  "pubkey": "0x…",
  "mappedAddress": "ST…",
  "marketExtension": "SP….bme024-0-market-predicting",
  "tokenContract": "SP….token",
  "controllerAddress": "0x…"
}
```

Clarity entrypoints: `buy-shares`, `sell-shares`, `claim-winnings` on
`bme050-0-vault`, each taking `(message, signature, pubkey, token, mapped, market-trait)`.

**OP_BUY_SHARES (0x02)** slot layout:

- slot2: outcome-index (high 16) || market-id (low 16)
- slot3: keccak256(consensus(market-extension))
- slot4: max-cost (high 16) || min-shares (low 16)

**OP_SELL_SHARES (0x03):** slot4 = min-refund (high) || shares-in (low).

**OP_CLAIM_WINNINGS (0x04):** slot2 = market-id (low 16) only; slot3 = market commit.

Errors specific to message handling:

| code  | constant             | meaning                                         |
| ----- | -------------------- | ----------------------------------------------- |
| u7110 | ERR_MSG_MAGIC        | magic prefix != `BMP1MSG\0`                     |
| u7111 | ERR_MSG_VERSION      | version != 0x01                                 |
| u7112 | ERR_MSG_OPCODE       | opcode does not match the entrypoint            |
| u7113 | ERR_TOKEN_COMMIT     | slot0 != keccak256(consensus(token))            |
| u7114 | ERR_MAPPED_COMMIT    | slot1 != keccak256(consensus(mapped-address))   |
| u7115 | ERR_RECIPIENT_COMMIT | slot2 != keccak256(consensus(recipient))        |
| u7116 | ERR_EXPIRED          | expiry < stacks-block-height                    |
| u7117 | ERR_PUBKEY_MISMATCH  | supplied pubkey does not match recovered pubkey |
| u7118 | ERR_SIG_SCHEME       | controller-chain not implemented yet            |

## Reference encoder (TypeScript)

```ts
import { keccak_256 } from "@noble/hashes/sha3";
import {
  serializeCV,
  principalCV,
  contractPrincipalCV,
} from "@stacks/transactions";

const CHAIN_EVM = "0x00000001";

const MAGIC = new Uint8Array([0x42, 0x4d, 0x50, 0x31, 0x4d, 0x53, 0x47, 0x00]);

function u128be(n: bigint): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return out;
}

function padHexAddress(addr: `0x${string}`): Uint8Array {
  const raw = Buffer.from(addr.slice(2), "hex"); // 20 bytes
  const out = new Uint8Array(32);
  out.set(raw, 12);
  return out;
}

function commit(principal: string): Uint8Array {
  const isContract = principal.includes(".");
  const cv = isContract
    ? contractPrincipalCV(...(principal.split(".") as [string, string]))
    : principalCV(principal);
  return keccak_256(Buffer.from(serializeCV(cv), "hex"));
}

export function encodeWithdrawMessage(params: {
  evmAddress: `0x${string}`;
  nonce: bigint;
  tokenPrincipal: string;
  mappedPrincipal: string;
  recipientPrincipal: string;
  amount: bigint;
  expiryBlock: bigint; // 0n = never
}): Uint8Array {
  const buf = new Uint8Array(256);
  buf.set(MAGIC, 0x00);
  buf[0x08] = 0x01; // opcode = WITHDRAW
  buf[0x09] = 0x01; // version
  // flags 0x0A..0x0B left zero
  buf.set(Buffer.from(CHAIN_EVM.slice(2), "hex"), 0x0c);
  buf.set(padHexAddress(params.evmAddress), 0x10);
  buf.set(u128be(params.nonce), 0x30);
  buf.set(commit(params.tokenPrincipal), 0x40);
  buf.set(commit(params.mappedPrincipal), 0x60);
  buf.set(commit(params.recipientPrincipal), 0x80);
  // slot3: amount (low 16 of 32)
  buf.set(u128be(params.amount), 0xa0 + 16);
  // slot4: expiry (low 16 of 32)
  buf.set(u128be(params.expiryBlock), 0xc0 + 16);
  // slot5 reserved (already zero)
  return buf;
}
```

To sign as an EVM user via wallet-connect / MetaMask:

```ts
const message = encodeWithdrawMessage({...});
const signatureHex = await wallet.signMessage({ raw: message });
```

The relayer then calls:

```ts
contractCall({
  contractAddress: VAULT_DEPLOYER,
  contractName: "bme050-0-vault",
  functionName: "withdraw",
  functionArgs: [
    bufferCV(message), // (buff 256)
    bufferCV(hexToBytes(signatureHex)), // (buff 65)
    bufferCV(uncompressedPubkey), // (buff 64)  X || Y
    contractPrincipalCV(tokenAddr, tokenName),
    standardPrincipalCV(mappedAddress),
    standardPrincipalCV(recipient),
  ],
});
```

## Compatibility notes

- The envelope is identical across opcodes so that off-chain signing
  UX, server-side message builders, and on-chain parsing share one code
  path. Adding a new opcode means defining its slot schema and writing
  a new entrypoint — no envelope changes.
- The 256-byte length is deliberately well under the largest payload
  wallets render legibly. EVM wallets show the hex preview; future
  revisions can keep the layout and add a parallel EIP-712 typed-data
  presentation pointing at the same bytes.
- Adding ed25519 (Solana / Sui) requires only the `ed25519-verify?`
  built-in landing in Clarity. The controller-address slot already
  carries the 32-byte raw pubkey for ed25519 chains.
- Adding WebAuthn (P-256) requires `secp256r1-verify?` plus a wrapping
  step that extracts the `clientDataJSON` digest committing to the
  256-byte payload before verification.
