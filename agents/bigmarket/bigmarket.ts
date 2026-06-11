#!/usr/bin/env node
/**
 * bigmarket — aibtc skill for BigMarket prediction markets on Stacks.
 *
 * Self-contained: Node stdlib only. All chain interaction happens through the
 * agent runtime MCP tools (call_contract, call_read_only_function, wallet_list,
 * wallet_unlock). No bundler, no npm deps.
 */

import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// ---------- MCP tool declarations (provided by the agent runtime) ----------

declare function call_contract(
  contract: string,
  fn: string,
  args: unknown[],
): Promise<{ txid: string; result?: unknown }>;
declare function call_read_only_function(
  contract: string,
  fn: string,
  args: unknown[],
): Promise<unknown>;
declare function wallet_list(): Promise<string[]>;
declare function wallet_unlock(
  address: string,
  passphrase?: string,
): Promise<void>;
declare function sip018_sign(params: {
  message: Record<string, unknown>;
  domain: { name: string; version: string };
}): Promise<{ signature: string; publicKey?: string; verification?: string }>;
declare function sip018_hash(params: {
  message: Record<string, unknown>;
  domain: { name: string; version: string; chainId?: number };
}): Promise<{ verification: string; domainHash: string; messageHash: string }>;
declare function sip018_verify(params: {
  messageHash: string;
  signature: string;
  expectedSigner?: string;
}): Promise<{ publicKey: string; address: string; valid?: boolean }>;

// ---------- Types ----------

type Network = "testnet" | "mainnet";

interface MarketSummary {
  id: number;
  title: string;
  status: string;
  categories: string[];
  pools: Record<string, string>;
  impliedProbability: Record<string, number>;
}

interface HistoryRecord {
  ts: string;
  action: string;
  network: Network;
  wallet: string;
  txid: string;
  params: Record<string, unknown>;
}

// ---------- Constants ----------

const DEPLOYERS: Record<Network, string> = {
  testnet: "ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T",
  mainnet: "SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD",
};

const API_BASES: Record<Network, string> = {
  testnet: "https://api.testnet.bigmarket.ai/bigmarket-api",
  mainnet: "https://api.bigmarket.ai/bigmarket-api",
};

const BIGR_TIERS = [1, 2, 4, 12] as const;

const CLARITY_ERRORS: Record<string, string> = {
  u1001: "market not found",
  u1002: "market not open",
  u1003: "category not found",
  u1004: "insufficient shares",
  u1005: "slippage exceeded",
  u1006: "seed amount too low",
  u2001:
    "not authorized (BANG balance insufficient or gate contract misconfigured)",
};

const HISTORY_PATH = join(homedir(), ".aibtc", "bigmarket-history.json");

// ---------- Forum constants ----------

const FORUM_APIS: Record<Network, string> = {
  testnet: "https://api.tforum.bigmarket.ai/forum-api",
  mainnet: "https://api.forum.bigmarket.ai/forum-api",
};

/** Shared board ID — all BigMarket market threads live here. */
const MESSAGE_BOARD_ID = "90a5e66c-d42f-4307-a3fc-c871435ca244";

function forumApi(net: Network): string {
  return FORUM_APIS[net];
}

// ---------- Config helpers ----------

function getNetwork(): Network {
  const n = (process.env.BIGMARKET_NETWORK ?? "testnet").toLowerCase();
  if (n !== "testnet" && n !== "mainnet") {
    throw new Error(
      `BIGMARKET_NETWORK must be 'testnet' or 'mainnet' (got: ${n})`,
    );
  }
  return n;
}

function deployer(net: Network): string {
  return DEPLOYERS[net];
}

function bme024(net: Network): string {
  return `${deployer(net)}.bme024-0-market-predicting`;
}

function bme030(net: Network): string {
  return `${deployer(net)}.bme030-0-reputation-token`;
}

function treasury(net: Network): string {
  return `${deployer(net)}.bme006-0-treasury`;
}

function bangContract(flag?: string): string {
  const v = flag ?? process.env.BIGMARKET_BANG_CONTRACT;
  if (!v)
    throw new Error(
      "BIGMARKET_BANG_CONTRACT not set (or pass --bang-contract).",
    );
  return v;
}

function bangGateContract(flag?: string): string {
  const v = flag ?? process.env.BIGMARKET_BANG_GATE_CONTRACT;
  if (!v) {
    throw new Error(
      "BIGMARKET_BANG_GATE_CONTRACT not set (or pass --bang-gate-contract). " +
        "Market creation goes through the BANG gate contract, not bme024 directly.",
    );
  }
  return v;
}

