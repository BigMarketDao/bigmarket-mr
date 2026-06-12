import {
  AllbridgeCoreSdk,
  ChainSymbol,
  FeePaymentMethod,
  Messenger,
  nodeRpcUrlsDefault,
  mainnet,
  type SendParams,
  type TokenWithChainDetails,
} from "@allbridge/bridge-core-sdk";
import type { Eip1193Provider } from "@bigmarket/bm-types";
import { createAddress, parseContractId } from "@stacks/transactions";
import { Web3 } from "web3";
import { getMetaMask } from "./injected.js";

/** ERC-20 `approve(address,uint256)`. */
const ERC20_APPROVE_SELECTOR = "0x095ea7b3";
/** AllBridge Core `swapAndBridge(...)`. */
const SWAP_AND_BRIDGE_SELECTOR = "0x4cd480bd";
const MAX_ERC20_APPROVAL = (1n << 256n) - 1n;

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
  if (messenger !== Messenger.ALLBRIDGE) {
    throw new Error(
      `Only Messenger.ALLBRIDGE is supported for vault deposits (got ${messenger})`,
    );
  }

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

function assertSafeTx(
  tx: {
    to?: string;
    value?: string | bigint | number;
    data?: string;
  },
  context: string,
) {
  const to = tx.to?.toLowerCase();
  const data = tx.data ?? "0x";
  const value = BigInt(tx.value ?? 0);

  // Never allow plain ETH sends unless explicitly expected.
  if (data === "0x" && value > 0n) {
    throw new Error(
      `[${context}] Refusing plain ETH transfer to ${to} value=${value}`,
    );
  }
}

function readCalldataWord(data: string, wordIndex: number): string {
  const body = data.startsWith("0x") ? data.slice(2) : data;
  const start = 8 + wordIndex * 64;
  const end = start + 64;
  if (body.length < end) {
    throw new Error(`Calldata too short for ABI word ${wordIndex}`);
  }
  return `0x${body.slice(start, end)}`;
}

function readAbiAddress(word: string): string {
  return `0x${word.slice(-40)}`.toLowerCase();
}

function readAbiUint256(word: string): bigint {
  return BigInt(word);
}

function evmAddressToBytes32(address: string): string {
  const hex = address.toLowerCase().replace(/^0x/, "");
  return `0x${hex.padStart(64, "0")}`.toLowerCase();
}

/** Match AllBridge SDK encoding for Stacks principals on EVM bridge calldata. */
function encodeAllbridgeStxBytes32(address: string, web3: Web3): string {
  if (address.includes(".")) {
    const [addr, name] = parseContractId(
      address as `${string}.${string}`,
    );
    const hashBytes = Buffer.from(createAddress(addr).hash160, "hex");
    const hash = web3.utils.keccak256(
      Buffer.concat([hashBytes, Buffer.from(name)]),
    );
    return hash.toLowerCase();
  }
  const hashBytes = Buffer.from(createAddress(address).hash160, "hex");
  const padded = Buffer.alloc(32, 0);
  hashBytes.copy(padded, 32 - hashBytes.length);
  return `0x${padded.toString("hex")}`.toLowerCase();
}

function assertAllbridgeApproveTx(
  approveTx: { to?: string; value?: string; data?: string },
  sourceToken: TokenWithChainDetails,
  amountInt: string,
) {
  if (approveTx.to?.toLowerCase() !== sourceToken.tokenAddress.toLowerCase()) {
    throw new Error("Approval tx target is not source token contract");
  }

  if (BigInt(approveTx.value ?? 0) !== 0n) {
    throw new Error("Approval tx unexpectedly sends ETH");
  }

  const data = approveTx.data ?? "0x";
  if (!data.startsWith(ERC20_APPROVE_SELECTOR)) {
    throw new Error(
      `Approval tx is not ERC-20 approve (selector ${data.slice(0, 10)})`,
    );
  }

  const spender = readAbiAddress(readCalldataWord(data, 0));
  const expectedSpender = sourceToken.bridgeAddress.toLowerCase();
  if (spender !== expectedSpender) {
    throw new Error(
      `Approval spender ${spender} is not AllBridge bridge ${expectedSpender}`,
    );
  }

  const approvedAmount = readAbiUint256(readCalldataWord(data, 1));
  if (approvedAmount === MAX_ERC20_APPROVAL) {
    throw new Error("Refusing unlimited ERC-20 approval");
  }
  if (approvedAmount !== BigInt(amountInt)) {
    throw new Error(
      `Approval amount ${approvedAmount} does not match requested ${amountInt}`,
    );
  }
}

