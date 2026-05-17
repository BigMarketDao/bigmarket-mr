# Markets and Events

How markets are structured, what types exist, and how they move from open to resolved.

---

## What is a market?

**What's the basic structure?**

Every market on BigMarket is built around a single question with a clear, verifiable answer. A question gets posted, a deadline is set, and participants take positions on the possible outcomes. When the deadline passes and the answer is known, the pool is split among the people who got it right.

Four things make up every market:

- The **question** — a specific event with a knowable outcome. "Will team X win the final?" or "Will BTC close above $100k in June?"
- The **outcomes** — the options participants can back. Yes or No. Team A, B, or C. A price range.
- The **pool** — the total money staked across all outcomes. This is what winners split.
- The **resolution** — the process that determines which outcome was correct and triggers payouts.

Everything else — fees, pricing, liquidity — sits on top of this structure.

**Is every market the same?**

No. Markets differ in two important ways: the type of question they ask, and the pricing mechanism they use. Both are set at creation and can't be changed once a market is live.

---

## What types of markets are there?

**What's a binary market?**

The simplest kind. One question, two possible answers: yes or no. "Will X happen before Y date?" Everyone picks a side. When the event resolves, the winning side splits the pool.

Example: "Will the 2026 World Cup final go to extra time?"

**What's a categorical market?**

A question with more than two possible answers. Instead of yes/no, you're picking from a list of outcomes. The same rules apply — whoever backed the winning outcome shares the pool.

Example: "Who will win the 2026 Champions League?" with options for each competing team.

**What's a scalar market?**

A question with a numeric answer. Instead of picking a winner, you're predicting where a number will land — within a range or above/below a threshold. These markets resolve automatically using a public price feed. No human reports the result. The data speaks for itself.

Example: "What will the BTC/USD price be on 1 July 2026?" with a range of outcomes based on price bands.

---

## How does the pricing work?

**What's the difference between AMM and Knockout?**

The type of question and the pricing mechanism are separate choices. Most markets on BigMarket use AMM (the default). Some use Knockout. Here's what that means in practice:

**AMM markets** price outcomes continuously. Every time someone buys or sells, the price shifts. Buy a lot of "Yes" and Yes gets more expensive — because the market is reading more demand for it. You can exit at any point before the market closes and get back whatever your position is currently worth. Prices reflect the crowd's best current guess in real time.

**Knockout markets** are simpler. You buy in, you hold. No selling before resolution. When the market closes, the winning side splits the entire pool proportionally. The earlier you bought into the winning outcome, the more you earn — because the pool was smaller when you entered.

The mechanism is always shown before you enter a market. You'll never discover mid-trade that you can't exit.

**Which one is better?**

Neither is universally better. AMM gives you flexibility — you can change your mind and exit early. Knockout is simpler and arguably fairer for short, one-off events like a tournament match where continuous price discovery adds little value. Most markets default to AMM.

---

## What are some examples of markets?

**Sports**

"Will Manchester City win the Premier League this season?" — Binary, AMM. The market opens at the start of the season and closes on the final day. Prices shift all season as results come in. You can exit early if your team starts underperforming.

"Who will win Euro 2028?" — Categorical, AMM. Multiple teams as outcomes. You back your pick and the price moves as the tournament progresses.

"Will the Super Bowl go to overtime?" — Binary, Knockout. Simple yes/no, single event. Knockout is ideal here — no reason to trade in and out of a question with a single definitive moment.

**Crypto prices**

"Will ETH close above $5,000 on 31 December 2026?" — Scalar, resolves automatically from a public price feed. No human reports the result. The number either hit the threshold or it didn't.

**Real-world events**

"Will inflation fall below 3% in the EU by Q3 2026?" — Binary, AMM. Resolution based on publicly reported economic data. Prices move as new data points come in throughout the year.

---

## What happens to a market over its lifetime?

**What are the stages?**

Every market moves through the same sequence of states, in order. Understanding these helps you know what actions are available at each point.

**Open** — The market is live. Participants can buy and sell positions freely (in AMM markets). This is where most of the trading happens.

**Cooling** — Trading has closed. No new positions can be opened or exited. The market is waiting to enter the resolution process. This period is brief — roughly one day.

**Resolving** — The outcome is being determined. For most markets, a group of independent agents signals the result. For scalar markets, the result is pulled automatically from a price feed. The market isn't resolved yet — this is just the signal being gathered.

**Disputed** — Someone with a stake in the market has challenged the reported outcome. The community now votes on what the correct result should be. The voting window lasts about two and a half days.

**Resolved** — The final outcome has been recorded. It cannot be changed. Winners can now claim their share of the pool. There's no deadline to claim — your winnings are there whenever you're ready.

**Can a market skip any of these stages?**

Most markets go Open → Cooling → Resolving → Resolved without ever hitting Disputed. A dispute only opens if someone actively challenges the outcome during the cooling window. If no one disputes, the market resolves automatically after the window closes.

Scalar markets skip the agent-signalling step entirely — they go straight from Cooling to Resolved once the price feed data is read.

---

## Who can create a market?

**Can anyone post a question?**

Not yet. Creating markets currently requires approval from the community. This is a deliberate choice — it keeps the quality of questions high and prevents spam or bad-faith markets during the platform's early phase.

The approval process is controlled collectively, not by any individual. There's no single person who grants or denies creator access.

**What does a creator control?**

When a market is created, the creator sets the question, the outcomes, the duration, the pricing mechanism, and optionally a creator fee — a percentage of every trade in their market, up to 10%. That fee is always shown to participants before they enter. The creator earns it automatically on every trade, for as long as the market is live.

*Next: [Prices and how they move →]()*
