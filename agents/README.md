# BigMarket agent skill

**Canonical location (edit only here):**

```
agents/bigmarket/
  SKILL.md       # skill manifest — what Cursor / AIBTC read
  bigmarket.ts   # implementation (MCP: wallet, contracts, sip018_*)
```

Do **not** add `agents/SKILL.md` or `agents/bigmarket.ts` at the repo root of `agents/`. Those paths are intentionally unused (see root `.gitignore`).

## Cursor (this repo)

`.agents/skills/bigmarket` is a **symlink** to `agents/bigmarket/`. After editing the canonical folder, Cursor picks up changes on the next chat (no copy step).

## AIBTC install (`~/.aibtc/skills`)

Point the global install at the same folder once:

```bash
# From monorepo root
mkdir -p ~/.aibtc/skills
ln -sf "$(pwd)/agents/bigmarket" ~/.aibtc/skills/bigmarket
npx skills add ~/.aibtc/skills/bigmarket --agent cursor -y
```

## Also required (not in this folder)

| Piece | Where |
|-------|--------|
| AIBTC MCP | `~/.cursor/mcp.json` — see `agents/TESTING.md` Phase 1 |
| Wallet skill | `npx skills add aibtcdev/skills --skill wallet` |
| Env | `BIGMARKET_NETWORK=testnet` in MCP `env` or `agents/.env.testnet` |

Full test flow: `agents/TESTING.md`.
