# UI Refactor Docs Index

Use this file as the entrypoint before executing UI-refactor prompts.

## Canonical docs (source of truth)

1. `styling-contract.md`  
   Rules of usage, layering (Tier 1/2/3), migration guardrails, dark-mode requirements.

2. `bm-semantic-tokens-proposal.md`  
   Semantic token inventory (roles, domain tokens, chart tokens, outcome slots).

3. `skeleton-theme-nouveau.md`  
   Visual baseline and mapping to Skeleton `nouveau` primitives.

## Support docs

4. `polymarket-ui-audit.md`  
   Audit method and reference extraction workflow (screenshots + DevTools).

## Archive / pointer

5. `design audit polymarket bigmarket.MD`  
   Kept only as historical pointer to canonical docs. Do not edit as source of truth.

## Single-source rule

If two docs conflict:

1) `styling-contract.md` wins for process/rules  
2) `bm-semantic-tokens-proposal.md` wins for naming/inventory  
3) `theme.css` and `tokens.ts` win for implemented values
