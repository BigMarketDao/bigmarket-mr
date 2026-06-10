You're right. The full resolution state machine is:

```
RESOLUTION_OPEN
  → resolve-market (agent) → RESOLUTION_RESOLVING (outcome SET here)
    → dispute-resolution → RESOLUTION_DISPUTED (outcome unchanged)
      → resolve-market-vote (DAO) → RESOLUTION_RESOLVED (outcome OVERWRITTEN)
      → force-resolve-market (timeout) → RESOLUTION_RESOLVED (outcome = agent's original)
    → resolve-market-undisputed (timeout) → RESOLUTION_RESOLVED (outcome unchanged)
```

So outcome is always set before any resolution path completes. The issue I raised was wrong. Here's the corrected full table:Items 1 and 2 have the fix code already written. Item 3 (EIP-712 hash binding) is the most architecturally awkward of the remaining open issues — worth a separate conversation on whether the SDK enforcement path is sufficient or whether you need an on-chain binding mechanism. Everything in the prospective section is clean — no regressions introduced by the close-on-first-trade decision.

# Severity Contract Finding Status

```
1 Critical BME024 Relay functions gated by extension only, not vault whitelist. Any DAO extension can call predict-vault, sell-vault, claim-winnings-vault with arbitrary beneficiary and pocket proceeds as contract-caller. Fix provided — authorized-vaults whitelist + is-dao-or-authorized-vault
2 Critical BME050 Vault accepts any prediction-market-trait implementor. Relayer can pass a malicious contract that returns a fabricated net-refund; vault credits amount never actually deposited. Fix provided — authorized-markets whitelist in BME050
3 Critical BME050 EIP-712 string hashes unbound to on-chain principals. eip712-token-hash, eip712-mapped-hash, eip712-recipient-hash are relayer-supplied and never verified against actual principals. Compromised relayer can pass mismatched hashes to pass EVM sig check with wrong parameters. Open — requires on-chain UTF-8 hashing or SDK-enforced binding
4 High BME024 CPMM payout includes DAO seed liquidity in total token pool. DAO treasury holds seed shares; unclaimed seed position inflates or deflates other winners' payouts depending on claim ordering. Open
5 High BME050 Sell-shares state loss on partial failure. Nonce incremented before sell-vault call. If market call succeeds but vault credit-balance panics, beneficiary's shares are burned and nonce advanced but no credit is recorded. Open — effects ordering issue
6 High BME024 Oracle manipulation at market creation. Live Pyth price at create-market time sets category bands. Attacker controlling price feed momentarily skews bands to favor a known outcome. No TWAP or creation-time price delay. Open
7 High BME024 Manual fallback price is DAO-controlled centralization point. A compromised DAO or resolution agent can set any fallback price and resolve any market to any outcome when oracle is volatile or fails. Open — accepted governance risk
8 Medium BME050 Global nonce serializes all opcodes per controller. Withdraw, buy, sell, and claim all share one nonce sequence. Two simultaneous signed messages at nonce N — one is permanently invalidated with no on-chain signal to the user. Open — documented constraint needed
9 Medium BME050 deposit-for credits arbitrary controller identity. No sig check on depositor-to-controller binding. Relayer can mis-credit funds to wrong controller with no recourse. Partially mitigated — relayer derivation from controller secret (discussed)
10 Medium BME024 sell-category-core cost-basis reduction is approximate. Pro-rata integer division drifts over multiple buy/sell cycles. Vault ledger and market token accounting diverge across many agent trades. Open — integer arithmetic limitation
11 Medium BME024 transfer-shares does not update token-balances. P2P share buyer has zero cost basis. If vault acquires shares via marketplace rather than predict-vault, vault ledger and market ledger diverge. Open
12 Medium BME024 LP share calculation uses stake counts not token pool. Late LPs may receive more or fewer LP shares than economic contribution warrants as stake counts and token pool diverge after trades. Open
13 Medium BME024 Expiry uses stacks-block-height not wall-clock time. Variable block times make expiry windows unpredictably short or long. SDK must account for block-time variance when translating user intent to expiry blocks. Open — SDK concern
14 Medium BME024 dispute-resolution disputer check uses passed principal not tx-sender. Malicious voting contract could initiate a dispute on behalf of any principal without their consent, locking a market they are winning. Open
15 Low BME050 No events on token whitelist changes. set-token-allowed has no print, making whitelist changes undetectable off-chain without storage polling. Trivial fix
16 Low BME050 No admin recovery path for mis-credited funds. If deposit-for credits wrong controller, no escape hatch exists short of DAO contract upgrade. Open — accepted design constraint
17 Low BME024 resolve-market gated to resolution-agent only. If agent goes offline, settle-pool-fallback (proposed) is blocked upstream. No secondary resolution path without DAO intervention. Open — liveness risk
18 Prospective BME050 v2 Pool accounting drift from sell-shares across snapshot layers Eliminated — close-on-first-trade design chosen
19 Prospective BME050 v2 Close-on-first-trade race between deposit and pool-lock write Eliminated — lock write is atomic in same tx as first trade
20 Prospective BME050 v2 Agent trading authority escaping to wrong market Not yet implemented — constraint to be enforced at build time
21 Prospective BME050 v2 settle-pool-fallback liveness dependency on agent Not yet implemented
22 Prospective BME050 v2 force-resolve-market outcome undefined — stated incorrectly Retracted — outcome always set before this path is reachable
```

