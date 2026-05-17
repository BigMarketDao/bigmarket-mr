# Liquidity Providers — Overview

What liquidity providers do, why it matters, and what you take on by doing it.

---

## What is a liquidity provider?

**What does "providing liquidity" actually mean?**

Every market on BigMarket needs money on both sides before trading can begin. Without it, the first person to buy an outcome would move the price so dramatically that the market would be unusable. Liquidity providers solve this by depositing tokens into a market at the start — giving the pool enough depth that trades can happen at reasonable prices.

Think of it like a shared pot that makes the game possible. The people who fill the pot don't necessarily have a view on the outcome. They're there to earn a cut of every trade that happens — in exchange for taking on a different kind of risk.

**Is this different from trading?**

Yes, meaningfully so. A trader backs one outcome and profits if it wins. A liquidity provider deposits across all outcomes simultaneously — they don't take a side. Their income comes from fees on every transaction in the market, not from predicting the result correctly.

The tradeoff: LPs earn regardless of who wins, but they're also exposed to the outcome in a way that can work against them. More on that below.

**Do I need to be an LP to use BigMarket?**

No. Liquidity provision is optional. Most users on BigMarket are traders. LP is a more involved role with a different risk and reward profile — it suits people who want passive income from platform activity rather than from picking winners.

---

## How does an LP earn money?

**Where does the income come from?**

Every trade in an AMM market generates a 1% protocol fee. Of that fee, 30% goes to the liquidity providers in that market — split proportionally based on each LP's share of the total liquidity pool. The remaining 70% goes to the platform treasury.

This means: the more trading activity a market generates, the more an LP earns. A quiet market with little volume produces little fee income. A heavily traded market with thousands of transactions produces meaningful returns.

**Is the income guaranteed?**

No. Fee income depends entirely on trading volume. If you provide liquidity to a market that nobody trades in, you earn almost nothing. Choosing the right markets — ones likely to attract active trading — is the main skill involved in LP participation.

**Can I provide liquidity to any market?**

Only AMM markets support liquidity provision. Knockout markets don't — they have no continuous pricing mechanism, so there's nothing for an LP to support. When you browse markets, the mechanism type is always shown upfront.

---

## What's the risk?

**If I'm earning fees either way, what's the downside?**

When you add liquidity, your deposit is split proportionally across all outcomes in the market — not just one. That means you hold shares in both Yes and No, or across every category in a multi-outcome market. You're not taking a side, but you are holding positions.

When the market resolves, the shares on the losing side expire worthless — just like any trader's losing position. Your fee income offsets some of that loss, but it doesn't eliminate it. If the market resolves overwhelmingly in one direction and the fee income wasn't substantial enough to compensate, you end up worse off than if you'd just held your tokens.

**So when does being an LP make sense?**

When the fee income is likely to be worth the outcome exposure risk. That means markets with:

- High expected trading volume over the market's lifetime
- A duration long enough to accumulate meaningful fees
- A balanced distribution of opinion — if everyone already agrees on the outcome, there won't be much trading and the fee income will be thin

Markets where the result is already obvious attract few traders and generate few fees. Markets where there's genuine uncertainty attract active trading on both sides — and that's where LP income adds up.

**Can I exit before the market resolves?**

Yes. You can remove your liquidity at any point before the cooling period begins. You get back your proportional share of all outcome pools plus any fees you've accumulated up to that point. Exiting early is always an option if the market isn't performing how you expected.

---

## LP versus trading — at a glance

| | Trading | Liquidity provision |
|--|---------|-------------------|
| How you earn | Back the winning outcome | Fees on every trade, regardless of outcome |
| What you're exposed to | One outcome | All outcomes proportionally |
| Can you exit early? | Yes, in AMM markets | Yes, before cooling period |
| Does it require a view on the outcome? | Yes | No |
| Available in Knockout markets? | Yes | No |
| Best suited for | People with a view | People who want passive fee income |

*Next: [Getting started as an LP →]()*
