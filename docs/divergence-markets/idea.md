```
BigMarket supports cross chain predictions ( stacks and evm) based on signed buy/sell/claim messages. Markets support USDCx and any other SIP10 token. The platform is DAO governed.

I'm looking for use cases which help us find an audience. One thought is eg markets on the divergence of other markets...

"Which platform is mispriced?"
Kalshi	65%
Polymarket	52%

"Is Polymarket underpricing the event?"


or to look for  large cross-market spreads.
Event	Kalshi	Polymarket	Spread
Fed Cut	72%	58%	14%
Trump Wins State X	41%	55%	14%
ETH > $8k	33%	47%	14%

could this sort of thing be a win for us in terms of driving traffic and interest?
```

This is a much better fit than the card project, and the "markets on market divergence" idea is genuinely clever — let me break down why, and where the real risk sits.

**Why this works structurally, better than plain arbitrage:**

You're not building an arb bot (which competes on speed against bots who'll always beat a new entrant) — you're building **a meta-layer product**: BigMarket becomes the venue where people bet on whether *other people's* mispricing will resolve in a particular direction. That's a genuinely novel use case, not "yet another prediction market." Novelty is exactly what gets shared and written about.

**Two distinct product ideas in what you've described — worth separating:**

1. **The dashboard/content layer**: "Spread tracker" showing live divergence across Kalshi/Polymarket/etc on the same event. This is pure content/audience-building — no BigMarket bet required to consume it. People will share screenshots of big spreads ("14% gap on Fed cut odds?!") because it's inherently a "someone is wrong on the internet" hook, which is one of the most reliable virality patterns that exists.
2. **The actual market**: "Will Polymarket's price converge toward Kalshi's by resolution?" This is the clever bit — it's a bet on convergence/efficiency itself, which is a new asset class nobody else offers. That's your differentiation story for press/audience: "the only platform where you can bet on market efficiency."

**Where the real risk is — and it's not data access**

- **Resolution criteria are brutal here.** "Is Polymarket underpricing the event" needs a precise, disputable-proof resolution rule. Converge *by when*? Converge *to what threshold*? If Polymarket is at 52% and Kalshi at 65% the day before resolution and they both snap to the same outcome at settlement (because the event just happened), was Polymarket "wrong" or just slower to react? You need to nail down whether this resolves on "spread narrows by X points before date Y" vs "which platform's pre-resolution price was closer to actual outcome" — these are very different bets with very different incentive structures. This is the single hardest design problem, not a technical one.
- **Self-referential incentive risk**: if BigMarket itself becomes liquid enough to be one of the "platforms" being compared, you create a reflexive loop — people could manipulate BigMarket's own market to win a bet about divergence. Worth deciding early whether BigMarket markets are excluded from being a side of the divergence bet, at least initially.
- **Data feed reliability**: Kalshi and Polymarket APIs are both public and reliable, good. But you'll want to snapshot at a clearly defined, disputed-proof timestamp (e.g., "price at market close" or "VWAP over last hour") rather than an instantaneous quote, or you invite "but it was different 30 seconds later" disputes — costly for a DAO-governed platform where disputes likely go to a vote/arbitration process.

**On audience/traffic specifically — yes, I think this is a genuine win, for three concrete reasons:**

- The dashboard alone is link-bait independent of trading volume — journalists/Twitter accounts covering prediction markets love a "the market got it wrong" angle, especially around elections and Fed decisions
- It positions BigMarket as *infrastructure/commentary* on the whole sector rather than a single competing book, which is a much easier story to pitch (commentary > competitor)
- Cross-chain signed messages + the divergence-market angle gives you a clean technical demo story for crypto press specifically ("first platform to let you trade market efficiency itself")

Want to work through a concrete resolution-rule design for one example market (say, the Fed Cut one) so you have a template that's actually disputable-proof before building the dashboard?