# BigMarket: Milestone 2 Report

**Reporting period:** week ending 28 May 2026  
**Status:** Delivered on testnet; user-facing flows operational with ongoing hardening

This report summarises work completed against the Milestone 2 criteria in [project-plan.md](./project-plan.md).

---

## Summary

Milestone 2 delivers a cross-chain vault so users can fund BigMarket from **Ethereum (MetaMask)** or **native Stacks**, with balances held in a DAO-governed Clarity vault keyed by controller identity. The work focused on making deposit and withdraw flows production-usable on testnet: wallet integration, relayer correctness, signature-based withdrawals, balance display, and user documentation.

End-to-end flows verified on testnet include:

- Meta Mask / Ethereum mainnet deposit to stacks address via AllBridge
- MetaMask connect → bridge USDC (Sepolia) → vault credit
- MetaMask sign withdrawal (EIP-712) → vault release → mapped Stacks address
- Stacks wallet direct deposit and SIP-18 signed withdrawal
- Relayer sweep of mapped-address balances into the vault

---

## Criteria mapping

### Scope (project-plan § Milestone 2 — Scope)

| Criterion                                            | Status          | Notes                                                                                                                                                                                             |
| ---------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MetaMask wallet connect / disconnect                 | **Done**        | Ethereum wallet integrated in frontend wallet layer; connect/disconnect via standard EIP-1193 provider                                                                                            |
| Allbridge integration for USDC deposits Eth → Stacks | **Done**        | `VaultDepositBridge` uses Allbridge SDK for mainnet USDC → Stacks USDCx (AllBridge is mainnnet only)                                                                                              |
| Relayer maps Ethereum addresses to Stacks addresses  | **Done**        | Deterministic derivation via `deriveStacksPrivateKey(serverSecret, controllerAddress)`; keys are ephemereal derived on demand; exposed at `GET /cross-chain/mappings/:sourceChain/:sourceAddress` |
| Relayer watches deposits and pushes funds to vault   | **Done**        | Intent registry + cron scheduler sweep mapped-address USDCx into vault via `deposit-for`; manual sweep UI for devnet/testnet                                                                      |
| Symmetric flows for pure stacks wallet interaction   | **Done**        | The underlying implementation is source chain agnositc                                                                                                                                            |
| Clarity vault keyed by Ethereum public key           | **Done**        | `bme050-0-vault` credits balances by `(controller-chain, controller-address, mapped-address, token)`; EVM controller verified via secp256k1 + keccak256 address derivation                        |
| Deploy to testnet                                    | **Done**        | Vault enabled via `bdp010-0-enable-vault` proposal; USDCx allowed for vault and market contracts                                                                                                  |
| Documented usage, testing activity, and feedback     | **Done**        | User docs added (`/docs/getting-started/deposit-and-withdraw`); protocol spec at `docs/specifications/bigmarket-protocol-message-v1.md`; user research conducted; docs rewritten from scratch; this report |

The universal signature protocol design (BMP1) is implemented for **withdrawals** on EVM and Stacks; buy/sell/claim via signatures remain Milestone 3 scope.

---

### On-chain (Clarity) work

| Deliverable                    | Status   | Detail                                                                                                                                                       |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vault: deposits via relayer    | **Done** | `deposit-for` accepts relayer-submitted deposits crediting the controller identity; native Stacks users can also deposit directly                            |
| Vault: withdrawals via relayer | **Done** | `withdraw` verifies BMP1 message + secp256k1 signature (EIP-712 for EVM, SIP-18 human-readable tuple for Stacks); releases USDCx to mapped/recipient address |
| DAO governance integration     | **Done** | Vault registered as DAO extension; token allow-list and market integration configured in bootstrap/enable-vault proposals                                    |

Contract tests cover EVM and Stacks withdrawal paths, including nonce replay protection and signature mismatch cases.

---

### Off-chain work

| Deliverable                    | Status   | Detail                                                                                                                                        |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Allbridge integration          | **Done** | Frontend bridge flow for Ethereum deposits; network-aware USDC contract selection                                                             |
| Relayer deposit sweep          | **Done** | API cron + intent registry; mapped-address balance detection and vault deposit                                                                |
| Ethereum → Stacks deposit flow | **Done** | Unified `/vault` UI with chain selector; balance summary shows vault, wallet, and mapped balances                                             |
| MetaMask wallet primitives     | **Done** | Connect/disconnect, typed-data signing (EIP-712 withdrawals), ERC-20 balance reads with app-network fallback (Sepolia when app is on testnet) |

**API endpoints delivered:**