function bangClaimContract(flag?: string): string {
  const v = flag ?? process.env.BIGMARKET_BANG_CLAIM_CONTRACT;
  if (!v) {
    throw new Error(
      "BIGMARKET_BANG_CLAIM_CONTRACT not set (or pass --bang-claim-contract).",
    );
  }
  return v;
}

function autoConfirm(): boolean {
  return (process.env.BIGMARKET_AUTO_CONFIRM ?? "").toLowerCase() === "true";
}

/** BANG token, gate, and airdrop flows stay off until contracts are deployed. */
function bangFeaturesEnabled(): boolean {
  return (process.env.BIGMARKET_BANG_ENABLED ?? "").toLowerCase() === "true";
}

function requireBangFeatures(action: string): void {
  if (bangFeaturesEnabled()) return;
  throw new Error(
    `${action} is disabled until the BANG token and DAO gate contracts are live. ` +
      "Trading (STX) still works. When ready, set BIGMARKET_BANG_ENABLED=true and " +
      "BIGMARKET_BANG_CONTRACT, BIGMARKET_BANG_GATE_CONTRACT, BIGMARKET_BANG_CLAIM_CONTRACT.",
  );
}

// ---------- CLI helpers ----------

interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function requireConfirm(flags: Record<string, string | boolean>): void {
  if (flags.confirm === true || autoConfirm()) return;
  throw new Error(
    "This is a write action. Re-run with --confirm to broadcast.",
  );
}

// ---------- Math helpers ----------

function applySlippage(amount: bigint, bipsAllowed = 500n): bigint {
  // (amount * (10000 - bips)) / 10000  → 5% guard at bipsAllowed=500
  return (amount * (10000n - bipsAllowed)) / 10000n;
}

function formatToken(amount: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

// ---------- History ----------

function recordHistory(rec: HistoryRecord): void {
  const dir = dirname(HISTORY_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(HISTORY_PATH, JSON.stringify(rec) + "\n", "utf8");
}

// ---------- HTTP (stdlib fetch — Node ≥18) ----------

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok)
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

// ---------- Wallet ----------

async function activeWallet(): Promise<string> {
  const wallets = await wallet_list();
  if (!wallets.length)
    throw new Error(
      "No connected wallets — run wallet_list / wallet_unlock first.",
    );
  const w = wallets[0];
  await wallet_unlock(w);
  return w;
}

// ---------- Token resolution ----------

async function resolveToken(
  net: Network,
  marketId: number,
  tokenFlag: string | undefined,
): Promise<string> {
  if (!tokenFlag || tokenFlag.toLowerCase() === "stx") {
    return `${deployer(net)}.stx-token`; // sentinel — caller passes principal directly to Clarity
  }
  if (tokenFlag.toLowerCase() === "bang") {
    requireBangFeatures("--token bang");
    const bang = bangContract();
    const allowed = await call_read_only_function(
      bme024(net),
      "is-allowed-token",
      [bang],
    );
    if (!isTrueOk(allowed)) {
      throw new Error(
        `BANG (${bang}) is not an allowed token for market ${marketId}.`,
      );
    }
    return bang;
  }
  return tokenFlag;
}

function isTrueOk(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (o.value === true) return true;
    if (o.ok === true || o.type === "ok") return true;
  }
  return false;
}

function unwrap(v: unknown): unknown {
  if (typeof v === "object" && v !== null && "value" in v) {
    return (v as { value: unknown }).value;
  }
  return v;
}

function toBigInt(v: unknown): bigint {
  const u = unwrap(v);
  if (typeof u === "bigint") return u;
  if (typeof u === "number") return BigInt(u);
  if (typeof u === "string") return BigInt(u.replace(/^u/, ""));
  throw new Error(`Cannot convert ${JSON.stringify(v)} to bigint`);
}

// ---------- BANG gate ----------

async function assertBangGateEligible(
  wallet: string,
  gateContract: string,
): Promise<{
  threshold: bigint;
  decimals: number;
  balance: bigint;
}> {
  const exempt = await call_read_only_function(gateContract, "get-exempt", [
    wallet,
  ]);
  const bang = bangContract();
  const decimals = Number(
    toBigInt(await call_read_only_function(bang, "get-decimals", [])),
  );
  const balance = toBigInt(
    await call_read_only_function(bang, "get-balance", [wallet]),
  );

  if (isTrueOk(exempt) || unwrap(exempt) === true) {
    return { threshold: 0n, decimals, balance };
  }
  const thresholdRaw = toBigInt(
    await call_read_only_function(gateContract, "get-bang-threshold", []),
  );
  if (thresholdRaw === 0n) {
    return { threshold: 0n, decimals, balance };
  }
  const required = thresholdRaw * 10n ** BigInt(decimals);
  if (balance < required) {
    throw new Error(
      `Market creation requires ≥${thresholdRaw} BANG (have ${formatToken(balance, decimals)}). ` +
        "Buy or claim your airdrop at https://bigmarket.ai/bang",
    );
  }
  return { threshold: required, decimals, balance };
}