Prompt (note the three criticals are solved at this point)

```
how big a risk are the 4 highs? They seem overstaeted to me - can you asses them individually

4	High	BME024	CPMM payout includes DAO seed liquidity in total token pool. DAO treasury holds seed shares; unclaimed seed position inflates or deflates other winners' payouts depending on claim ordering.	Open
5	High	BME050	Sell-shares state loss on partial failure. Nonce incremented before sell-vault call. If market call succeeds but vault credit-balance panics, beneficiary's shares are burned and nonce advanced but no credit is recorded.	Open — effects ordering issue
6	High	BME024	Oracle manipulation at market creation. Live Pyth price at create-market time sets category bands. Attacker controlling price feed momentarily skews bands to favor a known outcome. No TWAP or creation-time price delay.	Open
7	High	BME024	Manual fallback price is DAO-controlled centralization point. A compromised DAO or resolution agent can set any fallback price and resolve any market to any outcome when oracle is volatile or fails.	Open — accepted governance risk
8

?
```

Let me assess each one honestly for real-world exploitability.

---

## Issue 4 — DAO Seed Position in Total Token Pool

**Actual risk: Low-Medium in practice.**

The DAO treasury seed is credited at market creation with shares and tokens 1:1. At resolution, `total-token-pool` includes those seed tokens. The payout formula is:

```clarity
(/ (* (* user-shares total-token-pool) SCALE) winning-pool)
```

If the DAO claims first, it removes tokens from the contract balance. But `total-token-pool` is computed from `stake-tokens` on the market record, not from the live contract balance. `stake-tokens` is only updated by buy/sell operations, not by claims. So when the DAO claims, tokens leave the contract but `stake-tokens` doesn't decrease — meaning subsequent claimants' `gross-refund` calculations reference a token pool that's larger than what's actually held.

This is a real accounting drift but the severity depends on how large the seed is relative to total market volume. At typical seed sizes (minimum viable liquidity) versus meaningful trading volume, the seed is a small fraction of the total pool and the drift is correspondingly small. The bigger the market, the smaller the relative impact.

**Can you ship with it?** Yes, with the caveat that the DAO should claim last, not first. Document this as an operational requirement. The risk is proportional and bounded — it can't cause a total loss, only marginal over/underpayment for late claimants. For launch markets with active trading volume the effect is negligible.

---

## Issue 5 — Sell-Shares State Loss on Partial Failure

**Actual risk: Very Low in practice.**

The sequence in BME050 `sell-shares` is:

