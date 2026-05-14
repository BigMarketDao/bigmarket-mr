import {
  AllbridgeCoreSdk,
  ChainSymbol,
  Messenger,
  nodeRpcUrlsDefault,
  mainnet,
  type SendParams,
  type TokenWithChainDetails,
} from "@allbridge/bridge-core-sdk";
import { bytesToHex } from "@stacks/common";

export type SendAllbridgeWithdrawParams = {
  /** Token amount to send (Allbridge float string). */
  amount: string;
  /** Stacks principal (SP… / ST…) that holds USDCx / USDTx. */
  fromAccountAddress: string;
  /** Ethereum 0x address that receives USDC / USDT. */
  toAccountAddress: string;
  /** Default `ChainSymbol.STX`. */
  sourceChain?: ChainSymbol;
  /** Default `ChainSymbol.ETH`. */
  destinationChain?: ChainSymbol;
  /** Source SIP-010 symbol on Stacks; default USDCx. */
  tokenSymbol?: string;
  /** Destination ERC-20 symbol; default USDC. */
  tokenSymbolDestination?: string;
  messenger?: Messenger;
  /** When true, use Allbridge core params for Stacks testnet. */
  stxIsTestnet?: boolean;
  /** Overrides default Hiro API base (`nodeRpcUrlsDefault.STX`). */
  stxRpcUrl?: string;
  stxHeroApiKey?: string;
};

type AllbridgeWithdrawContext = {
  sdk: AllbridgeCoreSdk;
  sourceToken: TokenWithChainDetails;
  destinationToken: TokenWithChainDetails;
  messenger: Messenger;
};

function encodeStacksTxHex(raw: unknown): string {
  if (typeof raw === "string") {
    const hexBody = raw.startsWith("0x") ? raw.slice(2) : raw;
    if (!/^[0-9a-fA-F]+$/.test(hexBody)) {
      throw new Error(
        "Allbridge withdraw: transaction string is not hex (unexpected encoding)",
      );
    }
    return `0x${hexBody}`;
  }
  if (raw instanceof Uint8Array) {
    return `0x${bytesToHex(raw)}`;
  }
  throw new Error("Allbridge withdraw: unsupported raw transaction type");
}

async function loadAllbridgeWithdrawContext(
  params: SendAllbridgeWithdrawParams,
): Promise<AllbridgeWithdrawContext> {
  const nodeUrls = {
    ...nodeRpcUrlsDefault,
    ...(params.stxRpcUrl ? { STX: params.stxRpcUrl } : {}),
  };

  const sdkBaseParams = {
    ...mainnet,
    ...(params.stxHeroApiKey
      ? { stxHeroApiKey: params.stxHeroApiKey }
      : {}),
  };

  const sdk =
    params.stxIsTestnet === true
      ? new AllbridgeCoreSdk(nodeUrls, {
          ...sdkBaseParams,
          stxIsTestnet: true,
        })
      : new AllbridgeCoreSdk(nodeUrls, sdkBaseParams);

  const chains = await sdk.chainDetailsMap();

  const sourceChainSym = params.sourceChain ?? ChainSymbol.STX;
  const destChainSym = params.destinationChain ?? ChainSymbol.ETH;
  const sourceChain = chains[sourceChainSym];
  const destChain = chains[destChainSym];

  if (!sourceChain?.tokens || !destChain?.tokens) {
    throw new Error(
      `Allbridge: missing chain metadata for ${sourceChainSym} → ${destChainSym}`,
    );
  }

  const tokenSymbol = params.tokenSymbol ?? "USDCx";
  const destSymbol = params.tokenSymbolDestination ?? "USDC";
  const sourceToken = sourceChain.tokens.find((t) => t.symbol === tokenSymbol);
  const destinationToken = destChain.tokens.find(
    (t) => t.symbol === destSymbol,
  );

  if (!sourceToken || !destinationToken) {
    throw new Error(
      `Allbridge: token "${tokenSymbol}" or destination "${destSymbol}" not found on ${sourceChainSym} or ${destChainSym}`,
    );
  }

  const messenger = params.messenger ?? Messenger.ALLBRIDGE;

  return { sdk, sourceToken, destinationToken, messenger };
}

function assertWithdrawAddresses(params: SendAllbridgeWithdrawParams) {
  const stxPrefix = params.fromAccountAddress.slice(0, 2);
  const expectedStxPrefix = params.stxIsTestnet ? "ST" : "SP";
  if (stxPrefix !== expectedStxPrefix) {
    throw new Error(
      `Stacks address prefix "${stxPrefix}" does not match stxIsTestnet=${Boolean(
        params.stxIsTestnet,
      )} (expected "${expectedStxPrefix}…").`,
    );
  }

  const eth = params.toAccountAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(eth)) {
    throw new Error(
      "Recipient must be a valid Ethereum address (0x + 40 hex chars).",
    );
  }
}

/**
 * SIP-010 transfers use post-conditions; Allbridge does not use a separate Stacks “approve” tx.
 */
export async function approveAllbridgeWithdrawIfNeeded(
  _params: SendAllbridgeWithdrawParams,
): Promise<{ alreadyApproved: true }> {
  return { alreadyApproved: true };
}

/**
 * Build an unsigned Stacks bridge transaction via Allbridge, then sign and broadcast with the
 * connected Stacks wallet (`stx_signTransaction`).
 */
export async function sendAllbridgeWithdraw(
  params: SendAllbridgeWithdrawParams,
): Promise<{ txHash: string }> {
  assertWithdrawAddresses(params);

  const { sdk, sourceToken, destinationToken, messenger } =
    await loadAllbridgeWithdrawContext(params);

  const sendParams: SendParams = {
    amount: params.amount,
    fromAccountAddress: params.fromAccountAddress.trim(),
    toAccountAddress: params.toAccountAddress.trim(),
    sourceToken,
    destinationToken,
    messenger,
  };

  const rawTx = await sdk.bridge.rawTxBuilder.send(sendParams);
  const txHex = encodeStacksTxHex(rawTx);

  const { request } = await import("@stacks/connect");
  const res = await request("stx_signTransaction", {
    transaction: txHex,
    broadcast: true,
  });

  const txid = res.txid;
  if (typeof txid !== "string" || txid.length === 0) {
    throw new Error(
      "Allbridge withdraw: wallet did not return a txid (broadcast may have failed)",
    );
  }

  return { txHash: txid };
}
