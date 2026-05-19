# Positions and Tokens

What you own when you trade, how the tokens work, and how participation turns into ownership.

---

## What are shares?

**What do I actually own when I trade on BigMarket?**

When you back an outcome on BigMarket, you receive shares. A share represents your slice of the winning pool if that outcome resolves correctly. The more shares you hold relative to everyone else who backed the same outcome, the larger your cut of the pool.

Think of it like a raffle where the tickets are priced dynamically. You buy tickets for the outcome you believe in. If that outcome wins, you and every other ticket holder for that outcome split the prize. The earlier you bought — and the fewer other people who backed it — the more valuable your tickets are relative to the pool.

**Do shares have a price?**

Yes, and it changes constantly in AMM markets. The price of a share reflects the current probability the crowd assigns to that outcome. A share in a 70%-priced outcome costs 70 cents. A share in a 30%-priced outcome costs 30 cents.

In Knockout markets the price is fixed at the moment you buy — it reflects the pool ratio at that instant, not a continuously moving curve.

**Can I sell my shares?**

In AMM markets, yes — at any point before the market closes. You sell back to the pool and receive whatever your shares are currently worth. If the outcome you backed has become more popular since you bought, you may even sell at a profit before resolution.

In Knockout markets, no. Once you're in, you hold until the market resolves.

**What happens to my shares when a market resolves?**

If your outcome wins: your shares entitle you to a proportional cut of the entire pool. The more shares you hold relative to all winning shares, the more you receive.

If your outcome loses: your shares expire worthless. The tokens behind them flow to the winning side.

---

## What tokens does BigMarket use?

**What tokens can I trade with?**

Each market is configured to accept one specific token — set by the creator when the market is made. The token is always shown before you enter. The most common ones you'll encounter:

- **STX** — the native token of the Stacks network. Used across most markets on BigMarket. If you're just getting started, STX is what you need.
- **sBTC** — a token that tracks the price of Bitcoin one-to-one. Used in Bitcoin-denominated markets.
- **USDA** — a stablecoin pegged to the US dollar. Its value doesn't fluctuate with the crypto market — useful for markets where you want price stability in your stake.

Every token accepted on BigMarket has been approved by the community. No market can use an unapproved token.

**Do I need different tokens for different markets?**

Yes. Each market specifies its token upfront. If a market runs on sBTC and you only hold STX, you'll need to acquire sBTC before you can participate. The token requirement is always visible on the market page before you commit anything.

---

## What is BIG?

**What is the BIG token?**

BIG is BigMarket's own token. It's not a currency you trade with — it's a governance token. Holding BIG gives you a say in how the platform works: fee rates, which markets are allowed, how disputes are resolved, and how the treasury is spent. Every major decision goes to a community vote, and your BIG balance is your vote.

Think of it less like money and more like shares in a cooperative. Except you don't buy in — you earn in.

**How do I get BIG?**

You earn it by participating. Every month, a fixed pool of 10,000 BIG is distributed to active participants based on how much reputation they've accumulated. The more you contribute — trading, providing liquidity, voting on outcomes — the larger your share of that monthly pool.

BIG can't be bought directly on BigMarket. There's no shortcut. The only way to accumulate meaningful BIG is to show up and participate consistently.

**What's the total supply?**

100 million BIG. That number is fixed and hardcoded — it cannot be inflated by anyone, including the founding team. The community controls how it's distributed over time.

**What can I do with BIG once I have it?**

- Vote on governance proposals — fee changes, new market types, treasury spending
- Earn more reputation, which earns more BIG in future epochs
- Participate in decisions about who gets to create markets

The more BIG you hold, the more weight your vote carries. But because BIG is earned through participation rather than purchased, influence accumulates with contribution — not just capital.

---

## What is BIG-R reputation?

**What's the difference between BIG and BIG-R?**

BIG is the governance token — tradeable, transferable, usable for voting. BIG-R (reputation) is something different. It's a record of your participation — non-transferable, non-tradeable, and attached permanently to your wallet. You can't buy it, sell it, or move it to another address. You earn it by doing things on the platform, and it stays with you.

Think of it like a track record. The platform keeps score of everything you contribute, and that score is visible to everyone. You can't fake it and you can't buy it.

**How do I earn BIG-R?**

Every meaningful action on the platform earns reputation points. The highest-value actions are the ones that demonstrate genuine contribution:

| Action | Points |
|--------|--------|
| Claiming a winning prediction | 10 |
| Creating a market | 8 |
| Voting in a dispute | 7 |
| Providing liquidity | Scaled to amount |
| Making a prediction | 6 |
| Voting on governance proposals | 3 |

Claiming a winning prediction scores highest — because it proves you were right. That's the signal the platform values most.

**How does BIG-R convert to BIG?**

At the end of each epoch — roughly monthly — the platform distributes 10,000 BIG to all reputation holders. Your share is proportional to your weighted reputation score relative to everyone else that epoch.

The distribution is automatic. You don't need to do anything manually — the platform calculates your share and sends it to your wallet.

**Can my reputation decay?**

Yes. Reputation isn't permanent. If you stop participating, your score gradually decreases. This keeps the system fair — wallets that earned reputation early and then went dormant don't hold disproportionate influence over the platform indefinitely. Consistent contributors stay relevant. One-time participants don't.

**Why does this matter?**

It means the people with the most influence over how BigMarket works are the people who use it most actively — not the people who invested the most money earliest. That's a meaningfully different power structure from most platforms, and it's enforced by the code, not by a policy that could be changed.

*Next: [Resolution →]()*
