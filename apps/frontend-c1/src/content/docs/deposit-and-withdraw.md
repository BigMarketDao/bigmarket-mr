# Deposit and Withdraw

Add USDC to your vault before you trade. Take it back out when you want.

---

## What is the vault?

The vault holds your **trading balance** on BigMarket.

When you deposit USDC, it is credited to your vault as **USDCx**. That balance is what you use to buy and sell in markets that run on USDC.

Your vault balance is separate from the USDC sitting in your wallet until you deposit it.

---

## Where to go

Open **Deposit** in the site header, or go to [/vault](/vault).

At the top you will see three balances:

- **Vault USDCx** — funds ready to trade
- **Wallet USDC / USDCx** — funds still in your connected wallet
- **Mapped USDCx** — an internal relay balance (you can usually ignore this)

Use **Refresh** if a balance looks wrong after a transaction.

---

## Deposit from Stacks

Best if you already hold **USDCx** on Stacks.

1. Connect a **Stacks wallet** (Xverse, Leather, or similar).
2. Open **Deposit** and choose **Stacks**.
3. Enter the amount and confirm in your wallet.
4. After the transaction confirms, your **Vault USDCx** balance updates.

You pay normal Stacks network fees for this transaction.

---

## Deposit from Ethereum

Best if you hold **USDC on Ethereum** and use **MetaMask**.

1. Connect **MetaMask**.
2. Open **Deposit** and choose **Ethereum**.
3. Enter the amount of USDC to send.
4. Approve the token spend in MetaMask if asked.
5. Confirm the bridge transaction.

Your USDC is bridged to Stacks and credited to your vault. This can take a few minutes.

On testnet, use **Sepolia** USDC in MetaMask.

---

## Withdraw to Stacks

1. Connect your **Stacks wallet**.
2. Open **Withdraw**, choose **Stacks**, and enter the amount.
3. Choose the **recipient** Stacks address (defaults to your own wallet).
4. Sign the withdrawal message in your wallet.

You do not need STX for gas on this step — the app submits the on-chain transaction for you. USDCx is sent to the recipient address you chose.

---

## Withdraw to Ethereum

1. Connect **MetaMask**.
2. Open **Withdraw**, choose **Ethereum**, and enter the amount.
3. Sign the withdrawal message in MetaMask (no ETH gas required for the signature).

USDCx leaves your vault and is bridged back to **USDC in your MetaMask wallet**. Bridging can take a few minutes.

---

## Common questions

**Why is my vault balance still zero after depositing?**
Wait for the transaction to confirm, then click **Refresh**. Ethereum deposits also need the bridge to finish.

**Can I withdraw to a different address?**
Yes on the **Stacks** path — enter any Stacks address as the recipient. The **Ethereum** path sends back to the MetaMask address you connected with.

**Do I need funds in the vault to trade?**
Yes, for markets that use USDC. If a market uses STX or another token, you need that token in your wallet instead.

*Next: [Quickstart →]()*
