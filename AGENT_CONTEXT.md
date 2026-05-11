# AGENT_CONTEXT.md

Purpose-built context for AI coding agents and human coders working on BigMarket.

## Mission

BigMarket is a DAO-governed prediction market on Stacks using Clarity contracts, a TypeScript SDK, an API service, and a SvelteKit frontend.

Agents should optimise for:

1. correctness and safety of funds
2. small vertical slices
3. clear separation between contracts, SDK, API, frontend logic, and UI
4. minimal on-chain complexity
5. tests before broad refactors

## Read First

Before editing code, read:

- `CLAUDE.md`
- relevant `/docs/specifications/` files
- relevant `/docs/use-cases/` files
- affected contract, SDK wrapper, API service, and frontend route/store
- existing tests for the same feature area

Do not implement features that are not grounded in a use case.

## Repository Mental Model

### Contracts

Location: `contracts/stacks/bigmarket-dao/contracts/`

Contracts own custody, market state, settlement, resolution, DAO permissions, governance, and reputation.

Important contracts:

- `bigmarket-dao.clar` — DAO core and extension registry
- `bme024-0-market-predicting.clar` — CPMM prediction market logic
- `bme024-0-market-scalar-pyth.clar` — scalar/Pyth market logic
- `bme030-0-reputation-token.clar` — BIGR reputation system
- treasury, governance, voting, liquidity, and gating extensions

Contract work must preserve:

- funds are conserved
- no double settlement
- orders cannot execute twice
- resolution is final after lock
- state transitions are explicit and tested

### SDK

Location: `packages/sdk/`

All contract interaction should go through the SDK. Do not duplicate Stacks.js call construction in frontend routes or components.

### Frontend

Location: `apps/frontend-c1/`

SvelteKit with Svelte 5 runes mode.

Keep:

- route files thin
- business logic in `src/lib/core/`
- state in `src/lib/stores/`
- contract calls routed through `packages/sdk`

### API

Location: `apps/api-v1/`

The API handles off-chain matching, indexing, cached market state, and any complexity that does not strictly need to live in Clarity.

Do not push matching or heavy computation on-chain.

### Shared Packages

- `bm-ui` — presentation only. No stores, no API calls, no business logic.
- `bm-types` — shared types.
- `bm-common` — shared utilities and stores.
- `bm-design` — design tokens.
- `bm-config` — config helpers.

## Agent Working Rules

1. Start from the use case.
2. Identify the smallest vertical slice.
3. Check whether the change touches funds, settlement, resolution, permissions, or market state.
4. Add or update tests before expanding scope.
5. Prefer explicit state machines over implicit boolean combinations.
6. Keep contracts minimal and auditable.
7. Keep UI components dumb; pass data and callbacks via props.
8. Never bypass the SDK for contract calls.
9. Do not introduce hidden global state in routes or UI components.
10. Do not “fix” unrelated code during a task unless it blocks the requested change.

## Security Guidance for Clarity Agents

Be especially cautious with:

- `tx-sender` versus `contract-caller`
- `as-contract`
- `contract-call?`
- external trait arguments
- proposal execution
- market resolution
- treasury transfers
- minting, burning, locking, unlocking
- fee calculation
- list indexing and category matching
- replayable signed messages
- transitions from open → disputed → resolved → settled

Use `contract-caller` for direct caller authorisation unless there is a deliberate reason not to.

Any public function that changes state should have:

- authorisation checks
- input bounds
- state-transition checks
- replay/double-execution protection where relevant
- tests for invalid callers and invalid states

## Known Historical Audit Themes

Previous review material flagged recurring risk areas:

- proposal execution accepting arbitrary proposal contracts
- `is-dao-or-extension` patterns using `tx-sender`
- treasury transfers without sufficient bounds
- market voting and resolution functions lacking authorisation or validation
- external market/trait contracts not being allowlisted
- stake/accounting updates not always tied to confirmed token movement

Treat these as high-priority checks when editing related code.

## Testing Expectations

For contract changes run:

```bash
cd contracts/stacks/bigmarket-dao
clarinet check
npm run test
```
