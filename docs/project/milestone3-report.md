# BigMarket: Milestone 3 Report

**Reporting period:** week ending 28 July 2026  
**Status:** Delivered on mainnet; controlled end-to-end validation complete; external user testing and traction activities **TBD**

This report summarises work completed against the Milestone 3 criteria in [project-plan.md](./project-plan.md), using the action plan and evidence recorded in [ms3/traction-plan.md](./ms3/traction-plan.md).

---

## Summary

Milestone 3 completes the **signature prediction protocol** for cross-chain market participation on **mainnet**. Users can register interest via OAuth, connect MetaMask, bridge USDC from Ethereum to Stacks, have funds swept into the DAO vault, and **buy and sell shares** using MetaMask-signed BMP1 messages relayed by the server — without holding STX for gas.

The milestone closes the loop opened in Milestone 2: Milestone 2 delivered vault deposit and withdraw on testnet; Milestone 3 adds **signed buy / sell / claim** market operations, mainnet deployment, OAuth-led onboarding, and controlled live usage validation. External tester recruitment, Market 3, and final submission artefacts remain **TBD** per the traction plan.

End-to-end flows verified on mainnet include:

- Google / GitHub OAuth registration with email capture
- MetaMask connect → Allbridge USDC deposit (Ethereum) → USDCx at mapped Stacks address
- Relayer sweep of mapped-address USDCx into the vault (`deposit-for`)
- MetaMask EIP-712 signed **buy-shares** → vault executes trade on behalf of EVM controller
- MetaMask EIP-712 signed **sell-shares** → partial exit confirmed on-chain
- Two live scalar markets (BTC/USD, STX/USD) with liquidity on mainnet

---

## Criteria mapping

### Scope (project-plan § Milestone 3 — Scope)

| Criterion | Status | Notes |
| --------- | ------ | ----- |
| MetaMask wallet sign message | **Done** | EIP-712 typed-data signing for BMP1 buy, sell, claim, and withdraw operations |
| BigMarket signature prediction protocol (BMP1) | **Done** | 256-byte fixed message envelope; EVM secp256k1 verification on-chain; extensible to ed25519 / secp256r1 in future iterations |
| Allbridge integration for USDC withdrawals Stacks → Eth | **Partial** | Relayer path implemented (`bridgeRelayToEthereum`); primary validation focused on deposit + trade flows; full withdraw-to-Ethereum UX remains operational follow-up |
| Buy shares, sell shares, claim winnings proxy methods in Clarity | **Done** | `bme050-0-vault`: `buy-shares`, `sell-shares`, `claim-winnings` verify BMP1 + signature then execute against authorised market contracts |
| Deploy to mainnet | **Done** | DAO bootstrap and extension proposals executed; vault, USDCx, and market contracts configured for mainnet |
| Documented usage, testing activity, and feedback | **TBD** | Bob test and traction-plan evidence started; external tester feedback, aggregated usage data, and final submission artefacts still to be completed |

---

### On-chain (Clarity) work

| Deliverable | Status | Detail |
| ----------- | ------ | ------ |
| Signature-driven buy shares | **Done** | `buy-shares` verifies BMP1 message + EVM signature; debits vault balance and calls market contract |
| Signature-driven sell shares | **Done** | `sell-shares` mirrors buy path; credits vault balance after market exit |
| Signature-driven claim winnings | **Done** | `claim-winnings` releases resolved-market proceeds to vault balance for cross-chain identity |
| Cross-chain participation | **Done** | Vault keys balances by `(controller-chain, controller-address, mapped-address, token)`; EVM controllers participate via relayer without native STX |
| Validate system usage through live interaction | **TBD** | Controlled Bob test complete; external tester trades and deposits not yet recorded |
| Mainnet deployment | **Done** | Bootstrap proposal `bdp000-1-bootstrap.clar`; vault and market extensions enabled under DAO governance |

Contract tests and mainnet transactions confirm nonce replay protection and signature mismatch rejection on the buy and sell paths.

---

### Off-chain work

| Deliverable | Status | Detail |
| ----------- | ------ | ------ |
| OAuth registration | **Done** | Google and GitHub providers; email, provider, registration date, last login, and referral source stored; marketing consent kept separate |
| Relayer market operations | **Done** | `POST /cross-chain/protocol/vault-market-op` relays signed BMP1 buy / sell / claim transactions; sponsor wallet pays STX fees |
| Relayer deposit sweep | **Done** | Intent registry + cron scheduler; `deposit-for` credits EVM controller identity after Allbridge delivery |
| Allbridge deposit (Eth → Stacks) | **Done** | `VaultDepositBridge` — MetaMask approval + bridge; ~20-minute delivery messaging in UI |
| Mainnet API / frontend config | **Done** | Network-aware configuration for vault, USDCx, relayer, and Stacks API endpoints |

**API endpoints delivered or extended:**

