We are migrating away from a legacy BigMarketSessionStore to a set of fine-grained domain stores located in bm-common.

Goal:
Remove all remaining usages of BigMarketSessionStore and replace them with the new domain-specific stores.

Context:

- The new stores are already defined in bm-common (e.g. userWalletStore, allowedTokenStore, daoOverviewStore, reputationStore).
- Some parts of the codebase have already been migrated, but many components still depend on the old sessionStore.
- The codebase is SvelteKit (Svelte 5 → moving to runes later), TypeScript.

Tasks:

1. Find all remaining usages of:
   - BigMarketSessionStore type
   - sessionStore or derived session objects
   - any destructuring of session (e.g. const { balances, daoOverview } = $session)

2. For each usage:
   - Map each property to the correct domain store
     Example:
     session.balances → balanceStore
     session.daoOverview → daoStore
     session.userSettings → uiStore or systemStore (choose appropriately)

3. Refactor incrementally:
   - Replace sessionStore usage with direct imports from the correct domain store
   - Avoid introducing breaking changes
   - Keep existing logic intact

4. Clean up:
   - Remove unused imports of sessionStore
   - Remove dead types related to BigMarketSessionStore if no longer needed

5. Output:
   - Show diffs grouped by file
   - Explain any ambiguous mappings before applying
   - Do NOT refactor everything at once — proceed in small batches (3–5 files)

Constraints:

- Do not refactor to Svelte runes yet
- Do not change business logic
- Prefer minimal, readable changes
- Preserve reactivity (important for Svelte stores)

Before applying changes:

- First output a mapping table from BigMarketSessionStore fields → new stores
- Then propose the first batch of files to refactor