function assertAllbridgeSendTx(
  rawTx: { to?: string; value?: string; data?: string },
  opts: {
    web3: Web3;
    sourceToken: TokenWithChainDetails;
    destinationToken: TokenWithChainDetails;
    toAccountAddress: string;
    amountMicro: bigint;
    messenger: Messenger;
  },
) {
  const bridgeAddress = opts.sourceToken.bridgeAddress.toLowerCase();
  if (rawTx.to?.toLowerCase() !== bridgeAddress) {
    throw new Error(
      `Unexpected AllBridge target: ${rawTx.to} (expected ${bridgeAddress})`,
    );
  }

  if (BigInt(rawTx.value ?? 0) !== 0n) {
    throw new Error(
      "Bridge tx unexpectedly sends ETH — fees must be paid in stablecoin",
    );
  }

  const data = rawTx.data ?? "0x";
  if (data === "0x") {
    throw new Error("Bridge tx has no calldata");
  }
  if (!data.startsWith(SWAP_AND_BRIDGE_SELECTOR)) {
    throw new Error(
      `Unexpected AllBridge method selector: ${data.slice(0, 10)}`,
    );
  }

  const tokenWord = readCalldataWord(data, 0).toLowerCase();
  const expectedToken = evmAddressToBytes32(opts.sourceToken.tokenAddress);
  if (tokenWord !== expectedToken) {
    throw new Error(
      `Bridge source token mismatch (calldata ${tokenWord}, expected ${expectedToken})`,
    );
  }

  const amount = readAbiUint256(readCalldataWord(data, 1));
  if (amount !== opts.amountMicro) {
    throw new Error(
      `Bridge amount ${amount} does not match requested ${opts.amountMicro}`,
    );
  }

  const recipientWord = readCalldataWord(data, 2).toLowerCase();
  const expectedRecipient = encodeAllbridgeStxBytes32(
    opts.toAccountAddress,
    opts.web3,
  );
  if (recipientWord !== expectedRecipient) {
    throw new Error(
      `Bridge recipient mismatch (calldata ${recipientWord}, expected ${expectedRecipient} for ${opts.toAccountAddress})`,
    );
  }

  const destinationChainId = readAbiUint256(readCalldataWord(data, 3));
  if (destinationChainId !== BigInt(opts.destinationToken.allbridgeChainId)) {
    throw new Error(
      `Bridge destination chain ${destinationChainId} does not match ${opts.destinationToken.allbridgeChainId}`,
    );
  }

  const receiveTokenWord = readCalldataWord(data, 4).toLowerCase();
  const expectedReceiveToken = encodeAllbridgeStxBytes32(
    opts.destinationToken.tokenAddress,
    opts.web3,
  );
  if (receiveTokenWord !== expectedReceiveToken) {
    throw new Error(
      `Bridge receive token mismatch (calldata ${receiveTokenWord}, expected ${expectedReceiveToken})`,
    );
  }

  const messengerId = readAbiUint256(readCalldataWord(data, 6));
  if (messengerId !== 1n) {
    throw new Error(
      `Bridge messenger ${messengerId} is not Messenger.ALLBRIDGE (1)`,
    );
  }

  const feeTokenAmount = readAbiUint256(readCalldataWord(data, 7));
  if (feeTokenAmount <= 0n || feeTokenAmount >= amount) {
    throw new Error(
      `Bridge fee ${feeTokenAmount} is invalid for amount ${amount}`,
    );
  }
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
  assertSafeTx(approveTx, "allbridge-approve");
  assertAllbridgeApproveTx(approveTx, sourceToken, amountInt);
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

  const amountMicro = BigInt(
    Math.round(parseFloat(params.amount) * 10 ** sourceToken.decimals),
  );

  const sendParams: SendParams = {
    amount: params.amount,
    fromAccountAddress: userAddress,
    toAccountAddress: params.toAccountAddress,
    sourceToken,
    destinationToken,
    messenger,
    gasFeePaymentMethod: FeePaymentMethod.WITH_STABLECOIN,
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
  assertSafeTx(rawTx, "allbridge-send");
  assertAllbridgeSendTx(rawTx, {
    web3,
    sourceToken,
    destinationToken,
    toAccountAddress: params.toAccountAddress,
    amountMicro,
    messenger,
  });

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