- `GET /cross-chain/mappings/:sourceChain/:sourceAddress` — resolve mapped Stacks address
- `POST /cross-chain/intents` — register bridge/deposit intent
- `POST /cross-chain/protocol/withdraw-from-vault` — relay signed BMP1 withdrawal
- `GET /cross-chain/protocol/relay-info` — mapped address balance lookup
- `POST /cross-chain/protocol/sweep-relay` — manual USDCx sweep from mapped address

**Relayer key handling (critical fix):** sweep and withdraw relay transactions now sign with the **derived mapped-address private key**, not the server root key — ensuring the correct principal pays fees and authorises transfers from the mapped custody address.

---

## UI and UX (past week)

The vault UI was simplified for the primary deposit/withdraw paths, with advanced relay tooling hidden behind debug toggles.

| Area                   | Work completed                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Vault page**         | Unified `/vault` with Deposit / Withdraw tabs, `VaultBalanceSummary`, and Ethereum / Stacks chain selectors         |
| **Ethereum deposit**   | Allbridge flow via `VaultDepositBridge`; MetaMask approval + bridge                                                 |
| **Stacks deposit**     | Direct USDCx → vault via `StacksVaultPanel`; debug path for relay-address testing                                   |
| **Ethereum withdraw**  | Two-step flow: MetaMask EIP-712 sign → server relay → USDCx to mapped address                                       |
| **Stacks withdraw**    | SIP-18 human-readable message signing; optional recipient address; server-broadcast (no STX gas for user)           |
| **Balance display**    | Live vault, wallet USDC/USDCx, and mapped balances; EVM USDC fetched per app network; refresh and persistence fixes |
| **User documentation** | New docs page: Deposit and Withdraw (`apps/frontend-c1/src/content/docs/deposit-and-withdraw.md`)                   |

---

## Agent Integration

The agent layer has moved from intent to a real working component of the system.

**Shipped in `apps/api-v1/src/routes/agent/`:**

- `agentRoutes.ts` — endpoints for agents to create markets by discovery or by suggestion, resolve categorical markets, resolve scalar markets, and resolve undisputed markets
- `create-market-helper.ts` and `matchMarketSector.ts` — helpers that turn an unstructured market idea into a typed, on-chain market with the correct sector classification
- `scalar-markets.ts` and `resolver-helper.ts` — the resolution loop that sweeps markets at their resolution windows and writes outcomes on-chain
- `bdp001-resolution-add-agent.clar` — a Clarity DAO proposal that grants resolution-agent authority to external agents under the DAO's rules
- `SKILL.md` — interface document describing what BigMarket exposes to an agent framework: market discovery, market creation, buying, selling, claiming, and resolution; this is the interface document for the AIBTC DEV integration

**Milestone 2 new work:** Integration with AIBTC DEV's agent framework. Their agents run with independent wallets — exactly what BigMarket needs from an autonomous participant. The PR against AIBTC DEV is in preparation. Agent-driven market creation and resolution have been tested end-to-end on testnet. The formal agent testing plan — covering trade flows, claim flows, and adversarial behaviour — is being finalised ahead of submission.

---

## User Research and UI Rework

### Research sessions

Two research sessions were conducted two weeks apart at Antonio Meić's office in Šibenik, Croatia: **9 May 2026** and **16 May 2026**.

**Participants:** Krešimir Ševerdija, Branimir Ševerdija, Antonio Mrvica, Pavle Lokas, and Zoran Radin — all bet on sport daily using a mix of physical shops and online sportsbooks. None had prior crypto experience. Participants were given structured tasks and observed.

### What we heard

Crypto onboarding was the single biggest obstacle. Once participants understood what a prediction market was, they wanted to participate immediately. The wallet, seed phrase, network, and transaction-signing model was the barrier they encountered.

> *"I get the platform, but this whole wallet and crypto-buying thing isn't something I want to do. Where do I swipe my card?"* — Krešimir Ševerdija

> *"I need more depth on sports. If you don't have all the football, basketball, all the weekend games, I'm going somewhere else."* — Branimir Ševerdija

> *"Now that I've actually got funds in the wallet, I want to be on this all the time. When's the mobile version?"* — Antonio Mrvica, after completing the deposit step in session two

**Recurring patterns across both sessions:**

- Participants skipped copy containing words like "slippage", "vault", "settlement", or "extension"
- Two participants asked aloud "but what is this?" while looking at the market details / make prediction widget
- The market detail page overwhelmed first-time users — stake controls, charts, resolution rules, dispute mechanics, and reputation all competed for attention simultaneously
- Onboarding documentation assumed prior Stacks wallet experience; no participants had any