// ---------- Actions ----------

interface ApiMarketResponse {
  marketId: number;
  unhashedData?: {
    name?: string;
    outcomes?: string[];
    forumMessageId?: string;
  };
  marketData?: {
    categories?: string[];
    stakes?: number[];
    resolutionState?: number;
    concluded?: boolean;
  };
}

function mapApiMarket(raw: ApiMarketResponse): MarketSummary {
  const id = raw.marketId;
  const title = raw.unhashedData?.name ?? `Market ${id}`;
  const categories =
    raw.marketData?.categories?.filter(Boolean) ??
    raw.unhashedData?.outcomes?.filter(Boolean) ??
    [];
  const stakes = raw.marketData?.stakes ?? [];
  const pools: Record<string, string> = {};
  const impliedProbability: Record<string, number> = {};
  let total = 0;
  for (let i = 0; i < categories.length; i++) {
    const s = stakes[i] ?? 0;
    total += s;
    pools[categories[i]] = String(s);
  }
  for (let i = 0; i < categories.length; i++) {
    impliedProbability[categories[i]] =
      total > 0 ? (stakes[i] ?? 0) / total : 0;
  }
  const md = raw.marketData;
  const status = md?.concluded
    ? "RESOLVED"
    : md?.resolutionState === 0
      ? "OPEN"
      : md?.resolutionState !== undefined
        ? "CLOSED"
        : "UNKNOWN";
  return { id, title, status, categories, pools, impliedProbability };
}

async function listMarkets(): Promise<void> {
  const net = getNetwork();
  const base = API_BASES[net];
  const out: MarketSummary[] = [];
  for (let id = 1; id < 10_000; id++) {
    const raw = await getJson<ApiMarketResponse>(
      `${base}/pm/markets/${id}/categorical`,
    );
    if (!raw?.marketId) break;
    out.push(mapApiMarket(raw));
  }
  if (!out.length) {
    console.log("No markets found.");
    return;
  }
  for (const m of out) {
    console.log(`#${m.id}  [${m.status}]  ${m.title}`);
    for (const cat of m.categories) {
      const pool = m.pools?.[cat] ?? "0";
      const p = m.impliedProbability?.[cat];
      console.log(
        `    ${cat.padEnd(16)} pool=${pool}  p=${p !== undefined ? (p * 100).toFixed(2) + "%" : "—"}`,
      );
    }
  }
}

async function readMarket(args: ParsedArgs): Promise<void> {
  const net = getNetwork();
  const id = Number(args.positional[0]);
  if (!Number.isFinite(id)) throw new Error("Usage: read-market <market-id>");
  const wallets = await wallet_list().catch(() => [] as string[]);
  const data = await call_read_only_function(bme024(net), "get-market-data", [
    id,
  ]);
  const accounting = await call_read_only_function(
    bme024(net),
    "get-market-accounting",
    [id],
  );
  let stakes: unknown = null;
  if (wallets[0]) {
    stakes = await call_read_only_function(bme024(net), "get-stake-balances", [
      id,
      wallets[0],
    ]);
  }
  console.log(
    JSON.stringify(
      {
        id,
        data: unwrap(data),
        accounting: unwrap(accounting),
        stakes: unwrap(stakes),
      },
      bigintReplacer,
      2,
    ),
  );
}

function bigintReplacer(_k: string, v: unknown): unknown {
  return typeof v === "bigint" ? v.toString() : v;
}

