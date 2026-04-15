# BigMarket Architecture (v2)

## Overview

BigMarket is being rebuilt as a modular, multi-service prediction market platform.

This version introduces:

- Off-chain order matching (CLOB-style)
- On-chain settlement (Clarity contracts on Stacks)
- Cross-chain intent support (future)
- White-label UI architecture
- Monorepo-based development

This document defines the system structure for developers and AI agents.

---

## High-Level System

```mermaid
flowchart LR
  UI[Frontend Apps] --> API
  API --> MATCHER
  MATCHER --> SETTLER
  SETTLER --> CONTRACTS
  INDEXER --> API
  CONTRACTS --> INDEXER
