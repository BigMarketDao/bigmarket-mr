Install external dependencies at the root

## Install Dependencies

```bash
pnpm add @scure/btc-signer @scure/base -r --filter bigmarket-ui
pnpm add @stacks/encryption -r --filter @bigmarket/bm-common

pnpm add "@repair/core@workspace:*" // in app
pnpm add "@repair/core@workspace:*" --filter ssr-web // in root
pnpm add @stacks/connect @stacks/transactions --filter ./packages/sdk
```

or keep all deps hoisted to root:

```bash
npm add -w @scure/btc-signer @scure/base
```

## Build Modules

```bash
pnpm --filter @bigmarket/bm-common build
pnpm --filter @bigmarket/bm-helpers build
pnpm --filter @bigmarket/sip18-forum build
pnpm --filter @bigmarket/sip18-forum-types build
```

whole poject

```bash
pnpm build -r

```

## Run Dev Server

```bash
pnpm --filter bigmarket-ui dev
```

## Miscellaneous

1. List all projects and scripts

```bash
pnpm recursive exec -- pnpm run build
```

Root package creation

```bash
npx sv create packages/bm-ui
```

Choose:

- Library Mode (not an app)
- TypeScript: Yes
- Svelte 5 (runes): either is fine, but ideally yes
- Tests: optional
- ESLint / Prettier: optional (but recommended)

## Testing

### Playwright

Run tests;

```pnpm
pnpm -w exec playwright test --config tests/e2e/playwright.config.ts

// single test
npx playwright test tests/specs/market/create-market.e2e.spec.ts
```