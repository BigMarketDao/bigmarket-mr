## Security Review

### High Priority

**Relayer-trusted EIP-712 string hashes**
The `eip712-token-hash`, `eip712-mapped-hash`, and `eip712-recipient-hash` are passed in by the relayer and never verified against the actual principals on-chain. The contract checks that the BMP1 slots match `keccak256(consensus(principal))`, and separately that the EIP-712 struct uses the relayer-supplied hashes — but nothing binds these two commitments together. A malicious or compromised relayer could pass a valid BMP1 signature for one token while substituting a different token's EIP-712 hash, potentially causing the EVM signature check to pass for a different set of parameters than what the Stacks-side logic acts on. Whether this is exploitable depends on whether a user could be tricked into signing a message that passes both checks simultaneously with mismatched params — worth thinking through carefully.

**`unwrap-panic` throughout**
Heavy use of `unwrap-panic` in message parsing (`msg-slice-*`, `slot-low-uint`, `slot-high-uint`) means any malformed input causes a runtime panic rather than a graceful error. Since the message is a fixed `(buff 256)`, slice bounds should always be valid — but this is a fragile assumption. If the message format ever changes or a caller somehow passes unexpected data, you get an abrupt abort with no diagnostic error code. Defensive `unwrap!` with explicit error codes would be safer.

**Nonce is global across all opcodes**
A single nonce sequence covers withdraw, buy, sell, and claim. This means operations are strictly serialized per controller — there's no parallelism possible. More importantly, if a relayer has a signed buy-shares message and a signed withdraw message both at nonce N, only one can ever be used; the other is silently invalidated. Users may not realize this. If a relayer goes offline mid-sequence, a user could be locked out of their current nonce slot. Consider whether opcode-scoped nonces would be better, or at minimum document the constraint clearly.

**`deposit-for` has no signature verification**
Any caller can invoke `deposit-for` and credit funds to an arbitrary `(controller-chain, controller-address, mapped-address)` tuple — provided they hold the tokens. If a relayer accidentally (or maliciously) passes the wrong controller identity, funds are credited to the wrong ledger entry with no recourse. There's no on-chain proof that the controller consented to having funds associated with their identity. This is probably an acceptable trust assumption for the relayer model, but it's worth being explicit about.

**`sell-shares` / `claim-winnings` don't check `current-balance >= 0`**
These operations bring funds _in_ rather than debiting, so there's no balance check before the market call. That's correct by design — but it means the vault will accept and credit any return value from the market extension, including unexpectedly large amounts. If the market extension has a bug or is compromised, it could inflate vault ledger entries arbitrarily. You're relying entirely on the market extension being correct and the `prediction-market-trait` being a meaningful constraint.

---

### Medium Priority

**`verify-evm-recover-*` duplication**
`verify-evm-recover-256`, `verify-evm-recover-288`, and `verify-evm-recover-384` are near-identical functions differing only in buffer size. Clarity's type system forces this since buffer lengths are compile-time constants, but it means the same logic (pubkey recompression, address derivation, equality checks) is copy-pasted three times. Any future bug fix needs to be applied to all three — easy to miss one.

**Domain separator has no chain ID**
The EIP-712 domain deliberately omits `chainId` (the comment says replay protection comes from the nonce). This means a signed EVM message is valid on any EVM chain that deploys a compatible contract. The nonce does prevent replay _within_ this vault, but if BigMarket deploys on multiple EVM chains, a message signed on chain A is valid on chain B until the nonce advances. Worth confirming this is intentional.

**`check-address` only checks for all-zeros**
The address validation just rejects `ZERO_32`. It doesn't validate chain-specific structure — for EVM it doesn't check that bytes 0–11 are zero padding, for example. A controller address with garbage in the high bytes would pass validation and be stored, potentially causing lookup mismatches if the same user is referenced with different padding elsewhere.

**Expiry uses `stacks-block-height`**
Expiry is checked against Stacks block height, not wall-clock time. If Stacks block times vary (or during a chain halt), expiry windows can be unpredictably short or long. This is standard for Stacks contracts but worth noting for UX — the SDK should probably translate wall-clock expiry intent into block heights conservatively.

---

### Low Priority

- **No way to recover mis-credited funds.** If `deposit-for` credits the wrong controller, there's no admin escape hatch short of a DAO upgrade.
- **`allowed-tokens` whitelist is DAO-only.** Good, but worth confirming the DAO timelock (if any) is sufficient to prevent a rushed malicious token addition.
- **`callback` is a no-op.** Fine for now, but if the extension trait ever expects meaningful callback behavior this will silently do nothing.
- **No events on token whitelist changes.** `set-token-allowed` has no `print`, making it harder to monitor whitelist changes off-chain.

---

What's the idea you wanted to run by me?