async function predict(args: ParsedArgs): Promise<void> {
  const net = getNetwork();
  const [marketIdStr, category, amountStr] = args.positional;
  const marketId = Number(marketIdStr);
  const amount = BigInt(amountStr);
  if (!Number.isFinite(marketId) || !category || !amountStr) {
    throw new Error(
      "Usage: predict <market-id> <category> <amount-ustx> [--token bang]",
    );
  }
  const wallet = await activeWallet();
  const token = await resolveToken(
    net,
    marketId,
    args.flags.token as string | undefined,
  );

  // Estimate shares for this spend — approximate via inverse get-share-cost iteration
  // is non-trivial; agent runtime exposes amount as max-cost and shares estimate.
  // We treat input amount as ustx-of-cost; estimate shares = amount (1:1 conservative).
  const estShares = amount;
  const minShares = applySlippage(estShares);
  const cost = toBigInt(
    await call_read_only_function(bme024(net), "get-share-cost", [
      marketId,
      indexOfCategory(category),
      estShares,
    ]),
  );
  const maxCost = (cost * 10500n) / 10000n; // +5% headroom

  console.log("Preview — predict-category");
  console.log(`  market:     ${marketId}`);
  console.log(`  category:   ${category}`);
  console.log(`  token:      ${token}`);
  console.log(`  est shares: ${estShares}`);
  console.log(`  min shares: ${minShares}`);
  console.log(`  max cost:   ${maxCost}`);
  requireConfirm(args.flags);

  const { txid } = await wrapClarityCall(() =>
    call_contract(bme024(net), "predict-category", [
      marketId,
      minShares,
      category,
      token,
      maxCost,
    ]),
  );
  console.log(`txid: ${txid}`);
  recordHistory({
    ts: new Date().toISOString(),
    action: "predict",
    network: net,
    wallet,
    txid,
    params: {
      marketId,
      category,
      amount: amount.toString(),
      token,
      minShares: minShares.toString(),
      maxCost: maxCost.toString(),
    },
  });
}

function indexOfCategory(_cat: string): number {
  // Index resolution happens contract-side via category string lookup.
  // get-share-cost takes (index uint); callers using string categories should
  // resolve via off-chain API. For now we accept that get-share-cost expects
  // a numeric index — the agent must pass numeric category index when invoking
  // get-share-cost directly. Defaulting to 0 for the estimation preview.
  return 0;
}

async function sell(args: ParsedArgs): Promise<void> {
  const net = getNetwork();
  const [marketIdStr, category, sharesStr] = args.positional;
  const marketId = Number(marketIdStr);
  const shares = BigInt(sharesStr);
  if (!Number.isFinite(marketId) || !category || !sharesStr) {
    throw new Error(
      "Usage: sell <market-id> <category> <shares> [--token bang]",
    );
  }
  const wallet = await activeWallet();
  const token = await resolveToken(
    net,
    marketId,
    args.flags.token as string | undefined,
  );

  const balances = await call_read_only_function(
    bme024(net),
    "get-token-balances",
    [marketId, wallet],
  );
  if (!balances) throw new Error("No position found in this market.");

  const grossRefund = toBigInt(
    await call_read_only_function(bme024(net), "get-share-cost", [
      marketId,
      0,
      shares,
    ]),
  );
  const minRefund = applySlippage(grossRefund);

  console.log("Preview — sell-category");
  console.log(`  market:     ${marketId}`);
  console.log(`  category:   ${category}`);
  console.log(`  shares:     ${shares}`);
  console.log(`  min refund: ${minRefund}`);
  requireConfirm(args.flags);

  const { txid } = await wrapClarityCall(() =>
    call_contract(bme024(net), "sell-category", [
      marketId,
      minRefund,
      category,
      token,
      shares,
    ]),
  );
  console.log(`txid: ${txid}`);
  recordHistory({
    ts: new Date().toISOString(),
    action: "sell",
    network: net,
    wallet,
    txid,
    params: {
      marketId,
      category,
      shares: shares.toString(),
      token,
      minRefund: minRefund.toString(),
    },
  });
}

async function addLiquidity(args: ParsedArgs): Promise<void> {
  const net = getNetwork();
  const [marketIdStr, amountStr] = args.positional;
  const marketId = Number(marketIdStr);
  const amount = BigInt(amountStr);
  if (!Number.isFinite(marketId) || !amountStr) {
    throw new Error(
      "Usage: add-liquidity <market-id> <amount-ustx> [--token bang]",
    );
  }
  const wallet = await activeWallet();
  const token = await resolveToken(
    net,
    marketId,
    args.flags.token as string | undefined,
  );

  const accounting = (await call_read_only_function(
    bme024(net),
    "get-market-accounting",
    [marketId],
  )) as Record<string, unknown>;
  const expectedTotal = toBigInt(
    (unwrap(accounting) as Record<string, unknown>)?.["total-stakes"] ?? 0n,
  );

  console.log("Preview — add-liquidity");
  console.log("  ⚠ Proportional deposit across all pools.");
  console.log(`  market:               ${marketId}`);
  console.log(`  amount:               ${amount}`);
  console.log(`  expected total stake: ${expectedTotal}`);
  console.log("  max deviation bips:   500 (5%)");
  requireConfirm(args.flags);

  const { txid } = await wrapClarityCall(() =>
    call_contract(bme024(net), "add-liquidity", [
      marketId,
      amount,
      expectedTotal,
      500,
      token,
    ]),
  );
  console.log(`txid: ${txid}`);
  recordHistory({
    ts: new Date().toISOString(),
    action: "add-liquidity",
    network: net,
    wallet,
    txid,
    params: {
      marketId,
      amount: amount.toString(),
      token,
      expectedTotal: expectedTotal.toString(),
    },
  });
}

