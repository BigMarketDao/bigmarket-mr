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

  // AllBridge always uses ETH mainnet USDC contract addresses, even when
  // stxIsTestnet=true. The stxIsTestnet flag only affects the Stacks destination
  // chain — the ETH source must always be chainId 1 (Ethereum Mainnet).
  // MetaMask has per-site network pinning, so we call wallet_switchEthereumChain
  // to prompt a switch rather than just throwing a plain error.
  if (!params.sourceChain || params.sourceChain === ChainSymbol.ETH) {
    const chainIdHex = (await provider.request({
      method: "eth_chainId",
    })) as string;
    const chainId = parseInt(chainIdHex, 16);
    const ETH_MAINNET = 1;

    if (chainId !== ETH_MAINNET) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }],
        });
        const newHex = (await provider.request({
          method: "eth_chainId",
        })) as string;
        if (parseInt(newHex, 16) !== ETH_MAINNET) {
          throw new Error("switch did not take effect");
        }
      } catch {
        throw new Error(
          `AllBridge requires Ethereum Mainnet (chainId 1) — even when bridging to Stacks testnet. ` +
            `MetaMask is on chainId ${chainId}. Switch MetaMask to Ethereum Mainnet for this tab and try again.`,
        );
      }
    }
  }

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

  // The Allbridge SDK's prepareApproveParams does NOT convert the human-readable
  // float to integer token units (unlike checkAllowance which does). We must
  // pre-convert here: e.g. "1" USDC with 6 decimals → "1000000".
  // This makes MetaMask show the exact amount ("1 USDC") rather than "Unlimited".
  const amountInt = BigInt(
    Math.round(parseFloat(params.amount) * 10 ** sourceToken.decimals),
  ).toString();

  const approveTx = (await sdk.bridge.rawTxBuilder.approve(web3 as any, {
    token: sourceToken,
    owner: userAddress,
    amount: amountInt,
    messenger,
  })) as {
    from?: string;
    to?: string;
    value?: string;
    data?: string;
  };

  let approveGas: bigint;
  try {
    approveGas = await web3.eth.estimateGas({
      ...approveTx,
      from: userAddress,
    });
  } catch (estimateErr) {
    throw new Error(
      `USDC approval would fail — check wallet connection and token address. ` +
        `Detail: ${estimateErr instanceof Error ? estimateErr.message : String(estimateErr)}`,
    );
  }

  const sent = await web3.eth.sendTransaction({
    ...approveTx,
    from: userAddress,
    gas: (approveGas * 12n) / 10n,
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

  // Estimate gas explicitly so we get a meaningful error if the tx would revert
  // (e.g. missing approval, insufficient USDC balance, wrong network).
  // Without this, a failing eth_estimateGas can produce absurdly large gas values
  // that cause a cryptic "insufficient funds for gas" error.
  let gasEstimate: bigint;
  try {
    gasEstimate = await web3.eth.estimateGas({ ...rawTx, from: userAddress });
  } catch (estimateErr) {
    throw new Error(
      `Bridge deposit would fail on-chain — check USDC approval and balance. ` +
        `Detail: ${estimateErr instanceof Error ? estimateErr.message : String(estimateErr)}`,
    );
  }

  // Add 20 % buffer; typical Allbridge deposit uses 200k–500k gas
  const gas = (gasEstimate * 12n) / 10n;

  const sent = await web3.eth.sendTransaction({
    ...rawTx,
    from: userAddress,
    gas,
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
