# **BigMarket Monorepo**

BigMarket is a market-centric, categorical prediction market protocol where each market is an isolated zero-sum pool. Markets sit on a spectrum between parimutuel and full CPMM modalities, selected at creation time via market type. Liquidity is provided proportionally across all outcomes and earns fees from trading activity, split between the platform and an LP reward pool.

Zero-sum per market. Every token that enters a market either exits via a winning claim, an LP withdrawal, or platform fees. Nothing is created or destroyed. This is auditable and provable in our contract logic.

Market-centric isolation is design choice over protocols where liquidity is global. Each market has its own pool, its own CPMM curve, its own LP set. Risk is contained. A bad market doesn't contaminate others. BigMarket bridges the spectrum between parimutuel and CPMM. Where;

- MARKET_TYPE_KNOCKOUT — parimutuel mode, buy and hold, no sell, simple pool split at resolution
- MARKET_TYPE_AMM — CPMM mode, continuous pricing, buy and sell, LP fees

---

## **Overview**

This monorepo contains:

- **Smart contracts (Clarity)** — on-chain market logic
- **API layer** — off-chain services and indexing
- **UI applications** — Svelte 5 frontends
- **Shared packages** — SDK, types, utilities, UI components

The architecture is designed for:

- modular reuse
- cross-chain expansion (Stacks, Solana, Sui)
- white-label deployments

---

## **Repository Structure**

```bash
.
├── apps/                  # Frontend applications
│   └── web/               # Main SvelteKit app (market UI)

├── api/                   # Backend services (Node.js / MongoDB)
│   └── src/

├── contracts/             # Clarity smart contracts
│   ├── markets/
│   ├── dao/
│   └── extensions/

├── packages/              # Shared libraries
│   ├── bm-common/         # Shared stores, config helpers
│   ├── bm-config/         # Environment + config management
│   ├── bm-create-market/  # Market creation UI + logic
│   ├── bm-design/         # Design tokens / Tailwind base
│   ├── bm-market/         # Market UI components
│   ├── bm-market-homepage/# Market listing / discovery UI
│   ├── bm-types/          # Shared TypeScript types
│   ├── bm-ui/             # Core UI component library
│   ├── bm-utilities/      # Formatting + helpers
│   ├── sdk/               # Cross-chain SDK abstraction
│   ├── sip18-forum/       # Forum components
│   ├── sip18-forum-types/ # Forum types
│   └── tsconfig/          # Shared TS config

├── pnpm-workspace.yaml
├── turbo.json / build config (if used)
└── README.md

```

---

## **Package Design Principles**

- **Separation of concerns**
  - UI, logic, contracts clearly split
- **Composable packages**
  - UI can be reused across apps
- **Chain abstraction**
  - SDK exposes unified interface:

    ```ts
    sdk.chain("stacks");
    sdk.chain("solana");
    ```

- **White-label ready**
  - Apps can selectively include packages

---

## **Getting Started**

### **Install dependencies**

```bash
pnpm install

```

---

## **Running the Project**

### **1. UI (SvelteKit App)**

```bash
pnpm --filter web dev

```

or (depending on naming):

```bash
pnpm --filter @bigmarket/web dev

```

Build:

```bash
pnpm --filter web build

```

---

### **2. API (Node Backend)**

```bash
pnpm --filter api dev

```

Build:

```bash
pnpm --filter api build

```

Run production:

```bash
pnpm --filter api start

```

---

### **3. Contracts (Clarity)**

From the `contracts/` directory:

#### Check contracts

```bash
clarinet check

```

#### Run tests

```bash
clarinet test

```

#### Deploy (testnet)

```bash
clarinet deploy --testnet

```

---

## **Working with Packages**

### Build a specific package

```bash
pnpm --filter @bigmarket/bm-ui build

```

---

### Watch mode (for UI libs)

```bash
pnpm --filter @bigmarket/bm-ui dev

```

---

### Rebuild all packages

```bash
pnpm -r build

```

---

## **Development Workflow**

### 1. Modify shared package

Example:

```
packages/bm-ui/

```

### 2. Rebuild or run in watch mode

```bash
pnpm --filter @bigmarket/bm-ui dev

```

### 3. App consumes updated package automatically

---

## **Tailwind + Design System**

- Centralised in:

```
packages/bm-design

```

- UI packages depend on it
- Apps must include it in `tailwind.config`

---

## **SDK Layer**

Located in:

```
packages/sdk

```

Provides:

- chain abstraction
- shared transaction logic
- future cross-chain compatibility

Example:

```ts
import { getChain } from "@bigmarket/sdk";

const chain = getChain("stacks");
```

---

## **Key Features Delivered (Milestone 1)**

- ✅ Complete CPMM trading layer:
  - buy / sell shares
  - add / remove liquidity
- ✅ Modular SDK foundation
- ✅ Svelte 5 Runes migration
- ✅ Monorepo restructuring for:
  - scalability
  - white-label deployments

---

## **Common Commands**

### Install everything

```bash
pnpm install

```

### Dev all (if using turbo)

```bash
pnpm dev

```

### Build all

```bash
pnpm build

```

### Lint

```bash
pnpm lint

```

---

## **Troubleshooting**

### Tailwind not applying (monorepo issue)

- Ensure app `tailwind.config` includes packages:

```js
content: ["../../packages/**/*.{svelte,ts}"];
```

---

### Types not resolving

- Ensure packages are built:

```bash
pnpm -r build

```

---

### Svelte components not found

Make sure:

```json
"types": "./dist/index.d.ts"

```

and build has been run.

---

## **Future Direction**

- Cross-chain deployment (Solana / Sui)
- Advanced execution models (hybrid CPMM + matching)
- Institutional / ESG prediction markets

---

## **License**

MIT (or your preferred license)

---

If you want, I can next:

- turn this into a **grant-ready technical appendix**
- or add a **diagram of architecture (contracts ↔ API ↔ UI ↔ SDK)** which would massively strengthen your submission
