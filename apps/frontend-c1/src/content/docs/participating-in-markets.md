# Participating in Markets

How to buy a position, exit early, and claim what you've won.

---

## Buying shares

**What am I actually doing when I stake on an outcome?**

You're buying shares. When you pick an outcome and enter an amount, the platform mints shares to your wallet — a record that says you backed this outcome, at this price, with this many tokens. Those shares sit in your wallet until you sell them, the market resolves, or the deadline passes.

The number of shares you receive depends on two things: how much you put in, and the current price of that outcome. A 30%-priced outcome gives you more shares per token than a 70%-priced one. More shares means a larger slice of the pool if that outcome wins.

**Does it matter when I buy?**

In AMM markets, timing affects the price you pay but not your ability to exit. Buy early when an outcome is cheap, and you get more shares for your money. If the crowd agrees with you and the price rises, your shares are worth more — you can sell at a profit before the market even resolves.

In Knockout markets, timing matters more directly. There's no selling, so you hold whatever position you bought. The earlier you buy the winning outcome, the more you earn at resolution — because fewer people were in the pool when you entered, so your share of it is larger.

**What if the price moves while my transaction is processing?**

That's slippage — the gap between the price you saw and the price you got. To protect against it, you set a minimum number of shares you're willing to accept before confirming. If the price shifts enough that you'd receive fewer shares than your minimum, the transaction cancels automatically. You keep your tokens. Nothing is lost.

The interface shows your slippage tolerance setting before you confirm. Adjust it if the market is moving fast or if you're placing a large trade relative to the pool.

---

## Selling before resolution

**Can I change my mind after buying?**

In AMM markets, yes — at any point before the cooling period begins. You sell your shares back to the pool and receive the current value in return. You're not locked in for the life of the market.

There are a few reasons you might want to sell early:

- You backed an outcome that now looks unlikely, and you'd rather cut your loss than wait for resolution
- The outcome you backed has become much more expensive since you bought it, and you'd rather take a profit now than wait
- You simply need your tokens back for something else

**How much do I get back when I sell?**

Whatever your shares are currently worth based on the pool ratio at the moment you sell. If the outcome you backed has become more popular since you bought — price went up — you may receive more than you put in. If it's become less popular — price went down — you receive less.

The sell panel shows you the estimated refund and the slippage tolerance before you confirm, the same way buying does. The same protection applies — if the price shifts beyond your tolerance between clicking and confirming, the transaction cancels.

**Is there a fee to sell?**

Yes. The same 1% protocol fee applies to sells as to buys. If the market has a creator fee, that applies too. The total fee is shown before you confirm.

**What if I'm in a Knockout market?**

You can't sell. Knockout markets don't support early exit. Once you've staked, you hold until the market resolves. This is always shown clearly before you enter a Knockout market — there's no discovering it mid-position.

---

## Claiming your winnings

**When do claims open?**

The moment a market reaches Resolved status. That happens after the dispute window closes with no challenge, or after a dispute vote concludes. Either way, the platform updates the market status automatically — you don't need to do anything to trigger it.

**How do I claim?**

1. Go to the market page or find it under "My Markets" in your dashboard
2. If you backed the winning outcome, you'll see a "Claim" button
3. Click it and approve the transaction in your wallet
4. Your winnings arrive in your wallet immediately

That's the full process. No forms, no waiting periods after clicking, no manual calculation. The amount is worked out automatically from your share of the winning pool.

**How is my payout calculated?**

Your payout is proportional to your share of the winning outcome's pool relative to everyone else who backed the same outcome.

In plain English: if you hold 5% of all the shares in the winning outcome, you receive 5% of the total pool. The total pool is everything staked across all outcomes in that market, minus fees.

The more shares you hold, and the fewer other people who backed the same outcome, the larger your payout.

**Is there a deadline to claim?**

No. Your winnings sit in the market contract attributed to your wallet indefinitely. There's no urgency to claim immediately after resolution. Claim when it's convenient.

**What if I backed the wrong outcome?**

There's nothing to claim. Your shares expire at resolution and the tokens behind them flow to the winning side. There are no partial refunds, no consolation payouts, and no way to reverse a position after the cooling period begins.

This is how prediction markets work — every token that enters a market exits through a winning claim, an LP withdrawal, or a fee. Nothing leaks and nothing disappears, but losing positions have no residual value.

---

## Keeping track of your positions

Your dashboard shows all your open and resolved positions in one place. For each position you can see the outcome you backed, the current price, how many shares you hold, what they'd be worth if you sold right now, and the market deadline.

For resolved markets, the dashboard shows whether a claim is available or whether the position expired. Unclaimed winnings stay visible until you claim them.

*Next: [Fees and Payouts →]()*