async function removeLiquidity(args: ParsedArgs): Promise<void> {
  const net = getNetwork();
  const [marketIdStr, sharesStr] = args.positional;
  const marketId = Number(marketIdStr);
  const shares = BigInt(sharesStr);
  if (!Number.isFinite(marketId) || !sharesStr) {
    throw new Error(
      "Usage: remove-liquidity <market-id> <lp-shares> [--token bang]",
    );
  }
  const wallet = await activeWallet();
  const token = await resolveToken(
    net,
    marketId,
    args.flags.token as string | undefined,
  );

  const accounting = await call_read_only_function(
    bme024(net),
    "get-market-accounting",
    [marketId],
  );
  console.log("Preview — remove-liquidity");
  console.log(`  market:    ${marketId}`);
  console.log(`  lp shares: ${shares}`);
  console.log(
    `  pool:      ${JSON.stringify(unwrap(accounting), bigintReplacer)}`,
  );
  const minRefund = applySlippage(shares);
  console.log(`  min refund: ${minRefund}`);
  requireConfirm(args.flags);

  const { txid } = await wrapClarityCall(() =>
    call_contract(bme024(net), "remove-liquidity", [
      marketId,
      shares,
      minRefund,
      token,
    ]),
  );
  console.log(`txid: ${txid}`);
  recordHistory({
    ts: new Date().toISOString(),
    action: "remove-liquidity",
    network: net,
    wallet,
    txid,
    params: {
      marketId,
      shares: shares.toString(),
      token,
      minRefund: minRefund.toString(),
    },
  });
}

async function claimRewards(args: ParsedArgs): Promise<void> {
  const net = getNetwork();
  const wallet = await activeWallet();
  const before = toBigInt(
    await call_read_only_function(bme030(net), "get-balance", [1, wallet]),
  );
  const epoch = toBigInt(
    await call_read_only_function(bme030(net), "get-epoch", []),
  );
  console.log(`Epoch:           ${epoch}`);
  console.log(`BIGR tier-1 pre: ${before}`);
  requireConfirm(args.flags);

  const { txid } = await wrapClarityCall(() =>
    call_contract(bme030(net), "claim-big-reward", []),
  );
  console.log(`txid: ${txid}`);
  const after = toBigInt(
    await call_read_only_function(bme030(net), "get-balance", [1, wallet]),
  );
  console.log(`BIGR tier-1 post: ${after}`);
  recordHistory({
    ts: new Date().toISOString(),
    action: "claim-rewards",
    network: net,
    wallet,
    txid,
    params: {
      before: before.toString(),
      after: after.toString(),
      epoch: epoch.toString(),
    },
  });
}

async function status(): Promise<void> {
  const net = getNetwork();
  const wallet = await activeWallet();

  const tiers: Record<number, string> = {};
  let currentTier = 0;
  for (const t of BIGR_TIERS) {
    const b = toBigInt(
      await call_read_only_function(bme030(net), "get-balance", [t, wallet]),
    );
    tiers[t] = b.toString();
    if (b > 0n) currentTier = Math.max(currentTier, t);
  }
  const epoch = toBigInt(
    await call_read_only_function(bme030(net), "get-epoch", []),
  );
  const epochDuration = toBigInt(
    await call_read_only_function(bme030(net), "get-epoch-duration", []),
  );

  console.log(`network:   ${net}`);
  console.log(`wallet:    ${wallet}`);
  console.log(`epoch:     ${epoch}  (duration ${epochDuration} blocks)`);
  console.log("BIGR balances by tier:");
  for (const t of BIGR_TIERS) console.log(`  tier ${t}: ${tiers[t]}`);
  console.log(`current tier:        ${currentTier || "—"}`);

  if (!bangFeaturesEnabled()) {
    console.log(
      "BANG / create-market:  disabled (set BIGMARKET_BANG_ENABLED=true when token is live)",
    );
    return;
  }

  const bang = bangContract();
  const decimals = Number(
    toBigInt(await call_read_only_function(bang, "get-decimals", [])),
  );
  const bangBal = toBigInt(
    await call_read_only_function(bang, "get-balance", [wallet]),
  );
  const threshold = 100n * 10n ** BigInt(decimals);
  const eligible = bangBal >= threshold;
  console.log(`BANG:      ${formatToken(bangBal, decimals)} (${bangBal})`);
  console.log(
    `create-market gate:  ${eligible ? "ELIGIBLE (≥100 BANG)" : "INELIGIBLE (<100 BANG)"}`,
  );
}

