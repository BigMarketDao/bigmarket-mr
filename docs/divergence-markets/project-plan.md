# BigMarket: Cross-Platform Divergence Markets — Project Plan

## 1. Concept

BigMarket lets users create and trade markets on _whether other prediction
markets are mispriced relative to each other_ — e.g. "Will Polymarket's price
on Fed Cut converge toward Kalshi's by resolution?" This is a meta-layer
product on top of existing prediction markets, not a competing book.

Two outputs, built in sequence:

1. **Spread Dashboard** — public, free, content/audience layer. Shows live
   divergence between Kalshi, Polymarket (and others later) on matched
   events. No BigMarket position required to view.
2. **Divergence Markets** — actual tradeable BigMarket markets, using our
   existing categorical market types + LLM market-generation tooling, with
   manually authored resolution/spread patterns (see Section 5).

## 2. High-Level Components Needed

### a) Data ingestion

- Pull market metadata + live prices from Kalshi (public API) and
  Polymarket (public API / subgraph).
- Normalize into a common schema: event description, resolution date,
  current implied probability, volume/liquidity, source timestamp.
- Snapshot on a fixed schedule (e.g. every 15 min) plus on-demand
  refresh — store time series, not just latest value, so we can defend
  "price at time X" disputes later.

### b) Matching engine (the proprietary node.js piece)

- Service that ingests both metadata streams and identifies candidate
  pairs of equivalent markets across platforms.
- Approach: LLM-driven semantic matching — feed both streams' event
  titles/descriptions/resolution criteria to an agent, ask it to propose
  matches with a confidence score and a plain-English note on whether
  resolution criteria genuinely align (not just similar wording).
- Output: a queue of candidate matches for human review before anything
  becomes a public dashboard entry or a market — false matches are the
  single biggest reputational risk here.

### c) Spread Dashboard (public)

- Simple read-only site/page: table of matched events, current spread,
  trend over time, link to source markets.
- This is the audience-growth surface — built for shareability
  (screenshots, "biggest spread today" callouts).

### d) Market generation

- We already have LLM market-generation tooling — this just needs good
  prompts that take a matched pair + spread data and draft a candidate
  BigMarket market (title, resolution criteria, category).
- We already have categorical market types that support manually
  introduced spread/resolution patterns — use these as the template for
  divergence markets rather than building a new market type from scratch.

### e) Resolution design (manual, high-care)

- Needs a precise, disputable-proof rule per market template (see
  separate resolution-design doc). This is a design problem first,
  not an engineering one.

## 3. Build Sequence (rough)

1. Data ingestion for Kalshi + Polymarket (read-only, no matching yet).
2. Manual matching of a small curated set (5–10 high-profile events:
   Fed decisions, elections, major crypto price thresholds) to validate
   the whole pipeline end-to-end before automating matching.
3. Spread dashboard MVP on the curated set — ship this early, it's pure
   upside for visibility and doesn't require resolution-rule design.
4. LLM matching engine — automate discovery of new candidate pairs,
   human-reviewed before publishing.
5. First divergence markets on BigMarket, using the categorical market
   type + existing market-generation tooling, seeded from curated pairs.
6. Iterate resolution templates based on first few real resolutions.

## 4. Open Questions

- Snapshot methodology: instantaneous quote vs VWAP over a window —
  needs deciding before any market resolves, not after.
- Should BigMarket's own markets ever be eligible as one side of a
  divergence comparison (reflexivity/manipulation risk)?
- Which platforms beyond Kalshi/Polymarket are worth ingesting (data
  quality, API stability, ToS)?
- DAO governance touchpoint: does the matching engine's output need a
  governance review step before a market type goes live, or just
  ops-level human review?

## 5. Related Docs

- `resolution-design.md` — worked example of a disputable-proof
  resolution rule for a single market (Fed Cut).
- `data-sources.md` — API/ToS notes per platform ingested.
