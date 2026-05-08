# Bridging

The Solana user must be able to bridge funds from their Phantom wallet to Stacks. This must work symmetrically
for deposits and withdrawals.

The Allbridge network provides the bridging layer and enables point to point - Solana address to Stacks address - bidirectional deposit/withdrawal support. To avoid the user having to manage a stacks wallet (this phase provides pure Phantom wallet integration) BigMarket provides a relayer where this relayer acts as the stacks end of the bridge and provides the additional step of pushing the funds into the users ed25519 controlled vault in clarity.

Note: The vault itself is **never accessible to the relayer**. The relayer can't move funds out of the vault without a valid Phantom signature.

The following use cases are considered;

- deposit funds
- withdraw funds

## Deposit Funds

```
DEPOSIT:
Solana → Allbridge → Your relayer's Stacks address
Relayer calls vault.deposit(solana_pubkey, amount)
Vault credits solana_pubkey
→ Relayer's custody ends here. Vault holds funds.
```

Trust assumptions:

```
Allbridge landing → vault.deposit()
          Duration: seconds (one tx)
          Risk: relayer could deposit to wrong pubkey
          Mitigation: user provides their solana pubkey
                      as the deposit instruction param,
                      verifiable on-chain
```

## Withdraw Funds

```
WITHDRAWAL:
User signs withdrawal message with Phantom
Relayer verifies sig off-chain, calls vault.withdraw(amount, sig, solana_pubkey)
Vault verifies ed25519 on-chain → releases to relayer's Stacks address
Relayer initiates Allbridge bridge back to user's Solana address
→ Relayer's custody window: bridge transit only
```

Trust assumptions:

```
vault.withdraw() → Allbridge delivery to Solana
          Duration: bridge transit (~minutes)
          Risk: relayer could bridge to wrong Solana address
          Mitigation: the withdrawal sig from Phantom includes
                      the destination address — vault can enforce it
```

---

## Trust Assumptions

| Risk                                | Mitigation                           | Residual Trust              |
| ----------------------------------- | ------------------------------------ | --------------------------- |
| Relayer deposits to wrong pubkey    | User-provided pubkey in bridge memo  | User must specify correctly |
| Relayer steals from vault           | Impossible — ed25519 sig required    | **None**                    |
| Relayer redirects withdrawal bridge | Destination committed in Phantom sig | **None**                    |
| Relayer goes offline                | User requires another path           | Liveness only               |
| Relayer front-runs deposit window   | Window is one tx, amount is exact    | Minimal                     |

The **liveness** and trust assumptions can be removed by providing a path for the user to supply their own stacks wallet address and so take full control of the deposit/withdraw flows - this will be delivered in a later cycle.

---
