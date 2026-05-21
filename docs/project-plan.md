# **BigMarket — Phase 2 Development Plan V2**

**Stacks Endowment Grant**

---

## **Overview**

BigMarket is a decentralised prediction market platform built on Stacks, designed to support governance, forecasting, and decision-making through market-based signals.

The current system supports both Constant Product Market Maker (CPMM) and Parimutuel prediction models, with on-chain market creation, trading, and settlement governed by DAO-controlled contracts.

This phase introduces a BigMarket message protocol, evolving the system into a scalable, production-ready prediction platform, with improved execution efficiency, reduced participation costs, that supports users across a range of chains and wallets.

---

## **Milestone 1 — Core Protocol Refactor & Execution Model Upgrade**

**Target Date:** April 27, 2026

---

### **On-Chain (Clarity) Work**

- Define and implement new contract primitives:
  - Sell shares \- completes CPMM loop
  - Add liquidity
  - Remove liquidity
  - Claim LP fee share
  - Embed CPMM vs Parimutuel market types
- Retain existing CPMM contracts as a legacy (v1) system
- Separate DAO and market logic where required

### **Off-Chain / Protocol Work**

- Introduce shared types and SDK foundations
- Design execution model beyond CPMM
- Refactor code to Svelte 5
- Refactor code to discrete packages to support white label solution
- Document full protocol architecture

### **Deliverables**

- Clarity contracts (vault, commitment, settlement — testnet ready)
- Protocol specification and architecture documentation
- Shared TypeScript types and SDK foundations

## **Milestone 2 — Mainnet Deployment of Stacks Trading System & UI**

**Target Date:** May 18, 2026

---

### **Scope**

- Support Meta Mask wallet connect/disconnect
- Integrate Allbridge for user USDC deposits Eth → Stacks
- Build relayer to map ethereum public keys to stacks addresses
- Build relayer to watch for deposits and push funds to vault
- Build Clarity layer Vault to receive deposits keyed by ethereum public key
- Deploy to testnet
- Documented usage, testing activity, and feedback

_Note: the design will be universal signature based protocol to ensure users from both ED25519 (Solana, Near, SUI, Aptos, etc) and Secp126k1 (EVM, bitcoin, stacks chains) interact in the same way with the same underlying messaging protocol an to ensure secp256r1 (WebAuthn, Apple Secure Enclave, Android Keystore, HTTPS/TLS, FIDO2) can be supported in a later iteration._

### **On-Chain (Clarity) Work**

- Vault contract:
  - Deposits \- via relayer
  - Withdrawals \- via relayer
- Ensure contracts are fully integrated with DAO governance

### **Off-Chain**

- Integrate Allbridge for user USDC deposits
- Develop relayer \- watches for bridged deposits \- moves funds to vault contract
- Enable Ethereum → Stacks deposit flow
- Handle meta mask wallet primitives
  - Connect / disconnect

**Deliverables:**

- Documented usage, testing activity, and feedback
- Deploy to testnet

---

### **Milestone 3 — Cross-Chain Integration & External Usage Validation**

**Target Date:** June 8, 2026

### **Scope**

- Support Meta Mask wallet sign message
- Build the BigMarket _signature prediction protocol_ \- for future compatibility this protocol will support (secp256k1, secp256r1 and ed25519 signature schemes)
- Integrate Allbridge for user USDC withdrawals Stacks → Eth
- Implement: Buy shares, Sell Shares, Claim Winnings proxy methods in Clarity
- Deploy to Mainnet
- Documented usage, testing activity, and feedback

### **On-Chain (Clarity) Work**

- Signature driven market participation methods
  - Buy shares
  - Sell shares
  - Claim winnings
- Support cross-chain participation in prediction markets
- Validate system usage through live interaction

**Deliverables:**

- Functional Allbridge integration for cross-chain deposits
- Ethereum → Stacks participation flow operational on testnet/mainnet
- Demonstrated live interaction with the system, including:
  - users or testers executing trades or deposits
  - cross-chain participation flows
- Documented usage, testing activity, and feedback
- Deploy to mainnet

---
