# Resolution

How markets reach a final outcome, who's involved, and what happens if someone disagrees.

---

## How does a market resolve?

**Who decides the outcome?**

For most markets, a group of independent agents monitors the real-world event and signals the result once it's clear. These agents don't make a judgement call — they read publicly available information and report what happened. Think of them as referees reading the scoreboard, not picking the winner.

Some of these agents are automated — software that watches a data source and submits a result when conditions are met. Others are humans authorised by the community to act as reporters. Both types submit their signal to the same system, and neither type can resolve a market alone.

**What does "enough signals" mean?**

The community sets a threshold — for example, at least three out of five authorised agents must agree on the same outcome before the market can move to resolution. No single agent can force a result through. No single human can either. The threshold is a safeguard, and the community controls what that threshold is.

Once enough signals agree, the market moves to the resolving state. That triggers the dispute window — a brief period before the result becomes final.

**What about markets based on a price or a number?**

Those resolve differently — and more simply. The result is pulled automatically from a public price feed. No agent signals anything. No human is involved at all. The code reads the data, confirms the number, and applies the result directly.

There's nothing to dispute about whether a price crossed a certain level on a certain date. The data is public, the code reads it, and the result is recorded.

---

## What is the dispute window?

**Why is there a waiting period before the result is final?**

Because even a well-designed reporting system can get things wrong. An agent might misread data. A human reporter might make a mistake. A result might be genuinely ambiguous. The dispute window exists to catch those cases before money changes hands.

After the initial result is reported, roughly one day passes before it becomes permanent. During that window, any participant who has a stake in the market can formally challenge the outcome.

**Who can raise a dispute?**

Anyone who participated in the market — traders, liquidity providers, anyone with a position. You don't need a minimum balance of any token. You just need to have had skin in the game.

There's no penalty for disputing. If you genuinely believe the result is wrong, raising a challenge costs you nothing except the time it takes to do it.

**What happens if nobody disputes?**

The market resolves automatically at the end of the window. No action required from anyone. Winners can claim their share of the pool immediately.

---

## How does a dispute get resolved?

**What happens when someone raises a dispute?**

The market enters the Disputed state. A community vote opens. For about two and a half days, anyone holding governance tokens can vote on what the correct outcome should be.

The vote is token-weighted — participants with more earned influence carry more weight. When the vote closes, whatever the majority decided becomes the final, permanent result.

**Can the founders override a vote?**

No. The vote outcome is applied automatically by the code. There's no mechanism for any individual — including the founding team — to override a community vote. The result goes where the vote points, full stop.

**What if there's very low voter turnout?**

If a dispute vote concludes with no participation — nobody voted either way — the market defaults back to the original reported outcome. A dispute with no votes isn't enough to overturn a result. It just means the original reporters were trusted by default.

**What if I disagree with the community's vote?**

Once a vote concludes and the result is recorded on-chain, that outcome is permanent. It cannot be challenged again, overturned by an admin, or quietly changed later. The result is written into a permanent public record. That's the tradeoff for having a system where no individual can manipulate outcomes — the community's final word is genuinely final.

---

## How do I claim my winnings?

**When can I claim?**

The moment a market reaches Resolved status, claims open. There's no rush — there's no expiry deadline on your winnings. They sit in the market contract, attributed to your wallet, until you choose to claim them.

**How do I actually claim?**

1. Go to the market page on BigMarket
2. Connect the same wallet you used to trade
3. Click "Claim"
4. Approve the transaction in your wallet
5. Your winnings arrive in your wallet immediately

That's it. The amount is calculated automatically based on your share of the winning pool.

**What if I backed the wrong outcome?**

Your shares expire worthless and there's nothing to claim. The tokens behind your position flow to the winning side — that's how the pool works. There are no partial refunds and no consolation payouts. Prediction markets are zero-sum: every token that enters exits through a winning claim, a liquidity withdrawal, or a fee. Nothing disappears, nothing is created, and nothing leaks.

---

## Resolution at a glance

| Stage | What's happening | What you can do |
|-------|-----------------|-----------------|
| Open | Market is live, trading active | Buy and sell positions |
| Cooling | Trading closed, waiting for resolution | Nothing — wait |
| Resolving | Agents or oracle reporting the outcome | Nothing — wait |
| Disputed | Someone challenged the result, community voting | Vote if you hold governance tokens |
| Resolved | Final outcome recorded, permanent | Claim your winnings |

*Next: [Trading →]()*
