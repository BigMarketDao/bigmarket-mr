import {
  AllbridgeCoreSdk,
  ChainSymbol,
  Messenger,
  nodeRpcUrlsDefault,
  mainnet,
  type SendParams,
  type TokenWithChainDetails,
} from "@allbridge/bridge-core-sdk";
import type { Eip1193Provider } from "@bigmarket/bm-types";
import { Web3 } from "web3";
import { getMetaMask } from "./injected.js";

export type SendAllbridgeDepositParams = {
  /** Token amount to send (Allbridge float string, same as SDK examples). */
  amount: string;
  /** Recipient on the destination chain (e.g. vault or relayer address). */
  toAccountAddress: string;
  /** Source chain; default `ChainSymbol.ETH`. */
  sourceChain?: ChainSymbol;
  /** Destination chain (e.g. `ChainSymbol.STX` for Stacks). */
  destinationChain: ChainSymbol;
  /** Token symbol available on both chains; default USDC. */
  tokenSymbol?: string;
  tokenSymbolDestination?: string;
  messenger?: Messenger;
  /** Optional ETH JSON-RPC URL merged into Allbridge `nodeRpcUrlsDefault`. */
  ethRpcUrl?: string;
  /** When true, use Allbridge core params for Stacks testnet (devnet/testnet). */
  stxIsTestnet?: boolean;
  /** When omitted, uses MetaMask via {@link getMetaMask}. */
  provider?: Eip1193Provider;
};

export type ApproveAllbridgeDepositParams = Omit<
  SendAllbridgeDepositParams,
  "toAccountAddress"
>;

type AllbridgeEthContext = {
  provider: Eip1193Provider;
  web3: Web3;
  userAddress: string;
  sdk: AllbridgeCoreSdk;
  sourceToken: TokenWithChainDetails;
  destinationToken: TokenWithChainDetails;
  messenger: Messenger;
};

function extractTxHash(sent: unknown): string {
  if (typeof sent === "string") return sent;
  if (typeof sent === "object" && sent !== null && "transactionHash" in sent) {
    return String((sent as { transactionHash: string }).transactionHash);
  }
  return "";
}

async function loadAllbridgeEthContext(
  params: ApproveAllbridgeDepositParams,
): Promise<AllbridgeEthContext> {
  const provider = params.provider ?? getMetaMask();
  const web3 = new Web3(provider as any);

  await provider.request({ method: "eth_requestAccounts" });
  const [userAddress] = (await web3.eth.getAccounts()) as string[];

  const nodeUrls = {
    ...nodeRpcUrlsDefault,
    ...(params.ethRpcUrl ? { ETH: params.ethRpcUrl } : {}),
  };

  const sdk =
    params.stxIsTestnet === true
      ? new AllbridgeCoreSdk(nodeUrls, { ...mainnet, stxIsTestnet: true })
      : new AllbridgeCoreSdk(nodeUrls);

  const chains = await sdk.chainDetailsMap();

  const sourceChainSym = params.sourceChain ?? ChainSymbol.ETH;
  const sourceChain = chains[sourceChainSym];
  const destChain = chains[params.destinationChain];

  if (!sourceChain?.tokens || !destChain?.tokens) {
    throw new Error(
      `Allbridge: missing chain metadata for ${sourceChainSym} → ${params.destinationChain}`,
    );
  }

  const tokenSymbol = params.tokenSymbol ?? "USDC";
  const destSymbol = params.tokenSymbolDestination ?? tokenSymbol;
  const sourceToken = sourceChain.tokens.find((t) => t.symbol === tokenSymbol);
  const destinationToken = destChain.tokens.find(
    (t) => t.symbol === destSymbol,
  );

  if (!sourceToken || !destinationToken) {
    throw new Error(
      `Allbridge: token origin "${tokenSymbol}" or destination "${destSymbol}" not found on ${sourceChainSym} or ${params.destinationChain}`,
    );
  }

  const messenger = params.messenger ?? Messenger.ALLBRIDGE;

  return {
    provider,
    web3,
    userAddress,
    sdk,
    sourceToken,
    destinationToken,
    messenger,
  };
}

/**
 * Ensure ERC20 allowance for the Allbridge pool on the source chain.
 * Uses {@link BridgeService.checkAllowance}; does not open MetaMask when already sufficient.
 */
export async function approveAllbridgeDepositIfNeeded(
  params: ApproveAllbridgeDepositParams,
): Promise<
  { alreadyApproved: true } | { alreadyApproved: false; txHash: string }
> {
  const { web3, userAddress, sdk, sourceToken, messenger } =
    await loadAllbridgeEthContext(params);

  const sufficient = await sdk.bridge.checkAllowance(web3 as any, {
    token: sourceToken,
    owner: userAddress,
    amount: params.amount,
    messenger,
  });

  if (sufficient) {
    return { alreadyApproved: true };
  }

  const approveTx = (await sdk.bridge.rawTxBuilder.approve(web3 as any, {
    token: sourceToken,
    owner: userAddress,
    amount: params.amount,
    messenger,
  })) as {
    from?: string;
    to?: string;
    value?: string;
    data?: string;
  };

  const sent = await web3.eth.sendTransaction({
    ...approveTx,
    from: userAddress,
  });

  const txHash = extractTxHash(sent);
  if (!txHash) {
    throw new Error(
      "Allbridge: approve sendTransaction returned no transaction hash",
    );
  }

  return { alreadyApproved: false, txHash };
}

