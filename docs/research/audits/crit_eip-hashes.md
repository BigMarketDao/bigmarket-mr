#Problem: EIP-712 String Hash Binding

````3 Critical	BME050
EIP-712 string hashes unbound to on-chain principals. eip712-token-hash, eip712-mapped-hash, eip712-recipient-hash are relayer-supplied and never verified against actual principals. Compromised relayer can pass mismatched hashes to pass EVM sig check with wrong parameters.
Open — requires on-chain UTF-8 hashing or SDK-enforced binding```

## Fix for EIP-712 String Hash Binding

The problem is that `eip712-token-hash`, `eip712-mapped-hash`, and `eip712-recipient-hash` are relayer-supplied and never verified against the actual principals the vault is operating on. The contract checks the BMP1 slots against `keccak256(consensus(principal))` and separately checks the EIP-712 struct uses the relayer hashes — but nothing ties these two together.

The fix is simple: compute the EIP-712 display string hash on-chain from the same principals already validated, and ignore the relayer-supplied hashes entirely for the fields where you can do this.

The wrinkle is that EIP-712 string fields use `keccak256(utf8(string))` — e.g. `keccak256("SP2ABC...token-contract")` — and Clarity can't produce UTF-8 strings of principals at runtime. However, you already have the consensus-serialized form. The solution is to commit to a canonical encoding in the EIP-712 typehash definition that uses the consensus encoding directly, bypassing UTF-8 display strings entirely.

**Change the EIP-712 type definition on the SDK side** to treat token, mappedAddress, and recipient as `bytes32` (consensus hash) rather than `string`. This means the typehash constants change, but the wallet signs `keccak256(consensus(principal))` directly as a `bytes32` field — exactly what the vault already computes for the BMP1 slot verification.

The on-chain change is then minimal:

```clarity
;; Remove the three eip712-*-hash parameters from all public functions.
;; Compute them directly from the principals already in scope:

(define-private (principal-to-eip712-bytes32 (p principal))
  (keccak256 (unwrap-panic (to-consensus-buff? p))))
````

Then in `verify-evm-withdraw`, `verify-evm-buy-shares` etc., replace the passed-in hash parameters with computed values:

```clarity
(define-private (verify-evm-withdraw
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32))
    (token-contract principal)   ;; was: (token-hash (buff 32))
    (recipient      principal))  ;; was: (recipient-hash (buff 32))
  (let
    (
      (token-hash     (principal-to-eip712-bytes32 token-contract))
      (recipient-hash (principal-to-eip712-bytes32 recipient))
      (parsed         (parse-message message))
      (bmp1-hash      (keccak256 message))
      (nonce32        (concat ZERO_16 (get nonce parsed)))
      (struct-encoded
        (concat EIP712_WITHDRAW_TYPEHASH
          (concat controller
            (concat (slot-low-as-uint256 (get slot3 parsed))
              (concat bmp1-hash
                (concat nonce32
                  (concat EIP712_OP_WITHDRAW
                    (concat recipient-hash
                      token-hash))))))))
    )
    (verify-evm-recover-256 ...)))
```

Apply the same pattern to `verify-evm-buy-shares` and `verify-evm-sell-shares` / `verify-evm-claim-winnings` — pass principals not hashes, compute inside.

The public function signatures on BME050 then drop the three `eip712-*-hash` parameters entirely, and `verify-message-signature` passes principals through rather than hashes. The relayer no longer supplies anything that can diverge from what the vault is actually acting on.

**The SDK change** is updating the EIP-712 type string from:

```
string token
string recipient
string mappedAddress
```

to:

```
bytes32 token
bytes32 recipient
bytes32 mappedAddress
```

And computing those `bytes32` values as `keccak256(consensusSerialize(principal))` rather than `keccak256(utf8(displayString))`. MetaMask will show the hex hash rather than a human-readable string for these fields, which is a minor UX tradeoff — but it closes the binding gap completely and removes an entire class of relayer-supplied inputs that could be manipulated.

`will this make the signature parameters in the evm wallet unreadable for humans?`

Yes, it will. Instead of MetaMask showing:

```
token: "SP2ABC...sbtc-token"
recipient: "SP3XYZ...alice"
```

It would show:

```
token: 0x7f3a9b...
recipient: 0x2c8f1d...
```

Which is meaningless to a human signer. That's a real UX problem — the whole point of EIP-712 structured data is that wallets render it readably so users can verify what they're signing before approving.

---

## Better Approach: Verify the Hash Binding On-Chain

Keep the display strings in EIP-712 (so MetaMask stays readable), but add an on-chain step that verifies the relayer-supplied hash actually matches the principal being used.

