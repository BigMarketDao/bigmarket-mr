# BigMarket agent skill — test guide (testnet)

Step-by-step instructions to install the AIBTC MCP server, wire up the `bigmarket` skill, run each action in order, and (later) enable BANG-gated market creation.

**Files in this repo**

| File | Role |
|------|------|
| `agents/bigmarket/SKILL.md` | Skill manifest (what the agent reads) |
| `agents/bigmarket/bigmarket.ts` | Skill implementation (CLI + MCP calls) |
| `agents/README.md` | Layout — single canonical folder, symlinks |
| `agents/.env.testnet.example` | Copy-paste env template (see Phase 4) |

**What needs BANG vs what does not**

| Action | Wallet | STX | BANG |
|--------|--------|-----|------|
| `list-markets` | No | No | No |
| `read-market` | Optional | No | No |
| `status` | Yes | No (gas only) | No |
| `predict` / `sell` / liquidity / `claim-rewards` | Yes | Yes | No |
| `create-market` | Yes | Yes (seed) | **Yes** (when enabled) |
| `claim-airdrop` | Yes | Gas only | **Yes** (when enabled) |

BANG is **off by default**. You can complete Phases 1–9 without deploying BANG.

---

## Prerequisites

Install once on your machine:

```bash
# Node 20+ (repo requirement)
node -v

# AIBTC MCP (installed in Phase 1)
# Clarinet — only for Phase 10 (BANG contracts)
brew install clarinet   # macOS
clarinet --version
```

Optional but useful:

- [Hiro Stacks testnet explorer](https://explorer.hiro.so/?chain=testnet)
- [Hiro testnet faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)

---

## Phase 1 — Install AIBTC MCP (Cursor / Claude Code)

**Goal:** Your IDE agent can call `wallet_list`, `call_contract`, `call_read_only_function`, etc.

### 1.1 Run the installer

```bash
npx @aibtc/mcp-server@latest --install
```

**What it does**

- Often detects **Claude Code** first and writes `~/.claude.json` — that does **not** configure Cursor.
- Does **not** create a wallet by itself.

**If the installer says “Claude Code”:** skip re-running it for Cursor. Configure Cursor manually (below).

### 1.2 Configure Cursor manually (recommended)

Cursor reads MCP from your **user** config, not the project folder:

| File | Purpose |
|------|---------|
| `~/.cursor/mcp.json` | **Use this** — applies to Cursor everywhere |
| `.cursor/mcp.json` in repo | Optional — only if you want MCP for this project alone |

You do **not** need a `.cursor` folder in the repo for MCP. A home `~/.cursor/` folder is normal.

Create or edit **`~/.cursor/mcp.json`** with:

```json
{
  "mcpServers": {
    "aibtc": {
      "command": "npx",
      "args": ["-y", "@aibtc/mcp-server@latest"],
      "env": {
        "NETWORK": "testnet",
        "BIGMARKET_NETWORK": "testnet"
      }
    }
  }
}
```

On macOS, full path:

```text
/Users/<your-username>/.cursor/mcp.json
```

Optional — project-only copy (create the folder first):

```bash
mkdir -p .cursor
# paste the same JSON into .cursor/mcp.json
```

Manual reference: [aibtc.com/guide/mcp](https://aibtc.com/guide/mcp)

**Note:** `npx @aibtc/mcp-server --install` may have put aibtc in `~/.claude.json` with `NETWORK=mainnet`. That only affects Claude Code, not Cursor.

### 1.3 Restart the agent session

1. Quit and reopen Cursor, **or** reload the window.
2. Start a **new** chat (old chats may not see new MCP tools).

### 1.4 Verify MCP tools exist

In chat, ask:

> Search your tools for `wallet_list` and `call_read_only_function`. List the AIBTC wallet/contract tools you have.

**Expected:** Tools such as `wallet_list`, `wallet_unlock`, `call_contract`, `call_read_only_function`.

**If missing:** Run the installer again, confirm `NETWORK` is set, restart Cursor, open a new chat.

---

## Phase 2 — Install core AIBTC skills (wallet first)

**Goal:** Create and unlock a Stacks testnet wallet before any BigMarket writes.

The `bigmarket` skill declares `requires: wallet`. Install the official wallet skill:

```bash
npx skills add aibtcdev/skills --skill wallet
```

Optional (helpful for debugging chain calls):

```bash
npx skills add aibtcdev/skills --skill query
npx skills add aibtcdev/skills --skill stx
```

**What changes on disk**

- Skills are copied into your agent skills directory (location depends on client; often under `~/.cursor/` or project `.cursor/`).
- You do **not** need to edit wallet skill files.

**What to expect**

- `npx skills add` prints where it installed the skill.

---

## Phase 3 — Install the BigMarket skill from this repo

**Goal:** Agent can discover `bigmarket` and read `SKILL.md`.

AIBTC expects **one folder per skill**:

```
bigmarket/
  SKILL.md
  bigmarket.ts
```

**Canonical files** live only in `agents/bigmarket/` (see `agents/README.md`).  
`.agents/skills/bigmarket` should be a **symlink** to that folder (already set up in this repo).

Install **for Cursor** (skip the interactive agent picker):

```bash
# From repo root — use --agent cursor so it does not default to Claude Code
npx skills add "./agents/bigmarket" --agent cursor -y
```

Re-link after moving the repo or if the symlink breaks:

```bash
rm -rf .agents/skills/bigmarket
ln -sf ../../agents/bigmarket .agents/skills/bigmarket
npx skills add "./agents/bigmarket" --agent cursor -y
```

**Verify:**

```bash
npx skills list
# Should show: bigmarket  →  Agents: Cursor
```

Then **restart Cursor** and open this repo folder (`bigmarket nextlevel`) as the workspace.

**Alternative:** Symlink into a personal skills folder:

```bash
mkdir -p ~/.aibtc/skills
ln -sf "$(pwd)/agents/bigmarket" ~/.aibtc/skills/bigmarket
npx skills add ~/.aibtc/skills/bigmarket
```

**Verify**

- Skill name in frontmatter: `bigmarket`
- Version in `SKILL.md` should match what you expect (e.g. `0.3.1`)

Restart the agent chat after installing.

---

## Phase 4 — Environment variables (what to set, where)

**Goal:** Network = testnet; BANG stays disabled until you finish Phase 10.

### 4.1 Create a local env file (recommended)

```bash
cp agents/.env.testnet.example agents/.env.testnet
```

Edit `agents/.env.testnet`:

```bash
# Required for all testnet use
export BIGMARKET_NETWORK=testnet

# BANG — leave OFF until Phase 10
# export BIGMARKET_BANG_ENABLED=true
# export BIGMARKET_BANG_CONTRACT=ST....bang-token
# export BIGMARKET_BANG_GATE_CONTRACT=ST....bang-market-gate
# export BIGMARKET_BANG_CLAIM_CONTRACT=ST....bang-claim

# Optional: skip --confirm during manual agent tests (use carefully)
# export BIGMARKET_AUTO_CONFIRM=true
```

Load before terminal tests:

```bash
source agents/.env.testnet
```

### 4.2 MCP / agent session

The BigMarket **script** reads `process.env`. For agent-driven runs:

- Export the same variables in the shell that launches Cursor, **or**
- Add them to the `env` block of your `aibtc` MCP server in `mcp.json`:

```json
"env": {
  "NETWORK": "testnet",
  "BIGMARKET_NETWORK": "testnet"
}
```

Do **not** set `BIGMARKET_BANG_ENABLED=true` until Phase 10.

### 4.3 On-chain addresses (already deployed on testnet)

| Contract | Testnet principal |
|----------|-------------------|
| Deployer | `ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T` |
| Markets (bme024) | `ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme024-0-market-predicting` |
| BIGR (bme030) | `ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme030-0-reputation-token` |
| API base | `https://api.testnet.bigmarket.ai/bigmarket-api` |

You do **not** put these in env vars for normal trading; the skill hard-codes deployer + contract names.

---

## Phase 5 — Smoke test without a wallet (terminal)

**Goal:** Confirm API + skill script work. **No MCP, no STX, no wallet.**

```bash
cd agents
export BIGMARKET_NETWORK=testnet
node --experimental-strip-types bigmarket.ts list-markets
```

**Expected output (example)**

```text
#1  [OPEN]  Will the Strait of Hormuz be reopened...
    AGAINST          pool=75000000  p=60.00%
    FOR              pool=50000000  p=40.00%
#2  [OPEN]  ...
```

**If you see** `m.categories is not iterable` — update `bigmarket.ts` from `main` (API mapping fix).

**If you see** `No markets found` — API may be down or empty; try `curl -s "https://api.testnet.bigmarket.ai/bigmarket-api/pm/markets/1/categorical" | head`.

**Note:** `read-market`, `status`, and writes **cannot** run in plain Node; they need MCP globals (`call_read_only_function`, etc.). Those are tested in Phase 7+ via the agent.

---

## Phase 6 — Create a testnet wallet (before any writes)

**When:** After Phase 5 passes, **before** `status`, `predict`, or liquidity.

**Where:** Agent chat with MCP + wallet skill (not the BigMarket script alone).

### 6.1 List wallets

Ask the agent:

> Use the wallet skill: run `wallet_list`. If empty, create a new testnet wallet with `wallet_create`, then `wallet_unlock`. Show me the Stacks (STX) address only — not the seed phrase in the chat log.

**Expected**

- `wallet_list` returns at least one `ST...` address.
- Wallet files under `~/.aibtc/` (encrypted).

**Save offline:** mnemonic / password (shown once at creation).

### 6.2 Register with AIBTC (optional for BigMarket trading)

BigMarket trading does **not** require [aibtc.com](https://aibtc.com) registration. Register only if you want inbox/heartbeat/leaderboard:

- Follow [aibtc.com/llms.txt](https://aibtc.com/llms.txt) — registration + heartbeat sections.

---

## Phase 7 — Fund the wallet (before `predict`)

**When:** After the wallet exists, **before** any transaction that spends STX.

### 7.1 How much STX

| Use | Suggested minimum |
|-----|-------------------|
| Gas only (`status`, `read-market` with wallet) | ~0.5 STX |
| One small `predict` (~1 STX notional) | ~2–5 STX |
| `create-market` seed (later) | seed + gas (seed ≥ 1 STX = `1000000` µSTX minimum in skill) |

Amounts in the skill are **micro-STX** (6 decimals): `1000000` = 1 STX.

### 7.2 Get testnet STX

1. Copy your `ST...` address from Phase 6.
2. Open [Hiro testnet faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet).
3. Request STX (may need login / captcha).
4. Confirm on [explorer](https://explorer.hiro.so/?chain=testnet) — balance updates in a few minutes.

### 7.3 Confirm balance

Ask the agent:

> Use the stx or query skill to get my testnet STX balance for `<your-ST-address>`.

**Expected:** Non-zero `balance` (µSTX).

---

## Phase 8 — Read-only chain tests (agent + MCP)

**Goal:** Read market state from chain; check BIGR without trading.

### 8.1 `read-market`

Ask:

> Using the bigmarket skill on testnet, run read-market for market id 1. Summarize status, categories, and pool sizes.

**Expected**

- JSON with `data`, `accounting`, and optionally `stakes`.
- Categories for market #1 are typically `AGAINST` and `FOR` (not `YES`/`NO`).

**If it fails:** Check MCP `NETWORK=testnet`, wallet unlocked, and that market `1` exists (`list-markets`).

### 8.2 `status`

Ask:

> Run bigmarket status for my wallet on testnet.

**Expected**

```text
network:   testnet
wallet:    ST...
epoch:     ...
BIGR balances by tier:
  tier 1: ...
current tier: ...
BANG / create-market:  disabled (set BIGMARKET_BANG_ENABLED=true when token is live)
```

BANG line should say **disabled** until Phase 10.

---

## Phase 9 — Write tests (trading, no BANG)

**Goal:** Place and exit a small position; optional liquidity / BIGR claim.

**Rules**

- Every write needs `--confirm` unless `BIGMARKET_AUTO_CONFIRM=true`.
- Use real category labels from `list-markets` / `read-market` (e.g. `FOR`, not `YES`).

### 9.1 `predict` (dry run then confirm)

Ask:

> On testnet bigmarket, preview predict on market 1, category FOR, amount 1000000 (1 STX). Show the preview only — do not broadcast.

Then:

> Same call with --confirm. Give me the transaction id.

**Expected**

- Preview: market, category, min shares, max cost.
- After confirm: `txid: 0x...`
- New line in `~/.aibtc/bigmarket-history.json`

**Verify on explorer:** [explorer.hiro.so](https://explorer.hiro.so/?chain=testnet) → paste txid.

### 9.2 `status` again

**Expected:** Position reflected in stake balances (via `read-market` or accounting).

### 9.3 `sell`

Ask:

> Preview then confirm sell on market 1, category FOR, with the shares I hold (use read-market to get the amount).

### 9.4 Optional: liquidity and BIGR

| Step | Command idea | Needs |
|------|----------------|-------|
| Add liquidity | `add-liquidity 1 2000000 --confirm` | STX; proportional deposit warning |
| Remove liquidity | `remove-liquidity 1 <lp-shares> --confirm` | LP shares |
| Claim BIGR | `claim-rewards --confirm` | Epoch/reward eligibility on chain |

### 9.5 Checklist (Phases 1–9)

Copy and tick off:

- [ ] MCP installed, `NETWORK=testnet`, tools visible
- [ ] Wallet skill installed; wallet created + unlocked
- [ ] BigMarket skill installed (`agents/bigmarket/`)
- [ ] `agents/.env.testnet` sourced (BANG **not** enabled)
- [ ] `list-markets` works in terminal
- [ ] Wallet funded from faucet
- [ ] `read-market 1` works via agent
- [ ] `status` shows BIGR, BANG disabled
- [ ] `predict` preview + confirm → txid on explorer
- [ ] `sell` preview + confirm → txid
- [ ] History file appended at `~/.aibtc/bigmarket-history.json`

---

## Phase 9b — Forum comments (no STX, no BANG required)

**When:** After Phase 9.1 (`predict` works). Only needs a funded wallet and a market that has a `forumMessageId`.

**Goal:** Agent posts a comment on a market thread, visible in the BigMarket UI with a verified badge.

### 9b.1 Confirm the market has a forum thread

Ask the agent or use the API directly:

```bash
curl -s "https://api.testnet.bigmarket.ai/bigmarket-api/pm/markets/1/categorical" \
  | grep -o '"forumMessageId":"[^"]*"'
```

**Expected:** `"forumMessageId":"<uuid>"` — if absent, the market pre-dates the forum or was created without one.

### 9b.2 Preview (no broadcast)

Ask:

> Using the bigmarket skill on testnet, preview a comment on market 1 with content "Hello from the agent — Phase 9b test." Do not post yet.

**Expected output:**

```
Preview — comment
  market:     1
  thread:     <uuid>
  parent:     <uuid>
  level:      2
  wallet:     ST...
  content:    Hello from the agent — Phase 9b test.
  message-id: <new-uuid>
  forum:      https://api.tforum.bigmarket.ai/forum-api
This is a write action. Re-run with --confirm to broadcast.
```

### 9b.3 Post the comment

Ask:

> Run bigmarket comment 1 "Hello from the agent — Phase 9b test." on testnet with --confirm.

**Expected:**

```
✓ comment posted
  message-id: <uuid>
  level:      2
  thread:     https://api.tforum.bigmarket.ai/forum-api/forum/messages/<uuid>
```

New line in `~/.aibtc/bigmarket-history.json` with `action: "comment"`.

### 9b.4 Verify in the UI

Open `https://testnet.bigmarket.ai/market/1/0` → **Discussion** tab.

**Expected:** Agent's comment appears with the verified STX address badge. Title is blank (correct — browser replies at level ≥2 use empty title).

### 9b.5 Test nested reply

Copy a `messageId` from the thread (from the API or UI), then:

> Run bigmarket comment 1 "Nested reply from agent" --reply-to <message-id> --confirm on testnet.

**Expected:** `level: 3` in preview and output. Comment appears nested under the parent in the UI.

### 9b.6 Checklist

- [ ] Market has `forumMessageId` (via API)
- [ ] Preview shows correct thread, level 2, empty title
- [ ] `--confirm` posts successfully, message-id returned
- [ ] Comment visible in UI with verified badge
- [ ] `--reply-to` produces level 3 nested reply
- [ ] History appended at `~/.aibtc/bigmarket-history.json`

---

## Phase 10 — BANG token and `create-market` (later)

**When you need this:** Only to test agent-created markets and `claim-airdrop`. **Not** required for predict/sell/LP.

**Current repo state:** There are **no** BANG, gate, or claim contracts in `contracts/stacks/bigmarket-dao/` yet. The skill (`agents/bigmarket/SKILL.md` + `create-market` in `bigmarket.ts`) describes the **target** design. You must implement and deploy them before enabling BANG in env.

### 10.1 What to deploy (three contracts)

| # | Contract | Purpose |
|---|----------|---------|
| 1 | **BANG token** | SIP-010 fungible token (`get-decimals`, `get-balance`, `transfer`, mint for test) |
| 2 | **BANG gate** | Public `create-market` that burns 100 BANG (or threshold from `get-bang-threshold`) and calls `bme024-0-market-predicting.create-market` |
| 3 | **BANG claim** (optional) | Airdrop: `get-eligibility`, `claim-airdrop` |

Gate must expose (DAO-governed later):

- `get-exempt(principal) -> bool`
- `get-bang-threshold() -> uint` (use `u0` on testnet to disable burn while testing)
- `set-exempt`, `set-bang-threshold` (DAO-only)

Reference: `agents/bigmarket/SKILL.md` and `create-market` in `agents/bigmarket/bigmarket.ts`.

Pattern for SIP-010: `contracts/stacks/bigmarket-dao/contracts/extensions/bme000-0-governance-token.clar` (BIG token).

### 10.2 Deploy to testnet (high level)

Work from the contracts package:

```bash
cd contracts/stacks/bigmarket-dao
```

1. Add your three `.clar` files to the Clarinet project (and `Clarinet-Testnet.toml` when you maintain one).
2. Run tests: `npm test`
3. Deploy with the **testnet deployer** key (`ST30Q4...`) — same process as other extensions in [contracts README](../contracts/stacks/bigmarket-dao/README.md):
   - `clarinet deployments apply` with a testnet plan, **or**
   - Hiro sandbox / CLI deploy in dependency order (DAO → extensions → BANG contracts).
4. Record principals, e.g.:
   - `ST30Q4....bang-token`
   - `ST30Q4....bang-market-gate`
   - `ST30Q4....bang-claim`

5. **Register BANG on bme024** (if markets should settle in BANG): DAO proposal or deployer call to `is-allowed-token` / allow-list path on `bme024-0-market-predicting` (exact function name in your bme024 version).

6. **Mint test BANG** to your agent wallet (e.g. 200 BANG) via a test-only `mint` or faucet function.

### 10.3 Testnet shortcuts (recommended first)

Before testing the full burn flow:

1. Deploy gate with `get-bang-threshold` = `u0` **or**
2. Call `set-exempt(your-ST-wallet, true)` on the gate so your wallet skips the balance check.

Then test `create-market` without holding 100 BANG. Re-enable threshold / burn once tokenomics are ready.

### 10.4 Enable BANG in the skill

Edit `agents/.env.testnet`:

```bash
export BIGMARKET_BANG_ENABLED=true
export BIGMARKET_BANG_CONTRACT=ST30Q4....bang-token
export BIGMARKET_BANG_GATE_CONTRACT=ST30Q4....bang-market-gate
export BIGMARKET_BANG_CLAIM_CONTRACT=ST30Q4....bang-claim   # optional
```

Reload env / restart Cursor. Add MCP env vars if you use them there.

### 10.5 BANG test sequence

| Step | Action | Expected |
|------|--------|----------|
| 1 | `status` | Shows BANG balance; create-market gate ELIGIBLE or INELIGIBLE |
| 2 | `create-market "Test agent market" YES NO 5000000` (no confirm) | Preview only; shows gate, burn, seed |
| 3 | Same with `--confirm` | `txid` + `market-id`; BANG −100 (if threshold > 0) |
| 4 | `list-markets` | New market appears at end of list |
| 5 | `claim-airdrop` | Eligibility or “Not eligible” |
| 6 | `claim-airdrop --confirm` | Only if eligible; balance increases |

### 10.6 Publish skill upstream (optional)

When ready for other agents:

1. Fork [github.com/aibtcdev/skills](https://github.com/aibtcdev/skills).
2. Add `skills/bigmarket/` with `SKILL.md`, `bigmarket.ts`, optional `AGENT.md`.
3. PR; after merge: `npx skills add aibtcdev/skills --skill bigmarket`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `wallet_list` not found | MCP not loaded | Re-run `--install`, restart Cursor, new chat |
| Calls hit mainnet | `NETWORK=mainnet` | Set `NETWORK=testnet` in MCP config |
| `call_read_only_function is not defined` | Running `bigmarket.ts` in plain Node | Use agent + MCP for chain calls; terminal only for `list-markets` |
| `This is a write action. Re-run with --confirm` | Safety gate | Add `--confirm` or set `BIGMARKET_AUTO_CONFIRM=true` (dev only) |
| `category not found` / u1003 | Wrong label | Use `FOR`/`AGAINST` from API, not `YES`/`NO` |
| Insufficient STX | Empty wallet | Faucet (Phase 7) |
| `create-market is disabled until...` | BANG off (default) | Expected until Phase 10 + `BIGMARKET_BANG_ENABLED=true` |
| `BIGMARKET_BANG_GATE_CONTRACT not set` | BANG enabled but env incomplete | Set all three `BIGMARKET_BANG_*` vars |
| Predict succeeds but no position | Wrong market/category | `read-market` and match category strings exactly |

---

## Quick command reference

```bash
# Terminal — markets list only
cd agents && BIGMARKET_NETWORK=testnet node --experimental-strip-types bigmarket.ts list-markets

# Install stack
npx @aibtc/mcp-server@latest --install
npx skills add aibtcdev/skills --skill wallet
npx skills add "./agents/bigmarket"

# Env
source agents/.env.testnet
```

**Agent prompts (examples)**

```text
Run bigmarket list-markets on testnet.
Run bigmarket read-market 1 on testnet.
Run bigmarket status on testnet.
Preview bigmarket predict 1 FOR 1000000 on testnet (no confirm).
Run bigmarket predict 1 FOR 1000000 on testnet with --confirm.
```

---

## Related docs

- [AIBTC llms.txt](https://aibtc.com/llms.txt) — MCP, wallet, registration
- [AIBTC skills repo](https://github.com/aibtcdev/skills) — skill format
- [BigMarket contracts README](../contracts/stacks/bigmarket-dao/README.md) — Clarinet deploy
- `agents/bigmarket/SKILL.md` — machine-readable skill manifest
- `agents/README.md` — folder layout and symlinks