- `GET /auth/me` — session user with provider account linkage
- `POST /auth/oauth/:provider` — Google / GitHub OAuth initiation and callback
- `POST /cross-chain/intents` — register bridge deposit intent
- `POST /cross-chain/intents/:intentId/sweep` — manual vault sweep trigger
- `POST /cross-chain/protocol/vault-market-op` — relay signed buy / sell / claim
- `POST /cross-chain/protocol/withdraw-from-vault` — relay signed BMP1 withdrawal
- `GET /cross-chain/protocol/relay-info` — mapped address balance lookup

**Relayer hardening (mainnet debugging):**

- Removed redundant `senderKey` parameter from `depositForFromMappedAddress` — `params.privateKey` is now the single signing source
- Added derived-address verification before broadcast (mapped private key must match stored `mappedAddress`)
- Sweep status flow: `pending-confirm` → on-chain confirmation → `swept` (avoids optimistic success marking)
- Sweep job enabled on mainnet after sponsor wallet funding

---

## UI and UX

| Area | Work completed |
| ---- | -------------- |
| **Register Interest** | `OauthBanner` — prominent OAuth entry (Google / GitHub) with signed-in thank-you state and sign-out |
| **OAuth session** | Robust session restore from refresh cookie; GitHub email fetch hardened; profile sync on every login |
| **Vault deposit** | Allbridge two-step flow (approve → bridge); clear status messaging; inputs disabled after bridge submission |
| **Cross-chain trading** | MetaMask-signed buy and sell from vault balance without STX gas |
| **Performance** | Non-blocking DAO overview cache; SSR cache warming; parallel URL warming in API |

---

## Mainnet validation (Bob test)

Controlled end-to-end test executed per [ms3/traction-plan.md](./ms3/traction-plan.md) §5. Transaction evidence:

| Step | Result | Transaction |
| ---- | ------ | ----------- |
| USDC approval (Ethereum) | **Success** | [0xed2060…aed4ac](https://etherscan.io/tx/0xed2060c51a4c9c8b99b31efa70097fb1bd251e2c62d02634b43a4e8a20aed4ac) |
| Allbridge transfer (Ethereum) | **Success** | [0x33377c…5160d](https://etherscan.io/tx/0x33377ccf737c352fa04eeb6a0edb685412e8391287b2fd783187237c6925160d) |
| Relayer sweep → vault (`deposit-for`) | **Success** | [0xc2f63d…24d2b](https://explorer.hiro.so/txid/0xc2f63d52b8f83b059b4e9f9852db471e5f1fcbeed73d1bde2e7199e8e1a24d2b?chain=mainnet) |
| Signed buy shares | **Success** | [8184489…fee7c](https://explorer.hiro.so/txid/8184489120a5779d98c6a51b72a33668797567d05f731c08271a4ec304dfee7c?chain=mainnet) |
| Signed sell shares | **Success** | [04d6415…6735](https://explorer.hiro.so/txid/04d64156d9535f5cc11952ce00c3217f38106a2a725602496c09ce3e73926735?chain=mainnet) |

**Live markets on mainnet:**

- BTC/USD scalar market
- STX/USD scalar market

Both markets created with minimum practical liquidity for controlled and external testing.

---

## External usage and recruitment

Per the traction plan, a second market (~one week resolution) supports source-tagged registration links for friends, Stacks Telegram, Discord, and direct outreach. Recruitment asks testers to:

1. Register via OAuth
2. Connect MetaMask
3. Deposit a small test amount
4. Place one trade
5. Provide feedback

Email follow-up (confirmation, market link, reminder, result / claim link, feedback request) is configured for opted-in users only. Raw email addresses are not published in milestone evidence.

Evidence structure (as specified in traction plan §12):

```text
docs/milestone-3/
  deployment.md
  mainnet-addresses.md
  bob-test.md
  external-testing.md
  registrations.md
  transaction-log.csv
  feedback.md
  known-limitations.md
  screenshots/
```

Aggregated registration counts, wallet connections, and trade activity will be recorded in that pack alongside transaction IDs once external testing is complete.

---

## Outstanding work (TBD)

The following items from [project-plan.md](./project-plan.md) Milestone 3 and [ms3/traction-plan.md](./ms3/traction-plan.md) remain **to be completed**:

### Bob test — remaining steps (traction plan §5)

| Task | Status |
| ---- | ------ |
| Resolve Market 1 (controlled test market) | **TBD** |
| Claim winnings via MetaMask-signed BMP1 message | **TBD** |
| Confirm second claim is rejected | **TBD** |
| Record claim transaction IDs and screenshots in evidence pack | **TBD** |

### External tester recruitment and usage (traction plan §§6–10)

| Task | Status |
| ---- | ------ |
| Source-tagged registration links live for friends, Stacks Telegram, Discord, and direct outreach | **TBD** |
| Recruit 3–5 trusted external testers | **TBD** |
| Testers complete full flow: OAuth → MetaMask → deposit → trade → feedback | **TBD** |
| Public share of Register Interest link in approved Stacks groups (mainnet beta messaging) | **TBD** |
| Email follow-up sequence sent (confirmation, market link, reminder, result / claim link, feedback request) | **TBD** |
| Resolve Market 2; email participants; record claim transaction IDs | **TBD** |
| Collect and document external user feedback | **TBD** |

### Market 3 and ongoing validation (traction plan §11)

| Task | Status |
| ---- | ------ |
| Create Market 3 (2–3 week resolution) with minimum liquidity | **TBD** |
| Keep Market 3 live during grant submission | **TBD** |
| Monitor registration, deposits, trades, and relayer activity | **TBD** |

### Evidence pack and final submission (traction plan §§12–13)

| Task | Status |
| ---- | ------ |
| Complete `docs/milestone-3/` evidence pack (`external-testing.md`, `registrations.md`, `feedback.md`, `transaction-log.csv`, screenshots) | **TBD** |
| Record aggregated registration counts, wallet connections, and trade activity | **TBD** |
| End-to-end screen demonstration | **TBD** |
| Publish aggregated public usage data and known limitations | **TBD** |

### Project-plan deliverables — external validation

| Deliverable | Status |
| ----------- | ------ |
| Users or testers (beyond controlled Bob test) executing trades or deposits | **TBD** |
| Cross-chain participation flows demonstrated with external participants | **TBD** |
| Documented usage, testing activity, and feedback (including external testers) | **TBD** |

---

## Testing and verification

Activity during the reporting period included:

- Mainnet Allbridge deposit: approval, bridge, mapped-address delivery, and vault sweep
- Mainnet signed buy and sell via BMP1 + EIP-712 + relayer sponsorship
- OAuth flows: Google and GitHub connect, email persistence, repeat login, GitHub session restore fix
- Relayer diagnostics: mapped-address / private-key alignment checks; sweep confirmation polling
- SDK browser compatibility fix (`Buffer` removal from Allbridge deposit encoding)
- API performance: non-blocking `/market-dao-data`, startup cache warming

**Known limitations / follow-up:**

- Stacks → Ethereum USDC withdrawal via Allbridge — relayer implemented; full user-facing polish and mainnet validation ongoing
- `walletKey` rotation requires mapping records and intents to be created under the same server secret; mismatched keys produce wrong tx-sender and `(err u1)` on sweep — documented and guarded in relayer code
- Bob test claim-winnings path on mainnet — see Outstanding work (TBD) § Bob test
- External tester recruitment, Market 2 resolution, and Market 3 — see Outstanding work (TBD)
- Evidence pack completion, end-to-end screen demo, and aggregated public usage data — see Outstanding work (TBD)

---

## Deliverables checklist

| Milestone 3 deliverable | Met? |
| ----------------------- | ---- |
| MetaMask sign message for market ops | Yes — EIP-712 BMP1 buy / sell / claim |
| Signature prediction protocol (BMP1) | Yes — vault verifies secp256k1 EVM controllers on mainnet |
| Clarity buy / sell / claim proxy methods | Yes — `bme050-0-vault` deployed and exercised on mainnet |
| Allbridge cross-chain deposits | Yes — [approval](https://etherscan.io/tx/0xed2060c51a4c9c8b99b31efa70097fb1bd251e2c62d02634b43a4e8a20aed4ac) + [transfer](https://etherscan.io/tx/0x33377ccf737c352fa04eeb6a0edb685412e8391287b2fd783187237c6925160d) |
| Ethereum → Stacks participation on mainnet | Yes — deposit, sweep, buy, sell confirmed on-chain |
| OAuth registration and email capture | Yes — Google / GitHub; marketing consent separate |
| Deploy to mainnet | Yes — bootstrap, vault, markets, relayer configured |
| Live interaction demonstrated (controlled) | Yes — Bob test transaction log + two live markets |
| Live interaction with external testers | **TBD** — recruitment and tester flows not yet complete |
| Documented usage, testing, feedback | **TBD** — Bob test documented; external feedback and final evidence pack outstanding |
| Transaction IDs recorded (Bob test) | Yes — see Mainnet validation table above |
| Transaction IDs recorded (external testers) | **TBD** |
| End-to-end screen demonstration | **TBD** |
| Aggregated public usage data | **TBD** |

---

## References

- [Phase 2 project plan](./project-plan.md)
- [Milestone 3 action plan](./ms3/traction-plan.md)
- [Milestone 2 report](./milestone2-report.md)
- [BMP1 protocol specification](../specifications/bigmarket-protocol-message-v1.md)
- [Vault implementation spec](../specifications/manage-funds-usdcx-vault-spec.md)
- [User guide: Deposit and Withdraw](../../apps/frontend-c1/src/content/docs/deposit-and-withdraw.md)
- Vault contract: `contracts/stacks/bigmarket-dao/contracts/extensions/vault/bme050-0-vault.clar`
- Mainnet bootstrap: `contracts/stacks/bigmarket-dao/contracts/proposals/mainnet/bdp000-1-bootstrap.clar`