async function createMarket(args: ParsedArgs): Promise<void> {
  requireBangFeatures("create-market");
  const net = getNetwork();
  const pos = args.positional;
  if (pos.length < 4) {
    throw new Error(
      'Usage: create-market "<title>" <cat1> <cat2> [catN…] <seed-ustx>',
    );
  }
  const title = pos[0];
  const seedStr = pos[pos.length - 1];
  const categories = pos.slice(1, -1);
  const seed = BigInt(seedStr);

  if (categories.length < 2 || categories.length > 8) {
    throw new Error(`category count must be 2..8 (got ${categories.length})`);
  }
  if (title.length > 256) throw new Error("title must be ≤256 chars");
  if (seed < 1_000_000n) throw new Error("seed must be ≥1,000,000 µSTX");
  for (const c of categories) {
    if (c.length > 64) throw new Error(`category "${c}" exceeds 64 chars`);
  }

  const gate = bangGateContract(
    args.flags["bang-gate-contract"] as string | undefined,
  );
  const wallet = await activeWallet();
  const { decimals, balance } = await assertBangGateEligible(wallet, gate);

  const feeBips = Number(args.flags["fee-bips"] ?? 200);
  const duration = Number(args.flags["duration-blocks"] ?? 4320);
  const cooldown = Number(args.flags["cooldown-blocks"] ?? 144);
  const mechanism = 0;

  const meta = {
    title,
    categories,
    createdBy: wallet,
    timestamp: new Date().toISOString(),
  };
  const hash = createHash("sha256").update(JSON.stringify(meta)).digest();

  console.log("Preview — create-market (via BANG gate)");
  console.log(`  gate contract:   ${gate}`);
  console.log(
    `  BANG balance:    ${formatToken(balance, decimals)}  (100 will be burned)`,
  );
  console.log(
    `  after creation:  ${formatToken(balance - 100n * 10n ** BigInt(decimals), decimals)}`,
  );
  console.log(`  title:           ${title}`);
  console.log(`  categories:      ${categories.join(", ")}`);
  console.log(`  fee-bips:        ${feeBips}`);
  console.log(`  duration:        ${duration} blocks`);
  console.log(`  cooldown:        ${cooldown} blocks`);
  console.log(`  seed:            ${seed} µSTX`);
  console.log(`  market-mechanism: ${mechanism} (CPMM)`);
  console.log(`  treasury:        ${treasury(net)}`);
  console.log(`  market-data-hash: 0x${hash.toString("hex")}`);
  requireConfirm(args.flags);

  // Token for seed payment defaults to STX principal sentinel; callers can pass --token.
  const token = await resolveToken(
    net,
    0,
    args.flags.token as string | undefined,
  );

  const { txid, result } = await wrapClarityCall(() =>
    call_contract(gate, "create-market", [
      categories,
      feeBips,
      token,
      hash,
      [], // empty proof — BANG holders bypass merkle gating
      treasury(net),
      duration,
      cooldown,
      seed,
      null, // hedge-executor: none
      mechanism,
    ]),
  );
  const marketId =
    result !== undefined ? toBigInt(result).toString() : "unknown";
  console.log(`txid:      ${txid}`);
  console.log(`market-id: ${marketId}`);

  recordHistory({
    ts: new Date().toISOString(),
    action: "create-market",
    network: net,
    wallet,
    txid,
    params: {
      gate,
      title,
      categories,
      feeBips,
      duration,
      cooldown,
      seed: seed.toString(),
      mechanism,
      marketDataHash: hash.toString("hex"),
      bangBurned: "100",
      marketId,
    },
  });
}

async function claimAirdrop(args: ParsedArgs): Promise<void> {
  requireBangFeatures("claim-airdrop");
  const net = getNetwork();
  const claim = bangClaimContract(
    args.flags["bang-claim-contract"] as string | undefined,
  );
  const wallets = await wallet_list();
  if (!wallets.length) throw new Error("No connected wallets.");
  const wallet = wallets[0];

  const elig = (await call_read_only_function(claim, "get-eligibility", [
    wallet,
  ])) as Record<string, unknown>;
  const e = unwrap(elig) as Record<string, unknown> | null;
  if (!e) {
    console.log("Not eligible.");
    return;
  }
  if (e.claimed === true || (e as { claimed?: unknown }).claimed === 1) {
    console.log(
      `Already claimed: ${e.amount ?? "?"} BANG at ${e["claim-date"] ?? e.claimDate ?? "?"}`,
    );
    return;
  }
  const tier = String(e.tier ?? "Attestation");
  console.log(`tier:         ${tier}`);
  console.log(`allocation:   ${e.amount ?? "?"} BANG`);
  console.log(`ends in:      ${e["blocks-remaining"] ?? "?"} blocks`);
  if (!args.flags.confirm && !autoConfirm()) {
    console.log("(re-run with --confirm to broadcast)");
    return;
  }
  await wallet_unlock(wallet);
  const { txid } = await wrapClarityCall(() =>
    call_contract(claim, "claim-airdrop", [tier]),
  );
  console.log(`txid: ${txid}`);
  recordHistory({
    ts: new Date().toISOString(),
    action: "claim-airdrop",
    network: net,
    wallet,
    txid,
    params: { tier, amount: String(e.amount ?? "") },
  });
}