The binding you need is:

```
eip712-token-hash == keccak256(utf8(display-string-of token-contract))
```

Clarity can't produce the UTF-8 display string of a principal at runtime — that's the root constraint. But you can invert the problem. Instead of computing the hash on-chain, you make the relayer supply the display string itself as a `(buff N)`, then hash it on-chain:

```clarity
(define-public (withdraw
    ...
    (token-display-utf8    (buff 128))
    (mapped-display-utf8   (buff 128))
    (recipient-display-utf8 (buff 128)))
```

Then on-chain:

```clarity
(define-private (verify-display-binding
    (principal-val  principal)
    (display-utf8   (buff 128)))
  ;; The display string must hash to what the consensus encoding commits to
  ;; via a known deterministic mapping. We verify the utf8 string is
  ;; consistent with the principal by checking it parses back correctly.
  ;;
  ;; Clarity: principal-of? doesn't exist for arbitrary strings.
  ;; So instead we verify: keccak256(display-utf8) == supplied eip712 hash
  ;; AND consensus-hash of principal == known commitment in BMP1 slot.
  ;; The two commitments use different encodings -- this is the gap.
  (ok (keccak256 display-utf8)))
```

You immediately hit the same wall — Clarity has no `utf8-to-principal` or `principal-to-utf8`. You can hash the supplied bytes but you can't verify they represent the same principal as `token-contract`.

---

## The Actual Root Cause

There are two independent commitments to the same principal:

```
BMP1 slot  →  keccak256(consensus-serialized principal)   [Clarity-verifiable]
EIP-712    →  keccak256(utf8 display string of principal) [NOT Clarity-verifiable]
```

Clarity has no way to bridge these because principal-to-UTF8 serialization isn't available as a built-in. The two hash functions produce different outputs for the same principal, and only one is computable on-chain.

---

## Practical Options

**Option A: Accept the gap, tighten off-chain**

Keep the current design. The relayer supplies the EIP-712 hashes. Document explicitly that the relayer is trusted for this binding. Mitigate by making the SDK the only relayer implementation and having it enforce the binding client-side before submission. The BMP1 slot commitment still provides integrity for the Stacks-side execution — only the EVM wallet display could be spoofed, not the actual funds movement.

The realistic attack requires a malicious relayer who can convince a user to sign a message where the displayed token/recipient differs from what's in the BMP1 slots — but the funds would still move according to the BMP1 slots, not the EIP-712 display. So the attacker can make the wallet show the wrong thing but can't redirect funds to themselves unless the BMP1 slots also commit to a different recipient, which requires a valid signature from the controller key.

This is a phishing vector, not a fund-theft vector, given the BMP1 slot verification is intact.

**Option B: Collapse to a single commitment**

Drop the EIP-712 per-field display strings for principals entirely. Instead include the full BMP1 message hash as the single binding field — which you already do via `bmp1Hash` in the struct. MetaMask shows:

```
bmp1Hash: 0xabc123...   (the hash of the full 256-byte message)
operation: "withdraw"
amount: 1000000
nonce: 42
```

Users don't see token/recipient in MetaMask but the `bmp1Hash` cryptographically binds everything. You'd need to provide a companion tool (a browser extension or dapp UI) that decodes the BMP1 hash and displays the human-readable fields alongside the MetaMask prompt. This is how many protocols handle it — the wallet signs a hash, the dapp shows what it means.

**Option C: Add a Stacks principal registry**

A DAO-maintained on-chain map from `principal → (buff 128)` storing the canonical UTF-8 display string for each whitelisted token and known recipient. The vault looks up the display string and computes `keccak256` on-chain to verify the EIP-712 hash.

```clarity
(define-map principal-display-strings principal (buff 128))
```

Only works for whitelisted tokens (finite, DAO-controlled set) and known recipients (impractical for arbitrary user addresses). Viable for token binding specifically — there are only a handful of whitelisted tokens and the DAO controls both the whitelist and the display string registry. Not viable for `mapped-address` or `recipient` which are arbitrary user principals.

---

## Recommendation

**Option A for recipients and mapped-address** — accept the relayer trust assumption, document it, focus SDK enforcement. The BMP1 slot commitment prevents fund theft; the EIP-712 display mismatch is a phishing risk that requires a compromised relayer.

**Option C for token only** — maintain a DAO-controlled `principal-display-strings` map for the small set of whitelisted tokens. This closes the token binding gap completely on-chain at low cost since the token set is finite and already DAO-gated. Token is the most important field to get right since it's what users most need to verify before signing.
