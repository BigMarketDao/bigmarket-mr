# **Liquidity Provision Specification (CPMM Markets)**

## **Overview**

The BigMarket CPMM protocol allows users to **add and remove liquidity** from active prediction markets.

Liquidity providers (LPs) supply tokens to the market pool and receive **proportional exposure across all outcome categories**, maintaining the invariant required for continuous pricing.

This mechanism:

- deepens market liquidity
- stabilises pricing
- enables passive participation in market activity

---

## **Core Concepts**

### **Balanced Liquidity**

Liquidity is always added and removed **proportionally across all categories**:

- Users **do not choose a category**
- They receive a **balanced position across all outcomes**
- This ensures:
  - **no price movement on deposit/withdrawal**
  - preservation of CPMM invariants

---

## **Add Liquidity**

### **Function**

```clarity
(add-liquidity market-id amount expected-total-stakes max-deviation-bips token)
```

---

## **Who Can Add Liquidity**

- **Any user** holding the market’s token
- No DAO gating or permissions required
- Must use a **DAO-approved token**

---

## **When Liquidity Can Be Added**

Liquidity can only be added when:

- Market is **OPEN**
- Market is **not concluded**
- Current block height is **before market end**

### ❌ Not allowed when:

- Market is resolving
- Market is disputed
- Market is resolved
- Market has ended trading period

---

## **Conditions / Validation**

To successfully add liquidity:

- Market must exist
- Token must match market token
- Market must be in `RESOLUTION_OPEN`
- Total pool must already have liquidity (`> 0`)
- Deposit amount must be:
  - > 0 (after proportional scaling)
  - ≤ max allowed (`u50000000000000`)

- Pool must not have shifted beyond:
  - `expected-total-stakes ± max-deviation-bips`

👉 This provides **sandwich / front-running protection**

---

## **Mechanism**

1. Compute proportional share:

   ```text
   delta[i] = stakes[i] * amount / total-stakes
   ```

2. User deposits tokens:

   ```text
   actual-amount = sum(delta)
   ```

3. Update:
   - Market stakes
   - Market token pools
   - User stake balances
   - User token balances

4. Mint reputation:

   ```text
   LP action → reputation reward
   ```

---

## **Outcome for User**

User receives:

- **Shares across all categories**
- **Token exposure proportional to pool distribution**

This is equivalent to holding a **market-neutral LP position**

---

## **Remove Liquidity**

### **Function**

```clarity
(remove-liquidity market-id amount min-refund token)
```

---

## **Who Can Remove Liquidity**

- Any user who previously added liquidity
- Must hold sufficient **balanced shares across all categories**

---

## **When Liquidity Can Be Removed**

Same constraints as adding liquidity:

- Market must be **OPEN**
- Market must **not be concluded**
- Must be **before market end**

---

## **Conditions / Validation**

- User must have sufficient shares across all categories
- Withdrawal amount must:
  - be > 0
  - be < total pool

- Pool must remain above **MIN_POOL thresholds**
- Refund must meet `min-refund` (slippage protection)

---

## **Mechanism**

1. Compute proportional burn:

   ```text
   delta[i] = stakes[i] * amount / total-stakes
   ```

2. Validate user has enough:

   ```text
   userStake[i] >= delta[i]
   ```

3. Compute refund:

   ```text
   actual-refund = sum(delta)
   ```

4. Update:
   - Market stakes reduced
   - Market token pools reduced
   - User balances reduced

5. Transfer tokens back to user

---

## **Important Constraint**

Liquidity removal requires a **balanced position**.

👉 Users cannot:

- remove liquidity from a single category
- withdraw if they hold skewed positions

This ensures:

- **pool integrity**
- **price consistency**

---

## **Market Lifecycle Integration**

| Phase     | Add Liquidity  | Remove Liquidity |
| --------- | -------------- | ---------------- |
| Open      | ✅ Allowed     | ✅ Allowed       |
| Cooldown  | ❌ Not allowed | ❌ Not allowed   |
| Resolving | ❌ Not allowed | ❌ Not allowed   |
| Disputed  | ❌ Not allowed | ❌ Not allowed   |
| Resolved  | ❌ Not allowed | ❌ Not allowed   |

---

## **Economic Benefits for Liquidity Providers**

### **1. Fee Participation**

Liquidity providers benefit from:

- **LP fee share (`lp-fee-split-bips`)**
- Fees are:
  - collected during trades (`predict-category`)
  - injected into `stake-tokens`

👉 This increases **token value per share**

---

### **2. Passive Yield**

LPs earn without directional exposure:

- Gains come from:
  - trading activity
  - fee accumulation

- No need to predict outcomes

---

### **3. Market Efficiency**

LPs improve:

- price stability
- execution quality
- slippage reduction

Which in turn:

- increases trading volume
- increases fee generation

---

### **4. Capital Efficiency**

- Funds remain **fully on-chain**
- No idle capital
- Always participating in pricing curve

---

### **5. Reputation Incentives**

- LP actions mint **reputation tokens**
- Enables:
  - governance participation
  - DAO alignment

---

## **Risk Considerations**

Liquidity providers are exposed to:

### **1. Outcome Risk**

- Final resolution redistributes value unevenly

### **2. Inventory Risk**

- LP holds all outcomes → value depends on final winner

### **3. Impermanent Loss Equivalent**

- Similar to AMMs:
  - skewed trading shifts exposure

---

## **Design Rationale**

This design ensures:

- **No price impact from liquidity changes**
- **Continuous market operation**
- **Composable DeFi primitive**
- **Permissionless participation**

While maintaining:

- strong safety guarantees
- predictable behaviour
- minimal attack surface

---

## **Summary**

Liquidity provision in BigMarket:

- is **permissionless**
- is **only active during trading phase**
- requires **balanced exposure**
- rewards users via:
  - fees
  - reputation
  - participation in market growth

It forms a **core pillar of the CPMM system**, enabling scalable, decentralised prediction markets without reliance on off-chain order matching.