### What we changed

Feedback from session one drove the rework that was live for session two. Session two drove what is now on the `ui-refactor` branch going to production.

**Homepage.** Rebuilt to lead with what BigMarket is and what a user can do, before any wallet prompt. A DaisyUI-driven first attempt was scrapped after session one and rebuilt as a Tailwind-only header with a minimalist wallet menu. A second pass aligns design tokens with a Polymarket-style aesthetic — semantic colours, denser typography, faster scan.

**Market detail page.** Charts and stake controls separated. The page now leads with the question and the prices; mechanics and dispute information moved to a second tier. Reputation made visible without dominating the screen.

**Onboarding docs.** Wallet setup, deposit, and first-trade flows rewritten from scratch — no assumed Stacks knowledge. The full set lives in the platform docs and in `docs-v2/` in the repo, where build prompts and audit notes are kept for review.

**Error messages.** Contract error codes are now mapped to plain English at the UI boundary. Participants had been reading raw error codes and dropping off.

**Mobile.** The new design-token layer (`packages/bm-design`) and the Tailwind v4 rebuild were done to bring the platform to mobile-first. Antonio Mrvica's quote above is the clearest brief for what the mobile version needs to be.

The sports-market depth Branimir asked for is partly editorial, partly an agent problem. The AIBTC DEV integration described above is the mechanism for populating weekend football, basketball, and the long tail of markets without hand-creating each one.

### How the research changed the milestone

Two priorities shifted based on what we heard:

**MetaMask became higher priority.** Krešimir's "where do I swipe my card?" was a high-signal prompt for the Allbridge path. A user who already holds USDC on Ethereum — which includes most non-crypto-native users who have ever bought any crypto — can now route into BigMarket without touching a Stacks-native wallet. That moved the ETH → Stacks deposit flow up the internal priority stack.

**Documentation became a formal deliverable.** We had treated the docs as wrapping material for the engineering work. The sessions made clear that for non-crypto-native users, the docs are a product surface as much as the UI is. Rewriting them properly became part of the milestone scope, not an afterthought.

---

## Testing and verification

Activity during the reporting period included:

- Successful vault `withdraw` contract calls on testnet with EVM EIP-712 signatures (tx confirmed, USDCx released to mapped address)
- Relayer sweep from mapped address using controller-derived private key
- Contract unit tests for BMP1 withdrawal verification (EVM and Stacks paths)
- Manual UI testing across deposit/withdraw tab switches, balance refresh, and MetaMask on Sepolia vs mainnet mismatch handling
- Agent-driven market creation and resolution tested end-to-end on testnet

**Known limitations / follow-up:**

- Ethereum withdrawal still requires a bridge step (AllBridge) from mapped Stacks USDCx back to Ethereum USDC — operational on mainnet; manual sweep tooling available on testnet
- Cross-chain use-case doc (`docs/use-cases/cross-chain-bridging.md`) still Solana-centric; should be updated to reflect EVM-first implementation
- Signature-based **buy / sell / claim** market participation — Milestone 3
- Formal agent testing plan (trade flows, claim flows, adversarial behaviour) — being finalised ahead of submission

---

## Deliverables checklist

| Milestone 2 deliverable         | Met?                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Documented usage                | Yes — in-app docs page + protocol specification + onboarding docs rewritten from scratch                 |
| Testing activity                | Yes — contract tests + manual testnet transactions + agent end-to-end testnet testing                    |
| Feedback incorporated           | Yes — relayer key bugs, balance persistence, network-aware USDC reads, UI simplification, user research  |
| Deploy to testnet               | Yes — vault extension enabled, USDCx wired to markets                                                    |
| User research                   | Yes — two structured sessions (9 May, 16 May 2026), 5 participants, findings drove UI and doc rework     |
| Agent integration               | Yes — agent routes shipped; AIBTC DEV PR in preparation; end-to-end testnet verification complete        |

---

## References

- [Phase 2 project plan](./project-plan.md)
- [BMP1 protocol specification](../specifications/bigmarket-protocol-message-v1.md)
- [Vault implementation spec](../specifications/manage-funds-usdcx-vault-spec.md)
- [User guide: Deposit and Withdraw](../../apps/frontend-c1/src/content/docs/deposit-and-withdraw.md)
- Vault contract: `contracts/stacks/bigmarket-dao/contracts/extensions/vault/bme050-0-vault.clar`
- Testnet enable proposal: `contracts/stacks/bigmarket-dao/contracts/proposals/testnet/bdp010-0-enable-vault.clar`
