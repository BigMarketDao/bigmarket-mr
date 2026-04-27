# **Trading Specification (Buying & Selling Shares in CPMM Markets)**

## **Overview**

BigMarket enables users to **buy and sell outcome shares** in prediction markets using a **Constant Product Market Maker (CPMM)**.

Users can:

- **Buy shares** in a specific outcome (expressing a prediction)
- **Sell shares** back to the pool (exiting or reducing exposure)

Prices are determined algorithmically based on:

- current pool balances
- CPMM invariant
- liquidity depth

---

## **Core Concept**

Each market consists of:

- multiple **categories (outcomes)**
- each with:
  - `stakes` (shares)
  - `stake-tokens` (token liquidity)

The CPMM maintains:

```text
selected_pool * other_pool = constant
```

Prices adjust dynamically as users trade.

---

# **Buying Shares**

## **Function**

```clarity
(predict-category
  market-id
  min-shares
  category
  token
  max-cost
)
```

---

## **Parameters**

| Parameter    | Type   | Description                                     |
| ------------ | ------ | ----------------------------------------------- |
| `market-id`  | uint   | Target market                                   |
| `min-shares` | uint   | Minimum acceptable shares (slippage protection) |
| `category`   | string | Outcome being predicted                         |
| `token`      | trait  | SIP-010 token used by market                    |
| `max-cost`   | uint   | Maximum tokens user is willing to spend         |

---

## **Who Can Buy**

- Any user with sufficient token balance
- No permissions required
- Token must be **approved for the market**

---

## **When Buying Is Allowed**

Only when:

- Market is **OPEN**
- Market is **not concluded**
- Block height is **before market end**

---

## **Validation Conditions**

Trade succeeds only if:

- Category exists
- Token matches market token
- Market is in `RESOLUTION_OPEN`
- User has sufficient balance
- `max-cost` is within allowed bounds
- Trade does not violate:
  - pool minimum liquidity (`MIN_POOL`)
  - overbuy constraints

- Slippage check passes:

  ```text
  actual_shares >= min-shares
  ```

---

## **Mechanism**

### 1. Fee Calculation

```text
fee = max-cost * dev-fee-bips
lp-fee = fee * lp-fee-split
multisig-fee = remainder
```

---

### 2. Compute Shares

Using CPMM:

```text
amount-shares = cpmm-shares(selected_pool, other_pool, cost-of-shares)
```

---

### 3. Token Transfers

User pays:

- `cost-of-shares + lp-fee` → market pool
- `multisig-fee` → dev fund

---

### 4. State Updates

- Increase selected category:
  - `stakes[index] += shares`
  - `stake-tokens[index] += cost-of-shares`

- Distribute LP fee across all pools:

  ```text
  lp-delta = proportional distribution across categories
  ```

👉 This **rewards liquidity providers**

---

### 5. User Balances

- Shares credited:

  ```text
  stake-balances[user][index] += shares
  ```

- Cost tracked:

  ```text
  token-balances[user][index] += cost
  ```

---

## **Outcome for User**

User receives:

- shares in selected category
- exposure to outcome probability

---

## **Economic Meaning**

Buying shares:

- **increases probability** of that outcome
- expresses belief
- moves price

---

# **Selling Shares**

## **Function**

```clarity
(sell-category
  market-id
  min-refund
  category
  token
  shares-in
)
```

---

## **Parameters**

| Parameter    | Type   | Description                                     |
| ------------ | ------ | ----------------------------------------------- |
| `market-id`  | uint   | Target market                                   |
| `min-refund` | uint   | Minimum tokens to receive (slippage protection) |
| `category`   | string | Outcome being sold                              |
| `token`      | trait  | Market token                                    |
| `shares-in`  | uint   | Number of shares to sell                        |

---

## **Who Can Sell**

- Any user holding shares in that category

---

## **When Selling Is Allowed**

Same as buying:

- Market is **OPEN**
- Before market end
- Not resolving or concluded

---

## **Validation Conditions**

- User has enough shares:

  ```text
  user_shares >= shares-in
  ```

- Market has enough liquidity to pay refund
- Slippage check passes:

  ```text
  refund >= min-refund
  ```

- Trade does not violate:
  - pool minimum (`MIN_POOL`)
  - over-sell constraints

---

## **Mechanism**

### 1. Compute Refund

Using inverse CPMM:

```text
gross-refund = cpmm-refund(selected_pool, other_pool, shares-in)
```

---

### 2. Fee Deduction

```text
fee = gross-refund * dev-fee-bips
net-refund = gross-refund - fee
```

---

### 3. Token Transfers

From contract:

- `fee` → dev fund
- `net-refund` → user

---

### 4. State Updates

- Reduce selected category:

  ```text
  stakes[index] -= shares-in
  stake-tokens[index] -= gross-refund
  ```

---

### 5. User Balance Updates

Shares reduced:

```text
user_shares -= shares-in
```

Cost basis reduced proportionally:

```text
token_reduction = user_tokens * shares-in / user_shares
```

---

## **Outcome for User**

User receives:

- tokens returned from pool
- reduced exposure

---

## **Economic Meaning**

Selling shares:

- **decreases probability** of outcome
- exits or reduces position
- moves price in opposite direction

---

# **Market Lifecycle Constraints**

| Phase     | Buy | Sell |
| --------- | --- | ---- |
| Open      | ✅  | ✅   |
| Cooldown  | ❌  | ❌   |
| Resolving | ❌  | ❌   |
| Disputed  | ❌  | ❌   |
| Resolved  | ❌  | ❌   |

---

# **Price Behaviour**

### Buying

- increases selected pool imbalance
- price moves **up**

### Selling

- restores balance
- price moves **down**

---

# **Slippage Protection**

Users control execution risk via:

### Buy

```text
min-shares
```

### Sell

```text
min-refund
```

---

# **Relationship to Liquidity Providers**

Trades generate:

- **LP fees**
- distributed across all pools

👉 This increases:

```text
value per share for LPs
```

---

# **User Benefits**

### Traders

- express predictions
- profit from correct outcomes
- exit positions anytime (before close)

---

### Liquidity Providers

- earn fees from all trades
- benefit from volume

---

# **Design Properties**

### **1. Continuous Liquidity**

- Always available (no order matching)

### **2. Deterministic Pricing**

- Fully on-chain
- no off-chain dependency

### **3. Capital Efficiency**

- Trades instantly executed
- no waiting for counterparties

### **4. Symmetry**

- Buy and sell are exact inverses

---

# **Summary**

The trading system:

- allows **permissionless participation**
- uses **CPMM pricing**
- supports:
  - directional trading (buy/sell)
  - passive participation (LPs)

It provides:

- continuous pricing
- predictable execution
- composability with DeFi primitives
