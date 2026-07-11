# BigMarket Milestone 3 — Action Plan

## 1. Prepare accounts and funds

1. Keep enough STX for deployment, market creation, relayer fees and retries.
2. Convert a small amount of STX to 30–60 USDC.
3. Fund the Bob MetaMask wallet with:

- USDC
- enough ETH for gas

4. Fund the relayer wallet with STX.
5. Use separate admin and Bob accounts.

## 2. Prepare registration

1. Make the Register Interest link the entry point.
2. Support Google and GitHub OAuth.
3. Store:

- email
- OAuth provider
- registration date
- last login date
- referral source

4. Add a separate optional marketing consent checkbox.
5. Redirect the user back to the intended market after registration.
6. Test repeat login and duplicate-account handling.

## 3. Deploy to mainnet

1. Tag the release.
2. Record the Git commit.
3. Deploy the contracts.
4. Execute required DAO proposals.
5. Configure:

- vault
- USDCx
- market contracts
- relayer
- resolution agent

6. Update frontend and API mainnet configuration.
7. Record all deployment transaction IDs.
8. Test the production site.

## 4. Create Market 1

1. Create a simple market ending in 1–2 days.
2. Add the minimum practical liquidity.
3. Use it only for the controlled Bob test.

## 5. Run the Bob test

1. Open the source-tagged Register Interest link.
2. Register with Google or GitHub.
3. Confirm the email was stored.
4. Connect MetaMask.
5. Deposit USDC through Allbridge.
6. Confirm USDCx reaches the mapped Stacks address.
7. Confirm the relayer sweeps funds into the vault.
8. Record the Ethereum, bridge and Stacks transaction IDs.
9. Buy shares using a MetaMask signature.
10. Record the transaction ID and balance changes.
11. Sell part of the position.
12. Record the transaction ID and balance changes.
13. Replay the same signed message and confirm rejection.
14. Change signed data and confirm rejection.
15. Resolve the market.
16. Claim winnings using a MetaMask signature.
17. Confirm a second claim is rejected.
18. Record screenshots and results.

## 6. Create Market 2

1. Create a simple market ending in about one week.
2. Add 10–20 USDCx liquidity.
3. Create source-tagged registration links for:

- friends
- Stacks Telegram
- Discord
- direct outreach

## 7. Recruit testers

1. Send the registration link to 3–5 trusted people.
2. Ask them to:

- register
- connect MetaMask
- deposit or receive a small test amount
- place one trade
- provide feedback

3. Fund only committed testers.
4. Keep individual test amounts small.
5. Help users through the flow without handling their keys.

## 8. Share publicly

1. Share the Register Interest link in approved Stacks groups.
2. State:

- mainnet beta
- small amounts only
- MetaMask required
- feedback requested

3. Do not share the raw market link as the main entry point.

## 9. Follow up by email

1. Send registration confirmation.
2. Send the market link and short instructions.
3. Send one reminder before market close where appropriate.
4. Send the result and claim link after resolution.
5. Send a feedback request.
6. Send future marketing only to users who opted in.

## 10. Resolve Market 2

1. Record the public resolution source.
2. Resolve the market.
3. Email participants.
4. Ask winners to claim.
5. Record claim transaction IDs.
6. Collect final feedback.

## 11. Create Market 3

1. Create a market ending in 2–3 weeks.
2. Add minimum liquidity.
3. Keep it live during grant submission.
4. Monitor registration, deposits, trades and relayer activity.

## 12. Record evidence

Create:

```text
docs/milestone-3/
  deployment.md
  mainnet-addresses.md
  bob-test.md
  external-testing.md
  registrations.md
  transaction-log.csv
  feedback.md
  known-limitations.md
  screenshots/
```

Record:

1. Contract addresses.
2. Deployment transaction IDs.
3. Registration counts.
4. Wallet connection counts.
5. Deposit transaction IDs.
6. Buy transaction IDs.
7. Sell transaction IDs.
8. Resolution transaction IDs.
9. Claim transaction IDs.
10. Failed security tests.
11. User feedback.
12. Changes made after testing.

Do not publish raw email addresses.

## 13. Final submission

1. Record one end-to-end screen demonstration.
2. Publish the mainnet addresses.
3. Publish the user instructions.
4. Publish aggregated usage data.
5. Publish known limitations.
6. Write the Milestone 3 report.
7. Submit the report with transaction links and evidence.

## Completion checklist

- [x] OAuth registration works
- [x] Emails are stored
- [x] Marketing consent is separate
- [x] Mainnet contracts are deployed
- [x] MetaMask deposit works
  - [Approval: 0xed2060c51a4c9c8b99b31efa70097fb1bd251e2c62d02634b43a4e8a20aed4ac](https://etherscan.io/tx/0xed2060c51a4c9c8b99b31efa70097fb1bd251e2c62d02634b43a4e8a20aed4ac)
  - [Transfer: 0x47fd676cb90b79725455d783ec5a4bb7b03ec947e763d0e3d6ab24fbc4681584](https://etherscan.io/tx/0x47fd676cb90b79725455d783ec5a4bb7b03ec947e763d0e3d6ab24fbc4681584)
- [x] Signed buy works
- [ ] Signed sell works
- [ ] Signed claim works
- [ ] Replay protection works
- [ ] One external user completes a live action
- [ ] User feedback is collected
- [ ] Transaction IDs are recorded
- [ ] Evidence and documentation are published
