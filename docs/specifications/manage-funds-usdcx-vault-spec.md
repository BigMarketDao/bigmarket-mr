# ManageFunds.svelte: USDCx Bridge Phase 2 Specification

## Goal

Implement `ManageFunds.svelte` so it handles phase 2 of the bridge flow: moving USDCx from a Stacks custody address into the BigMarket Clarity vault.

The component must support two user paths:

1. **Cross-chain user**: user is connected with Ethereum/Solana/etc., has bridged USDCx via AllBridge to a temporary/derived mapped Stacks address, and the backend relayer sweeps those funds into the vault.
2. **Native Stacks user**: user is connected with a Stacks wallet and has a non-zero USDCx balance in that wallet. The UI should detect this, fetch/display the USDCx balance, and provide a button to transfer/deposit to the vault.

## Existing backend routes and helpers

The backend already exposes cross-chain mapping and sweep routes under the cross-chain API namespace, currently mounted like:

```ts
app.use("/bigmarket-api/cross-chain", crossChainRoutes);
```

### 1. Resolve/create mapped Stacks address

Route:

```ts
GET /bigmarket-api/cross-chain/mappings/:sourceChain/:sourceAddress
```

Expected use:

```ts
const { mappedAddress } = await getCreateMappedStacksAddress(
  apiBase,
  sourceChain,
  sourceAddress,
);
```

Backend behavior:

- Calls `getOrCreateMappedAddress(sourceChain, sourceAddress)`.
- Uses `createStacksWallet(secretSource, sourceChain, sourceAddress, network)`.
- Derives a deterministic Stacks private key from the relayer secret + source address.
- Returns the mapped Stacks address.
- Stores the source chain/source address -> mapped Stacks address mapping server-side.

Important helper shape:

```ts
createStacksWallet(secretSource, sourceChain, sourceAddress, network);
```

returns:

```ts
{
  sourceChain,
  sourceAddress,
  mappedChain: 'stacks',
  mappedAddress,
  network,
  createdAt
}
```

### 2. Register bridge/deposit intent

Route:

```ts
POST / bigmarket - api / cross - chain / intents;
```

Backend function:

```ts
registerBridgeIntent({
  sourceChain,
  sourceAddress,
  amount?,
  tokenContractAddress?,
  tokenContractName?,
  destinationVaultAddress?
})
```

Behavior:

- Resolves mapped address via `getOrCreateMappedAddress(...)`.
- Creates a `CrossChainIntent` with status `created`.
- Defaults token/vault values from DAO config:
  - `VITE_USDCX_CONTRACT_ADDRESS`
  - `VITE_DAO_VAULT`
- Inserts the intent into `crossChainIntentCollection`.
- Returns `{ intentId, mappedAddress, status }`.

### 3. Sweep intent to vault

Route:

```ts
POST /bigmarket-api/cross-chain/intents/:intentId/sweep
```

Backend function:

```ts
sweepIntentToVault(intentId);
```

Behavior:

- Finds the intent in `crossChainIntentCollection`.
- If already `swept`, returns the existing `sweepTxId`.
- Looks up the mapped address private key using `getMappingByMappedAddress(intent.mappedAddress)`.
- Fetches mapped address USDCx balance using `getSip010Balance(...)`.
- If balance is zero, sets intent `failed` and throws.
- Builds a Stacks transaction using the relayer-controlled mapped private key.
- Calls the DAO vault contract `deposit-for`:

```ts
makeContractCall({
  contractAddress: getDaoConfig().VITE_DAO_DEPLOYER,
  contractName: getDaoConfig().VITE_DAO_VAULT,
  functionName: "deposit-for",
  functionArgs: [
    contractPrincipalCV(intent.tokenContractAddress, intent.tokenContractName),
    uintCV(balance),
    standardPrincipalCV(intent.mappedAddress),
    bufferCV(Buffer.from(intent.intentId.replace("0x", ""), "hex")),
  ],
  senderKey: privateKey,
  network: getStacksNetwork(),
  fee: RELAYER_STX_FEE,
  nonce,
  postConditionMode: PostConditionMode.Allow,
});
```

- Broadcasts the transaction.
- Marks intent as `swept` with `sweepTxId`.
- Returns `{ intentId, status: 'swept', sweepTxId, amount }`.

## Frontend requirements

### Wallet/source identity detection

`ManageFunds.svelte` should derive connected accounts from `walletState`:

- `stxAddress`: account where `type === 'stx'`
- `ethAddress`: account where `type === 'eth'`
- `solAddress`: account where `type === 'sol'`

Preferred identity selection:

1. If connected wallet/session has EVM address, use `{ chain: 'evm', address: ethAddress }`.
2. Else if Solana address, use `{ chain: 'solana', address: solAddress }`.
3. Else if Stacks address, use `{ chain: 'stacks', address: stxAddress }`.
4. Else show “connect wallet” state.