export async function sendAllbridgeDeposit(
  params: SendAllbridgeDepositParams,
): Promise<{ txHash: string }> {
  const provider = params.provider ?? getMetaMask();
  const { web3, userAddress, sdk, sourceToken, destinationToken, messenger } =
    await loadAllbridgeEthContext(params);

  const sendParams: SendParams = {
    amount: params.amount,
    fromAccountAddress: userAddress,
    toAccountAddress: params.toAccountAddress,
    sourceToken,
    destinationToken,
    messenger,
  };

  await provider.request({ method: "eth_requestAccounts" });
  // ✅ Network consistency check — before anything else
  await assertNetworkConsistency(
    provider,
    params.stxIsTestnet ?? false,
    params.toAccountAddress,
    params.sourceChain ?? ChainSymbol.ETH,
  );

  if (params.destinationChain === ChainSymbol.STX) {
    const prefix = params.stxIsTestnet ? "ST" : "SP";
    if (!params.toAccountAddress.startsWith(prefix)) {
      throw new Error(
        `STX address "${params.toAccountAddress}" looks wrong for ${
          params.stxIsTestnet ? "testnet" : "mainnet"
        } — expected prefix "${prefix}"`,
      );
    }
  }

  const rawTx = (await sdk.bridge.rawTxBuilder.send(
    sendParams,
    web3 as any,
  )) as {
    from?: string;
    to?: string;
    value?: string;
    data?: string;
  };

  const sent = await web3.eth.sendTransaction({
    ...rawTx,
    from: userAddress,
  });

  const txHash = extractTxHash(sent);
  if (!txHash) {
    throw new Error("Allbridge: sendTransaction returned no transaction hash");
  }

  return { txHash };
}

/** Callable surface merged onto {@link ethereumAdapter}. */
export const ethereumBridge = {
  approveAllbridgeDepositIfNeeded,
  sendAllbridgeDeposit,
};

async function assertNetworkConsistency(
  provider: Eip1193Provider,
  stxIsTestnet: boolean,
  toAccountAddress: string,
  sourceChain: ChainSymbol,
) {
  // 1. Get MetaMask's current chainId
  const chainIdHex = (await provider.request({
    method: "eth_chainId",
  })) as string;
  const chainIdDecimal = parseInt(chainIdHex, 16);

  const EVM_MAINNETS = new Set([
    1, // Ethereum
    56, // BSC
    137, // Polygon
    42161, // Arbitrum
    43114, // Avalanche
    10, // Optimism
    8453, // Base
  ]);

  const EVM_TESTNETS = new Set([
    11155111, // Sepolia
    17000, // Holesky
    97, // BSC testnet
    80002, // Amoy (Polygon testnet)
    421614, // Arbitrum Sepolia
    43113, // Fuji (Avalanche testnet)
  ]);

  const mmIsMainnet = EVM_MAINNETS.has(chainIdDecimal);
  const mmIsTestnet = EVM_TESTNETS.has(chainIdDecimal);

  if (!mmIsMainnet && !mmIsTestnet) {
    throw new Error(
      `MetaMask is on an unrecognised network (chainId ${chainIdDecimal}). ` +
        `Please switch to a supported network.`,
    );
  }

  // 2. Check STX address prefix matches stxIsTestnet flag
  const stxPrefix = toAccountAddress.slice(0, 2);
  const expectedStxPrefix = stxIsTestnet ? "ST" : "SP";

  if (stxPrefix !== expectedStxPrefix) {
    throw new Error(
      `STX address prefix "${stxPrefix}" doesn't match stxIsTestnet=${stxIsTestnet}. ` +
        `Expected prefix "${expectedStxPrefix}". ` +
        `Did you mean to use a ${stxIsTestnet ? "testnet (ST...)" : "mainnet (SP...)"} address?`,
    );
  }

  // 3. Cross-check: MetaMask network must agree with Stacks network
  if (mmIsMainnet && stxIsTestnet) {
    throw new Error(
      `Network mismatch: MetaMask is on mainnet (chainId ${chainIdDecimal}) ` +
        `but stxIsTestnet=true and address "${toAccountAddress}" is a testnet address. ` +
        `Either switch MetaMask to a testnet or set stxIsTestnet=false with an SP... address.`,
    );
  }

  if (mmIsTestnet && !stxIsTestnet) {
    throw new Error(
      `Network mismatch: MetaMask is on testnet (chainId ${chainIdDecimal}) ` +
        `but stxIsTestnet=false and address "${toAccountAddress}" is a mainnet address. ` +
        `Either switch MetaMask to mainnet or set stxIsTestnet=true with an ST... address.`,
    );
  }
}
