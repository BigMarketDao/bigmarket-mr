# **BigMarket — Phase 2 Development Plan (Updated)**

**Stacks Endowment Grant (USD $10,000)**

---

## **1\. Overview**

BigMarket is a decentralised prediction market platform built on Stacks, designed to support governance, forecasting, and decision-making through market-based signals.

The current system is based on a Constant Product Market Maker (CPMM) model, with on-chain market creation, trading, and settlement governed by DAO-controlled contracts.

This phase focuses on evolving the existing system into a **scalable, production-ready trading platform**, with improved execution efficiency, reduced on-chain costs, and support for cross-chain participation.

---

## **2\. Objectives**

The primary objective of this phase is to:

- enhance the scalability and efficiency of the existing CPMM-based system
- introduce a hybrid execution model combining off-chain coordination with on-chain settlement
- deliver a fully operational trading system on Stacks mainnet
- enable cross-chain participation via Wormhole (Solana → Stacks)
- demonstrate real usage and early adoption of the system

---

## **3\. Milestones & Timeline**

The project will be delivered over an accelerated timeline from mid-April to early June.

---

## **Milestone 1 — Core Protocol Refactor & Execution Model Upgrade**

**Payout:** 20% ($2,000)  
**Target Date:** April 27, 2026

---

### **On-Chain (Clarity) Work**

- Define and implement new contract architecture, including:
  - Vault / deposit contracts for asset custody
  - Commitment mechanisms for trade intent
  - Settlement contracts for matched trade execution (initial version)
- Retain existing CPMM contracts as a legacy (v1) system
- ## Separate DAO and market logic where required

  ### **Off-Chain / Protocol Work**

- Introduce shared types and SDK foundations
- Design execution model beyond CPMM (FPMM-style \+ off-chain matching)
- Define order lifecycle and matching flow
- ## Document full protocol architecture

  ### **Deliverables**

- Clarity contracts (vault, commitment, settlement — testnet ready)
- Protocol specification and architecture documentation
- ## Shared TypeScript types and SDK foundations

---

## **Milestone 2 — Mainnet Deployment of Stacks Trading System & UI**

**Payout:** 30% ($3,000)  
**Target Date:** May 18, 2026

---

### **On-Chain (Clarity) Work**

- Finalise and deploy settlement-related contracts to Stacks mainnet, including:
  - Vault / deposit contracts
  - Commitment mechanisms
  - Settlement contracts
- ## Ensure contracts are fully integrated with DAO governance where required

  ### **Off-Chain / System Integration**

- Implement off-chain order coordination and deterministic matching
- Connect matcher, UI, and on-chain contracts
- Enable full end-to-end trading lifecycle:
  - deposit → commit → match → settle → withdraw

  ***

  ### **Frontend / UX**

- Upgrade trading interface
- Implement modular / white-label-ready UI
- Provide clear user flows for market participation

  ### **Deliverables**

- Clarity contracts deployed on Stacks mainnet
- Fully functional trading system (UI \+ matcher \+ contracts)
- Live demo markets on mainnet
- Documented user flows
- A defined user testing and early engagement plan to support external usage validation

### **Milestone 3 — Cross-Chain Integration & External Usage Validation**

**Payout:** 50% ($5,000)  
**Target Date:** June 8, 2026

**Scope:**

- Integrate Wormhole attestation verification
- Enable Solana → Stacks deposit flow
- Support cross-chain participation in prediction markets
- Validate system usage through live interaction

**Deliverables:**

- Functional Wormhole integration for cross-chain deposits
- Solana → Stacks participation flow operational on testnet/mainnet
- Demonstrated live interaction with the system, including:
  - users or testers executing trades or deposits
  - cross-chain participation flows
- Documented usage, testing activity, and feedback

---

## **4\. Budget Allocation**

The grant will support:

- core engineering and protocol development
- smart contract implementation and testing
- matching engine and execution infrastructure
- UI and user experience improvements
- cross-chain integration via Wormhole

---

## **5\. Expected Outcomes**

By the end of this phase, BigMarket will:

- operate as a fully functional prediction market on Stacks mainnet
- support a hybrid execution model with improved efficiency
- reduce reliance on expensive on-chain operations
- enable cross-chain participation from Solana
- demonstrate real usage and early validation

---

## **6\. Alignment with the Stacks Ecosystem**

This work strengthens the Stacks ecosystem by:

- improving the scalability and usability of prediction markets
- enabling new governance and forecasting mechanisms
- demonstrating hybrid execution architectures
- introducing cross-chain liquidity and participation
- supporting ecosystem growth through modular and white-label integrations

---

## **7\. Summary**

This phase evolves BigMarket from a CPMM-based system into a scalable, production-ready trading platform on Stacks.

By combining improved execution models, hybrid architecture, and cross-chain integration, the platform becomes capable of supporting real-world governance and forecasting use cases, while demonstrating early adoption and external usage.