For Stacks-native users, the mapped/custody address should effectively be their own Stacks address. Do not force Stacks users through the derived-address relayer path unless the backend mapping route explicitly supports `sourceChain=stacks` and returns the same address.

### Balance loading

On mount and whenever wallet/source identity changes:

1. Resolve the custody address:
   - Cross-chain: call `GET /mappings/:sourceChain/:sourceAddress` and use returned `mappedAddress`.
   - Native Stacks: use the connected `stxAddress` as the custody address.
2. Fetch USDCx balance at the custody address:
   - Use existing SDK/client helper if available, e.g. `stacks.createVaultClient(daoConfig).getUsdcxBalance(stacksApi, custodyAddress)`.
3. Fetch vault balance credited to the source identity:
   - Use existing helper, e.g. `getVaultUsdcxBalance(stacksApi, sourceIdentity.chain, sourceIdentity.address)`.
4. Display:
   - connected Stacks wallet address, if present
   - source identity address and chain
   - custody/mapped address
   - USDCx available to move
   - USDCx already in vault

### Deposit / move-to-vault behavior

The primary button should be enabled only when:

- wallet/source identity exists
- custody address is resolved
- not currently loading/submitting
- USDCx custody balance is non-zero

#### Scenario A: Cross-chain user using mapped Stacks custody

Condition:

```ts
sourceIdentity.chain !== "stacks";
```

Flow:

1. Call the frontend utility that wraps intent registration + sweep, or implement it if missing:

```ts
requestMappedDepositToVault(apiBase, sourceChain, sourceAddress);
```

Expected utility behavior:

- `POST /cross-chain/intents` with `{ sourceChain, sourceAddress }`
- then `POST /cross-chain/intents/:intentId/sweep`
- return the sweep tx id as `{ txid }` or normalize `sweepTxId` to `txid`

2. Show pending/submitted state.
3. Link tx id to the Stacks explorer via existing `stacks.explorerTxUrl(...)` helper.
4. Refresh balances after successful submission.

#### Scenario B: Native Stacks user with USDCx balance

Condition:

```ts
sourceIdentity.chain === "stacks" &&
  stxAddress &&
  custodyAddress === stxAddress;
```

Flow:

1. User signs a Stacks transaction directly from their wallet.
2. Use existing vault client helper if available:

```ts
vault.depositSip10ToVault({
  amountMicro,
  userChain: "stacks",
  sourceAddress: stxAddress,
  senderStxAddress: stxAddress,
});
```

3. The vault deposit should transfer USDCx from the user wallet into the vault and credit the vault ledger against `{ chain: 'stacks', address: stxAddress }`.
4. Show the tx id and refresh balances.

## UI states

Show clear states for:

- no wallet connected
- wallet connected but no supported source identity
- resolving mapped/custody address
- loading balances
- zero USDCx balance
- non-zero USDCx balance with enabled “Move USDCx to vault” button
- submitting/sweeping
- submitted tx hash
- backend or wallet error

Suggested labels:

- Title: `Manage vault`
- Available balance: `USDCx available to move`
- Vault balance: `USDCx in vault`
- Button: `Move USDCx to vault`

For cross-chain users, helper text:

> USDCx sits on your mapped Stacks custody address. The relayer will sweep it into the vault and credit your cross-chain identity.

For Stacks users, helper text:

> You will sign the vault deposit from your connected Stacks wallet.

## Implementation notes

- Keep all business logic out of the Svelte markup where practical.
- Reuse existing imports from `@bigmarket/bm-common`, `@bigmarket/bm-utilities`, and `@bigmarket/sdk` before adding new API clients.
- Treat token amounts as `bigint` internally. Only convert to number/string for display.
- Avoid calling the relayer sweep path for native Stacks wallet deposits unless explicitly intended.
- Normalize backend response names: route returns `sweepTxId`, UI likely expects `txid`.
- Refresh balances after both direct wallet deposit and relayer sweep.
- Do not require a connected Stacks wallet for cross-chain relayer sweeps if the app can maintain an EVM/Solana session without one. If current wallet architecture requires Stacks connection, remove that constraint in `canSubmit` for relayer path.

## Acceptance criteria

- A user connected with Ethereum/Solana can see their mapped Stacks custody address, USDCx balance, vault balance, and trigger relayer sweep.
- A user connected with Stacks can see their own wallet USDCx balance and deposit it into the vault by signing a Stacks transaction.
- Zero-balance users cannot submit and see an appropriate message.
- Successful deposits display a Stacks explorer link.
- Errors from mapping, balance fetch, intent creation, sweep, or wallet signing are displayed without breaking the component.
- Balance refresh works before and after deposit.
