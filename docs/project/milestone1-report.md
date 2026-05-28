## Milestone 1: Delivery

**Introduction**

During Q1 of 2026 we undertook a high level review of BigMarket. We examined our CPMM (similar to Uniswap V2) and compared this with Fixed Product Market Makers (FPMM) with a Central Limit Order Book (CLOB) approach (similar to Polymarket) and proposed a shift toward this off-chain architecture.

This review was supported with a structured analysis, using recent Claude models (Opus 4.7), allowing us to assess trade-offs across system complexity and key features like liquidity provision.

**Key conclusions**  
Our existing CPMM-based contract layer is robust, composable, and well-suited to the majority of prediction market use cases \- including parimutuel markets, buy only, style markets. The proposed FPMM \+ CLOB model introduces significant complexity especially around: off-chain coordination settlement guarantees latency-sensitive execution. We concluded that this direction would cost the project momentum and adversely impact GTM planning.

As a result, we made a strategic pivot:

Rather than prematurely introducing a more complex execution model, we prioritised hardening, completing, and modularising our existing CPMM-based system, while laying the groundwork for future multi-chain and execution-layer flexibility.

This has enabled us to deliver meaningful progress in first milestone that lays the groundwork for cross chain support and user adoption in the remaining two milestones.

**Milestone 1 Delivery Overview**

In milestone one, we focused on three areas:

- Completing and strengthening the smart contract layer  
- Modularising and formalising our SDK for cross-chain use  
- Restructuring the monorepo to support scalable, white-label deployments

### 1\. Smart Contract Layer

The following two market contracts (plus unit tests) were updated; 

- bme024-0-market-scalar-pyth   
- bme024-0-market-predicting);

to include these functions;

- Sell-category  
- Add-liquidity  
- Remove-liquidity  
- Fee based liquidity incentive  
- Market Mechanism: Perimutual vs CPMM markets  
- Fixes and improvements

The sell-category fucntion completes the CPMM implementation by allowing users to sell shares back to the curve during market trading. The add/remove liquidity functions enhance and extend our liquidity incentive from just the market creator to any user. LPs are incentivised by the platform fee which is now  and enhance our ability to incentivise deep markets (on top of our existing market creation liquidity incentives) by allowing any user to provide liquidity to markets. LPs are rewarded by through fee sharing. 

#### Impact

These additions complete the CPMM lifecycle:  
Users can now enter and exit positions fully on-chain  
Liquidity is no longer restricted to market creators  
Markets can achieve deeper, more resilient liquidity profiles  
This significantly improves:

- capital efficiency  
- user experience  
- market sustainability

Importantly, this work closes core gaps in settlement and liquidity mechanics, which were prerequisites for any future execution model upgrade.

### 2\. SDK and Protocol Foundations

We formalised a modular SDK architecture with a key abstraction:  
This encapsulates:

- chain-specific transaction logic  
- contract interaction patterns  
- encoding/decoding behaviours

#### Impact

Establishes a **clean separation between protocol logic and execution environment**  
Enables **cross-chain expansion without rewriting core logic**  
Aligns with long-term goals of **multi-chain prediction markets**  
This directly contributes to the milestone requirement of:  
“shared types and SDK foundations”  
---

### 

### 3\. Monorepo Extension & Frontend Architecture

We upgraded the frontend stack to **Svelte 5 (Runes)** and significantly expanded the modular structure:

packages/  
 bm-common  
 bm-config  
 bm-create-market  
 bm-design  
 bm-market  
 bm-market-homepage  
 bm-types  
 bm-ui  
 bm-utilities  
 sdk  
 sip18-forum  
 sip18-forum-types  
api/  
contracts/  
apps/

#### 

#### Impact

* 

Clear separation between: 

- protocol logic  
- UI components  
- shared types

Enables **white-label deployments**   
Supports **enterprise / ESG prediction market use cases**  
Improves developer onboarding/velocity and maintainability  
