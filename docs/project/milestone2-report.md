# Milestone 2 Report — Mainnet Deployment of Stacks Trading System & UI

**Reporting period:** week ending 28 May 2026  
**Milestone target date:** 18 May 2026  
**Status:** Delivered on testnet; user-facing flows operational with ongoing hardening

This report summarises work completed against the Milestone 2 criteria in [project-plan.md](./project-plan.md).

---

## Summary

Milestone 2 delivers a cross-chain vault so users can fund BigMarket from **Ethereum (MetaMask)** or **native Stacks**, with balances held in a DAO-governed Clarity vault keyed by controller identity. The past week focused on making deposit and withdraw flows production-usable on testnet: wallet integration, relayer correctness, signature-based withdrawals, balance display, and user documentation.

End-to-end flows verified on testnet include:

- MetaMask connect → bridge USDC (Sepolia) → vault credit
- MetaMask sign withdrawal (EIP-712) → vault release → mapped Stacks address
- Stacks wallet direct deposit and SIP-18 signed withdrawal
- Relayer sweep of mapped-address balances into the vault

---

## Criteria mapping

### Scope (project-plan § Milestone 2 — Scope)


| Criterion                                            | Status          | Notes                                                                                                                                                                            |
| ---------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MetaMask wallet connect / disconnect                 | **Done**        | Ethereum wallet integrated in frontend wallet layer; connect/disconnect via standard EIP-1193 provider                                                                           |
| Allbridge integration for USDC deposits Eth → Stacks | **Done**        | `VaultDepositBridge` uses Allbridge SDK for Sepolia/mainnet USDC → Stacks USDCx                                                                                                  |
| Relayer maps Ethereum addresses to Stacks addresses  | **Done**        | Deterministic derivation via `deriveStacksPrivateKey(serverSecret, controllerAddress)`; persisted in MongoDB; exposed at `GET /cross-chain/mappings/:sourceChain/:sourceAddress` |
| Relayer watches deposits and pushes funds to vault   | **Done**        | Intent registry + cron scheduler sweep mapped-address USDCx into vault via `deposit-for`; manual sweep UI for devnet/testnet                                                     |
| Clarity vault keyed by Ethereum public key           | **Done**        | `bme050-0-vault` credits balances by `(controller-chain, controller-address, mapped-address, token)`; EVM controller verified via secp256k1 + keccak256 address derivation       |
| Deploy to testnet                                    | **Done**        | Vault enabled via `bdp010-0-enable-vault` proposal; USDCx allowed for vault and market contracts                                                                                 |
| Documented usage, testing activity, and feedback     | **In progress** | User docs added (`/docs/getting-started/deposit-and-withdraw`); protocol spec at `docs/specifications/bigmarket-protocol-message-v1.md`; this report                             |


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

## Testing and verification

Activity during the reporting period included:

- Successful vault `withdraw` contract calls on testnet with EVM EIP-712 signatures (tx confirmed, USDCx released to mapped address)
- Relayer sweep from mapped address using controller-derived private key
- Contract unit tests for BMP1 withdrawal verification (EVM and Stacks paths)
- Manual UI testing across deposit/withdraw tab switches, balance refresh, and MetaMask on Sepolia vs mainnet mismatch handling

**Known limitations / follow-up:**

- Ethereum withdrawal still requires a bridge step (AllBridge) from mapped Stacks USDCx back to Ethereum USDC — operational on mainnet; manual sweep tooling available on testnet
- Cross-chain use-case doc (`docs/use-cases/cross-chain-bridging.md`) still Solana-centric; should be updated to reflect EVM-first implementation
- Signature-based **buy / sell / claim** market participation — Milestone 3

---

## Deliverables checklist


| Milestone 2 deliverable | Met?                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Documented usage        | Yes — in-app docs page + protocol specification                                          |
| Testing activity        | Yes — contract tests + manual testnet transactions                                       |
| Feedback incorporated   | Yes — relayer key bugs, balance persistence, network-aware USDC reads, UI simplification |
| Deploy to testnet       | Yes — vault extension enabled, USDCx wired to markets                                    |


---

## References

- [Phase 2 project plan](./project-plan.md)
- [BMP1 protocol specification](../specifications/bigmarket-protocol-message-v1.md)
- [Vault implementation spec](../specifications/manage-funds-usdcx-vault-spec.md)
- [User guide: Deposit and Withdraw](../../apps/frontend-c1/src/content/docs/deposit-and-withdraw.md)
- Vault contract: `contracts/stacks/bigmarket-dao/contracts/extensions/vault/bme050-0-vault.clar`
- Testnet enable proposal: `contracts/stacks/bigmarket-dao/contracts/proposals/testnet/bdp010-0-enable-vault.clar`