// ---------- Forum comment ----------

/**
 * Post a comment on a market's forum thread.
 *
 * Usage:
 *   comment <market-id> <content> [--title "..."] [--reply-to <message-id>] [--confirm]
 *
 * - Signs the payload with SIP-018 via the aibtc sip018_sign MCP tool.
 * - POSTs to the BigMarket Forum API — no on-chain tx, no gas.
 * - The signed tuple uses string-ascii type hints (not utf8) to match
 *   forumMessageToTupleCV in the BigMarket SDK.
 */
// Thread node shape returned by GET /forum/messages/{id}
interface ForumThreadNode {
  forumContent: {
    messageId: string;
    level: number;
    replies?: ForumThreadNode[];
  };
}

/** Recursively search the thread tree for a message by id; returns its level. */
function findMessageLevel(
  node: ForumThreadNode,
  targetId: string,
): number | undefined {
  if (node.forumContent.messageId === targetId) return node.forumContent.level;
  for (const reply of node.forumContent.replies ?? []) {
    const found = findMessageLevel(reply, targetId);
    if (found !== undefined) return found;
  }
  return undefined;
}

async function comment(args: ParsedArgs): Promise<void> {
  const net = getNetwork();
  const [marketIdStr, ...contentParts] = args.positional;
  const marketId = Number(marketIdStr);
  const content =
    (args.flags.content as string | undefined) ?? contentParts.join(" ");
  // Title defaults to '' — matches browser behaviour where replies at level ≥2
  // send an empty title so MessageCard doesn't render a duplicate heading.
  // Pass --title "..." only when you explicitly want a visible title.
  const titleFlag = args.flags.title as string | undefined;
  const title = titleFlag ?? "";

  if (!Number.isFinite(marketId) || !content.trim()) {
    throw new Error(
      'Usage: comment <market-id> <content> [--title "..."] [--reply-to <message-id>] [--confirm]',
    );
  }

  // Validate printable ASCII — Clarity string-ascii rejects non-ASCII bytes.
  if (title && !/^[\x20-\x7E]*$/.test(title))
    throw new Error("--title must contain only printable ASCII characters.");
  if (!/^[\x20-\x7E]*$/.test(content))
    throw new Error("content must contain only printable ASCII characters.");
  if (title.length > 100) throw new Error("--title must be ≤100 chars.");
  if (content.length > 500) throw new Error("content must be ≤500 chars.");

  // Resolve forum thread from market API.
  const raw = await getJson<ApiMarketResponse>(
    `${API_BASES[net]}/pm/markets/${marketId}/categorical`,
  );
  if (!raw?.marketId) throw new Error(`Market ${marketId} not found.`);

  const forumMessageId = raw.unhashedData?.forumMessageId;
  if (!forumMessageId) {
    throw new Error(
      `Market ${marketId} has no forum thread (forumMessageId missing). ` +
        "The thread is created at market creation — this market may pre-date the forum.",
    );
  }

  // --reply-to targets a nested message; default = root thread.
  const replyTo = args.flags["reply-to"] as string | undefined;
  const parentId = replyTo ?? forumMessageId;

  // Load thread: verify it exists AND use the tree to resolve parent level.
  const thread = await getJson<ForumThreadNode>(
    `${forumApi(net)}/forum/messages/${forumMessageId}`,
  );
  if (!thread) {
    throw new Error(
      `Forum thread ${forumMessageId} not found on ${net} forum API.`,
    );
  }

  // Resolve level: root thread is level 1; direct replies are 2; nested replies are 3+.
  // If replying to root thread, level is always 2.
  // If replying to a reply, find it in the tree and add 1.
  let level: number;
  if (!replyTo || replyTo === forumMessageId) {
    level = 2;
  } else {
    const parentLevel = findMessageLevel(thread, replyTo);
    if (parentLevel === undefined) {
      // Parent not found in tree (may be a very deep or unpaginated reply).
      // Safe fallback: root level + 2 = 3; avoid mismatching by being conservative.
      console.warn(
        `  ⚠ parent message ${replyTo} not found in thread tree — defaulting level to 3.`,
      );
      level = 3;
    } else {
      level = parentLevel + 1;
    }
  }

  const wallet = await activeWallet();
  const messageId = randomUUID();
  const created = Date.now();

  // --- Build ForumMessage (shape matches sip18-forum-types ForumMessage) ---
  const forumContent = {
    messageBoardId: MESSAGE_BOARD_ID,
    parentId,
    messageId,
    linkedAccounts: [
      {
        source: "stacks",
        identifier: wallet,
        verified: true,
        preferred: true,
      },
    ],
    title,
    content,
    created,
    deleted: false,
    level,
  };

  // --- SIP-018 structured message — must match forumMessageToTupleCV exactly ---
  // Fields: identifier (ascii), created (uint), title (ascii), content (ascii).
  // Using explicit { type: 'ascii' } hints — default implicit type is utf8 which
  // produces a different hash and will fail server-side verification.
  const messageToSign: Record<string, unknown> = {
    identifier: { type: "ascii", value: wallet },
    created: { type: "uint", value: created },
    title: { type: "ascii", value: title },
    content: { type: "ascii", value: content },
  };
  const domain = { name: "BigMarket", version: "1.0.0" };

  console.log("Preview — comment");
  console.log(`  market:     ${marketId}`);
  console.log(`  thread:     ${forumMessageId}`);
  console.log(`  parent:     ${parentId}`);
  console.log(`  level:      ${level}`);
  console.log(`  wallet:     ${wallet}`);
  if (title) console.log(`  title:      ${title}`);
  console.log(`  content:    ${content}`);
  console.log(`  message-id: ${messageId}`);
  console.log(`  forum:      ${forumApi(net)}`);
  requireConfirm(args.flags);

  // Sign — sip018_sign returns signature in RSV format (65 bytes hex).
  const signResult = await sip018_sign({ message: messageToSign, domain });
  const { signature } = signResult;

  // Resolve publicKey: returned directly by sip018_sign, or recover via sip018_hash + sip018_verify.
  let publicKey = signResult.publicKey;
  if (!publicKey) {
    const { verification } = await sip018_hash({
      message: messageToSign,
      domain,
    });
    const recovered = await sip018_verify({
      messageHash: verification,
      signature,
    });
    publicKey = recovered.publicKey;
  }

  // POST to forum API.
  const res = await fetch(`${forumApi(net)}/forum/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ forumContent, auth: { signature, publicKey } }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Forum API ${res.status}: ${body || res.statusText}`);
  }

  console.log(`✓ comment posted`);
  console.log(`  message-id: ${messageId}`);
  console.log(`  level:      ${level}`);
  console.log(
    `  thread:     ${forumApi(net)}/forum/messages/${forumMessageId}`,
  );

  // Record in history — messageId stands in for txid (no on-chain tx).
  recordHistory({
    ts: new Date().toISOString(),
    action: "comment",
    network: net,
    wallet,
    txid: messageId,
    params: {
      marketId,
      forumMessageId,
      parentId,
      level,
      title,
      content,
      messageId,
    },
  });
}

