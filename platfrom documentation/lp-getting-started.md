# Getting Started as an LP

How to add liquidity, what you receive, how fees accumulate, and how to exit.

---

## Before you start

**Am I ready to be an LP?**

Before adding liquidity to any market, make sure you're comfortable with two things:

1. You could lose more than your fee income if the market resolves heavily in one direction. Fee income offsets losses — it doesn't guarantee a profit.
2. Your deposit gets split across all outcomes. You're not backing a winner, you're backing the market itself.

If you've read the [LP Overview]() and those two points make sense, you're ready.

You'll need the same setup as any trader — a connected wallet and the token the market runs on. There's nothing extra required to become an LP.

---

## Choosing the right market

**Not every market is worth providing liquidity for.**

The fee income you earn depends entirely on how much trading happens in the market you choose. A market that generates no trades earns you nothing — while still leaving your deposit exposed to the outcome.

Look for markets with:

- **A long runway** — the more time the market is open, the more trades it can accumulate. A market closing in 12 hours has limited upside for fee income.
- **Genuine uncertainty** — if the outcome is already obvious to most people, trading will be thin. Markets where the crowd is genuinely split attract the most volume.
- **A topic people care about** — sports finals, major price events, high-profile decisions. The more people following the event, the more people are likely to trade it.
- **AMM mechanism** — Knockout markets don't support liquidity provision at all. Only AMM markets generate LP fees.

---

## Adding liquidity

**How does depositing work?**

Go to the market page and click "Add Liquidity." Enter the amount you want to deposit and set your slippage tolerance — a safeguard that cancels the transaction if the pool has shifted too much by the time it confirms.

When you submit:

- Your deposit is split proportionally across all outcomes — if the market currently has 60% on Yes and 40% on No, your deposit goes in at that same ratio.
- You receive two things: outcome shares in every category (the same as any trader who staked that amount), and LP shares that represent your slice of the fee pool.
- The market gets deeper. Deeper markets mean less price movement per trade, which means better conditions for traders — and more trading activity for you.

**What are LP shares?**

LP shares are your claim on the accumulated fees in that market. They're separate from your outcome shares. As traders buy and sell, 30% of every 1% protocol fee flows into the LP fee pool. Your LP shares determine what fraction of that pool belongs to you when you exit.

**Is there a minimum deposit?**

There's no platform-set minimum for LPs. In practice, very small deposits earn proportionally small fees. Decide based on how much exposure to the outcome you're comfortable with.

---

## While the market is running

**What do I need to do after depositing?**

Nothing. Your fee entitlement grows automatically with every trade in the market. You don't need to monitor it or take any action while the market is open.

You can check your position in the dashboard at any time to see your current LP share, the fees accumulated so far, and what your outcome shares are worth at current prices.

**Can I add more liquidity after my initial deposit?**

Yes. You can add liquidity at any point while the market is in the Open state. Each new deposit calculates your LP share based on the pool size at the moment you add.

---

## Removing liquidity

**When can I exit?**

Any time before the cooling period begins. Once a market enters cooling, trading has closed and you can no longer adjust your position — you hold until resolution.

**What do I get back?**

Two things come back to your wallet in a single transaction:

1. Your proportional share of all outcome pools — the same ratio you deposited at, adjusted for how the pools have moved since then.
2. Your accumulated fee income — calculated as your LP share percentage multiplied by the total fees the pool has collected.

**A worked example:**

A market runs for four weeks and generates 10,000 STX in total trading volume. The 1% protocol fee produces 100 STX in fees. Of that, 30 STX goes to the LP pool.

You provided 500 STX of the 2,000 STX total liquidity — that's 25% of all LP shares.

Your fee earnings: 25% × 30 STX = **7.50 STX**

On top of that, you get back your proportional slice of the outcome pools — whatever those are worth at the moment you exit.

**Does removing liquidity cost anything?**

The same 1% protocol fee applies to liquidity withdrawals as to trades. It's shown before you confirm.

---

## After resolution

**What happens to my outcome shares at resolution?**

They resolve exactly like any trader's shares. Shares on the winning outcome entitle you to a proportional cut of the total pool. Shares on the losing outcome expire worthless.

This is the core risk of being an LP: if the market resolves heavily in one direction and you held a lot of shares on the losing side, your fee income may not cover the loss. That's the tradeoff for earning fees without needing to pick a winner.

**Can I claim after resolution?**

Yes. Any winning outcome shares you hold from your LP deposit are claimable exactly like a trader's position. Go to the market page, click "Claim," and approve the transaction.

---

## LP rewards summary

Beyond fee income, providing liquidity also earns BIG-R reputation points — scaled to the amount you contribute. Those reputation points convert to BIG tokens at the end of each monthly epoch, alongside the reputation you earn from trading and governance.

There's no separate action required to earn reputation as an LP. It accumulates automatically when you add liquidity and converts automatically at epoch end.

| What you earn | How |
|---------------|-----|
| Fee income | 30% of every 1% protocol fee, proportional to your LP share |
| Outcome share value | Your proportional slice of the winning pool at resolution |
| BIG-R reputation | Scaled to the amount of liquidity you provide |
| BIG tokens | From reputation at the end of each monthly epoch |
