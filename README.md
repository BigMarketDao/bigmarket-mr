# BigMarket FPMM

A minimal, use-case driven monorepo for building the BigMarket prediction market protocol on Stacks.

This repository is intentionally lightweight.
We build the system through **concrete user flows**, not abstract architecture.

---

## 🧭 Approach

Instead of designing all components upfront, we follow:

> **Use case → implementation → structure**

Each feature is introduced as a **vertical slice** that touches:

- smart contracts
- SDK
- frontend

This keeps the system:

- simple
- testable
- grounded in real behaviour

---

## 🧱 Current Focus

The initial architecture is defined by the **vault trading flow**:

1. **Deposit** — user deposits SIP-010 tokens into a vault
2. **Allocate** — user uses deposited funds in a market position
3. **Withdraw** — user withdraws unused or settled funds

This establishes the core primitives:

- token custody
- internal accounting
- market interaction

---

## 📁 Repository Structure

```text
.
├── apps
│   ├── backend-api        # minimal backend (future use, currently thin)
│   └── frontend-c1        # primary client UI (client 1)
│       └── src
│
├── contracts
│   └── stacks
│       └── bigmarket-dao  # Clarity smart contracts (Clarinet project)
│
├── docs
│   ├── contracts          # contract-level notes and specs
│   ├── flows              # sequence / interaction flows
│   ├── invariants         # system invariants and guarantees
│   └── use-cases          # source of truth for architecture
│
├── packages
│   ├── sdk                # thin TypeScript contract interaction layer
│   ├── types              # shared types (introduced as needed)
│   └── ui                 # shared UI components (introduced as needed)
│
└── scripts                # repo utilities (e.g. initialise.sh)
```

---

## 📌 Key Principles

### 1. Use Cases Drive Everything

All architecture decisions originate from `/docs/use-cases`.

If a component is not required by a use case, it should not exist.

---

### 2. Minimal by Default

We avoid premature abstractions:

- no indexer until needed
- no backend logic unless required
- no shared packages without duplication pressure

---

### 3. Clear Separation of Concerns

- **contracts/** → on-chain logic (source of truth)
- **packages/sdk** → interaction layer
- **apps/frontend-c1** → user interface
- **docs/** → system understanding

---

### 4. Shared Vault Model

The system uses a **central vault contract**:

- users deposit SIP-010 tokens
- balances are tracked internally
- funds are allocated to markets from the vault
- unused funds remain withdrawable

---

## 🚀 Getting Started

### Initialise repo structure

```bash
./scripts/initialise.sh
```

---

### Run frontend

```bash
cd apps/frontend-c1
# install + run depending on your setup
```

---

### Work with contracts

```bash
cd contracts/stacks/bigmarket-dao
clarinet test
```

---

## 🛠 Development Workflow

1. Define or refine a use case in:

   ```text
   docs/use-cases/
   ```

2. Implement contract changes

3. Add SDK support

4. Wire into frontend

5. Repeat

---

## 🧪 What’s Not Included (Yet)

These will only be introduced when required:

- indexer
- matching engine
- settlement service
- complex backend APIs
- advanced governance layers

---

## 🧠 Notes for Contributors / Agents

- Do not bypass the vault for fund movement
- Keep contracts, SDK, and UI aligned with use cases
- Prefer simple implementations over extensible abstractions
- Add structure only when it is clearly required

---

## 📍 Status

This repository is in early-stage development.
The current goal is to establish a **clean, working foundation** for the protocol.
