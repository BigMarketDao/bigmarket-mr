# 🧩 User Bootstraps DAO

---

## **Summary**

A user initializes a DAO instance by calling the bootstrap (construct) function on the deployed DAO bootstrap contract, registering core extensions (e.g. vault) and establishing initial configuration.

---

## **Actors**

- Primary: DAO Creator (user with deployed bootstrap contract)
- System: BigMarket UI + SDK + Wallet + Stacks Blockchain

---

## **Preconditions**

- User has:
  - Deployed the DAO bootstrap contract
  - Access to a connected wallet
  - Sufficient balance to pay transaction fees

- Application has:
  - Loaded `appConfig` and `daoConfig`
  - Correct network selected (no fallback ambiguity)

- DAO is **not yet initialised** (bootstrap has not been executed)

---

## **Trigger**

User navigates to DAO features and chooses to initialise the DAO.

---

## **Main Flow**

1. User navigates to DAO dashboard / governance section

2. UI detects DAO is not yet initialised

3. UI displays **“Bootstrap DAO”** action

4. User clicks **“Bootstrap DAO”**

5. Frontend:
   - Instantiates DAO client
   - Prepares bootstrap parameters:
     - DAO name / metadata (if applicable)
     - Extension contracts (e.g. vault)
     - Initial governance configuration

6. Frontend calls:

```ts
dao.bootstrap(...)
```

7. SDK:
   - Encodes Clarity function arguments
   - Calls `requestWallet(...)`

8. Wallet:
   - Prompts user to confirm transaction

9. User confirms transaction

10. Transaction is submitted to Stacks blockchain

11. System waits for confirmation

12. On success:

- DAO is marked as initialised
- DAO config / state is refreshed
- UI transitions to active DAO state

---

## **Postconditions**

- DAO is fully initialised
- Core extensions (e.g. vault) are registered
- DAO is ready for:
  - deposits
  - governance actions
  - market operations

---

## **Failure Cases**

### ❌ 1. User rejects transaction

- Wallet rejection
- UI shows: “Transaction cancelled”

---

### ❌ 2. Transaction fails (contract error)

- Invalid parameters
- Contract already initialised
- Missing extension

UI:

- Displays error message from chain

---

### ❌ 3. DAO already bootstrapped

- Contract call fails or is blocked
- UI should ideally prevent button from showing

---

### ❌ 4. Config not loaded

- `daoConfigStore === null`
- Prevent action (button disabled)

---

## **System Notes (Important for your architecture)**

### 🔥 1. This is a **one-time action**

- Should be guarded in UI
- Should not be callable again

---