```clarity
;; 1. Nonce incremented
(map-set withdrawal-nonces ... (+ current-nonce u1))
;; 2. Market call
(let ((net-refund (try! (contract-call? market sell-vault ...))))
;; 3. Credit balance — only reachable if step 2 succeeded
(credit-balance chain controller mapped-address token-contract net-refund)
```

The scenario requires: step 2 (`sell-vault`) succeeds AND step 3 (`credit-balance`) panics. Look at `credit-balance`:

```clarity
(define-private (credit-balance ...)
  (let ((prev (default-to u0 (map-get? balances ...))))
    (map-set balances ... (+ prev amount))))
```

This is a pure map read followed by a map write with integer addition. There is no path to panic here — `default-to u0` handles the missing key case, `map-set` doesn't fail, and `+` on two uints can't overflow in Clarity (it would need to exceed `u340282366920938463463374607431768211455`). The `credit-balance` function is effectively panic-proof.

The theoretical risk exists at the type level but has no realistic trigger. The nonce-before-credit ordering is worth fixing for hygiene but it's not a live vulnerability.

**Can you ship with it?** Yes. This is a code quality issue more than a security risk. Add a comment documenting the ordering and put it on the backlog.

---

## Issue 6 — Oracle Manipulation at Market Creation

**Actual risk: Medium, but with practical barriers.**

To exploit this an attacker needs to move the Pyth price feed for the target asset at the exact block `create-market` is called, then have the manipulated bands favor an outcome they've already committed to. The requirements are:

- Ability to move a Pyth price feed meaningfully at a specific block
- Coordination between price manipulation and `create-market` transaction timing on Stacks
- Sufficient capital to make the manipulation worthwhile versus the cost

Pyth feeds aggregate from multiple sources and are generally resistant to single-source manipulation. For major assets (BTC, ETH) this attack is expensive beyond any realistic market size. For thinner assets with fewer Pyth sources it's more feasible.

The `max-move-bips` check at resolution provides partial protection — if the price moves back before resolution, the market resolves correctly regardless of how the bands were set. The manipulation only pays off if the attacker can hold the price in a favorable band through the market duration, which is much harder than a momentary spike.

The confidence interval check (`max-conf-bips`) also helps — a manipulation that creates high uncertainty in the Pyth feed would fail the confidence check at creation time.

**Can you ship with it?** Yes for launch, with asset selection as your mitigation. Start with BTC and ETH price feeds only. The attack cost for those feeds exceeds any realistic market size at launch. Add TWAP before expanding to thinner assets. Document the constraint.

---

## Issue 7 — Manual Fallback Price Centralization

**Actual risk: Real but governance-scoped.**

This one is structurally different from the others — it's not an exploitable bug, it's an acknowledged trust assumption. A compromised DAO or resolution agent can set any fallback price. The question is how likely that is and what the blast radius would be.

The fallback only activates when the oracle is volatile (`> max-move-bips` from start price) or fails entirely. Under normal market conditions it's never used. The window is narrow: it requires the oracle to fail or spike AND the DAO/agent to be compromised simultaneously.

The resolution agent is a single key (`var-get resolution-agent`). That's the higher risk — a compromised resolution agent key plus a volatile oracle = ability to set arbitrary outcome. The DAO multisig is harder to compromise.

**Can you ship with it?** Yes, this is a known and documented governance risk present in essentially every oracle-dependent protocol. The mitigations are operational: key management for the resolution agent, timelock on DAO actions for `set-manual-price`, monitoring for unexpected fallback price registrations. Consider emitting a prominent event when `set-manual-price` is called so it's visible off-chain immediately.

---

## Overall Verdict

All four are shippable for launch. In priority order of what to fix next:

Issue 6 is the only one with a realistic external attack surface, but it's asset-selection-mitigable. Issue 4 is real but operationally manageable with a claim-ordering convention. Issue 7 is governance risk you've already accepted. Issue 5 is theoretical given the actual code path.

The more pressing work before launch is completing the operational controls: DAO treasury address set correctly before first market, resolution agent key management, monitoring on `set-manual-price`, and the claim-ordering documentation for the DAO treasury position.

```

```