// ---------- Clarity error wrapping ----------

async function wrapClarityCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const m = msg.match(/u\d{4}/);
    if (m && CLARITY_ERRORS[m[0]]) {
      throw new Error(`${m[0]}: ${CLARITY_ERRORS[m[0]]} (${msg})`);
    }
    throw err;
  }
}

// ---------- Dispatch ----------

const ACTIONS: Record<string, (a: ParsedArgs) => Promise<void>> = {
  "list-markets": async () => listMarkets(),
  "read-market": readMarket,
  predict,
  sell,
  "add-liquidity": addLiquidity,
  "remove-liquidity": removeLiquidity,
  "claim-rewards": claimRewards,
  "create-market": createMarket,
  "claim-airdrop": claimAirdrop,
  comment,
  status: async () => status(),
};

export {
  listMarkets,
  readMarket,
  predict,
  sell,
  addLiquidity,
  removeLiquidity,
  claimRewards,
  createMarket,
  claimAirdrop,
  comment,
  status,
};

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log("bigmarket <action> [args]");
    console.log("Actions: " + Object.keys(ACTIONS).join(", "));
    return;
  }
  const handler = ACTIONS[cmd];
  if (!handler) {
    console.error(`Unknown action: ${cmd}`);
    console.error("Known: " + Object.keys(ACTIONS).join(", "));
    process.exit(2);
  }
  await handler(parseArgs(rest));
}

// Read package.json sentinel to detect ESM/CJS — for skill runtime both work.
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
} else if (process.argv[1] && /bigmarket\.(ts|js|mjs)$/.test(process.argv[1])) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}

// Silence unused-import warnings if any helper goes unused in tree-shaken builds.
void readFileSync;
