/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ResolutionState,
  type Currency,
  type MarketData,
  type PredictionMarketCreateEvent,
  type ScalarMarketDataItem,
  type UserStake,
} from "@bigmarket/bm-types";
import { getCategoryLabel, userStakeSum } from "@bigmarket/bm-utilities";

const PYTH_MULTIPLIER = 100000000;
export const ORACLE_MULTIPLIER = PYTH_MULTIPLIER;

export enum SearchState {
  All = "all",
  Open = "open",
  Resolving = "resolving",
  Disputed = "disputed",
  Pending = "pending",
  Cooling = "cooling",
  Closed = "resolved",
}
import { estimateBitcoinBlockTime } from "./block-time";

export const getMarketStatus = (
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  if (market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN) {
    if (isCooling(currentHeight, market)) return "cooling";
    if (isPostCooling(currentHeight, market)) return "pending";
    return "open";
  } else if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVING
  ) {
    return "resolving";
  } else if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVED
  ) {
    return "resolved";
  } else if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_DISPUTED
  ) {
    return "disputed";
  }
  return false;
};

export const hasUserStaked = (userStake: UserStake | undefined) => {
  if (userStake) {
    return userStakeSum(userStake) > 0;
  }
  return false;
};

export const canUserClaim = (outcome: number, stakes: number[]) => {
  if (stakes.length > 0) {
    return stakes[outcome] > 0;
  }
  return false;
};

export const getFungibleTokenName = (tokenContract: string) => {
  if (tokenContract.indexOf("governance-token") > -1) {
    return "bmg-token";
  } else if (tokenContract.indexOf("pepe") > -1) {
    return "pepe-token";
  } else if (tokenContract.indexOf("usdh") > -1) {
    return "usdh-token";
  } else if (tokenContract.indexOf("sbtc") > -1) {
    return "sbtc-token";
  } else if (tokenContract.indexOf("wrapped-stx") > -1) {
    return "stx";
    // } else if (sip10Data.symbol.toLowerCase().indexOf('bigr') > -1) {
    // 	return 'bigr-token';
  } else if (tokenContract.indexOf("play") > -1) {
    return "bmg-play";
  }
  return "bigr-token";
};

// export const claimWinnings = async (
//   extension: string,
//   marketData: MarketData,
//   marketId: number,
//   sip10Data: Sip10Data,
//   userStake: UserStake,
// ) => {
//   if (typeof window === "undefined") return;
//   const tokenName = getFungibleTokenName(marketData.token);
//   const staked = userStake?.stakes[marketData.outcome!] || 0;
//   const princ = Math.floor((10000 * staked) / 9800);
//   const devFee = princ - staked;
//   const totalPool = totalPoolSum(marketData.stakes);
//   const winningPool = marketData.stakes[marketData.outcome!];
//   const { grossRefund, marketFee, netAmount } = getWinningClaimAmounts(
//     marketData,
//     userStake,
//   );

//   const amountCV = uintCV(grossRefund); // Clarity uint

//   const contractAddress = extension.split(".")[0];
//   const contractName = extension.split(".")[1];
//   const functionName = "claim-winnings";
//   let postConditions: Array<PostCondition> = []; //await getSip10PostConditions(CLAIMING_TIER, marketData.token, getStxAddress(), Number(netAmount));
//   const bigrPostConditionNFt = await getBigRPostConditionNft(
//     CLAIMING_TIER,
//     getStxAddress(),
//   );
//   if (bigrPostConditionNFt) postConditions.push(bigrPostConditionNFt);

//   if (!isSTX(marketData.token)) {
//     const formattedToken = (marketData.token.split(".")[0] +
//       "." +
//       marketData.token.split(".")[1]) as `${string}.${string}`;
//     const postConditionFt = Pc.principal(`${contractAddress}.${contractName}`)
//       .willSendLte(grossRefund)
//       .ft(formattedToken, tokenName);

//     postConditions.push(postConditionFt);
//   } else {
//     postConditions.push(
//       Pc.principal(`${contractAddress}.${contractName}`)
//         .willSendLte(grossRefund)
//         .ustx(),
//     );
//   }
//   // if (!isSTX(marketData.token)) {
//   // 	const tokenEvent: TokenPermissionEvent = getTokenPermissionEvent(marketData.token);
//   // 	const formattedToken = (tokenEvent.token.split('.')[0] + '.' + tokenEvent.token.split('.')[1]) as `${string}.${string}`;
//   // 	const tokenName = getFungibleTokenName(marketData.token);
//   // 	const postConditionFt = Pc.principal(getStxAddress()).willSendLte(netAmount).ft(formattedToken, tokenName);
//   // 	postConditions.push(postConditionFt);
//   // } else {
//   // 	postConditions.push(Pc.principal(getStxAddress()).willSendLte(netAmount).ustx());
//   // }

//   // let postConditionMode = PostConditionMode.Deny;
//   // if (!marketFee || !netAmount) {
//   // 	postConditionMode = PostConditionMode.Allow;
//   // 	//postConditions: Array<PostCondition> = [];
//   // }
//   const functionArgs = [Cl.uint(marketId), Cl.principal(marketData.token)];
//   const response = await requestWallet(
//     `${contractAddress}.${contractName}`,
//     functionName,
//     functionArgs,
//     postConditions,
//     "deny",
//   );
//   if (response?.txid) {
//     showTxModal(response.txid);
//     watchTransaction(response.txid);
//     return response.txid;
//   } else {
//     showTxModal("Unable to process right now");
//   }
// };

export const getWinningClaimAmounts = (
  marketData: MarketData,
  userStake: UserStake,
) => {
  const staked = userStake?.stakes[marketData.outcome!] || 0;
  //const princ = Math.floor((10000 * staked) / 9800);
  // const { grossRefund, marketFee, netAmount } = computePayout({
  // 	staked: BigInt(userStake?.stakes[marketData.outcome!] || 0),
  // 	totalPool: BigInt(totalPoolSum(marketData.stakes)),
  // 	winningPool: BigInt(marketData.stakes[marketData.outcome!]),
  // 	marketFeeBips: BigInt(marketData.marketFeeBips ?? 25)
  // });
  const { grossRefund, marketFee, netAmount } = computePayout({
    userShares: BigInt(userStake.stakes[marketData.outcome!] ?? 0),
    totalTokenPool: BigInt(
      marketData.stakeTokens.reduce((sum, v) => sum + BigInt(v), 0n),
    ),
    winningPool: BigInt(marketData.stakes[marketData.outcome!]),
    marketFeeBips: BigInt(marketData.marketFeeBips),
  });
  return { grossRefund, marketFee, netAmount };
};

const MICRO = 1_000_000n;

// If your inputs are already in micro units, use them directly.
// If you have human-readable decimals, convert first with `toMicro6`.
export function toMicro6(x: string | number | bigint): bigint {
  if (typeof x === "bigint") return x;
  const s = typeof x === "number" ? x.toString() : x;
  const [i, f = ""] = (s as string).split(".");
  const frac = (f + "000000").slice(0, 6);
  return BigInt(i || "0") * MICRO + BigInt(frac);
}

type CalcInput = {
  staked: bigint; // user's stake (µSTX)
  totalPool: bigint; // total token pool (µSTX)
  winningPool: bigint; // winning side pool (µSTX)
  marketFeeBips: bigint; // e.g. 25n = 0.25%
};
// export function computePayout({ staked, totalPool, winningPool, marketFeeBips }: CalcInput) {
// 	if (winningPool === 0n) {
// 		return { grossRefund: 0n, marketFee: 0n, netAmount: 0n };
// 	}
// 	// correct formula: staked * totalPool / winningPool
// 	const grossRefund = (staked * totalPool) / winningPool;
// 	const marketFee = (grossRefund * marketFeeBips) / 10_000n;
// 	const netAmount = grossRefund - marketFee;
// 	return { grossRefund, marketFee, netAmount };
// }
export function computePayout({
  userShares,
  totalTokenPool,
  winningPool,
  marketFeeBips,
}: {
  userShares: bigint;
  totalTokenPool: bigint;
  winningPool: bigint;
  marketFeeBips: bigint;
}) {
  if (winningPool === 0n) {
    return { grossRefund: 0n, marketFee: 0n, netAmount: 0n };
  }

  const grossRefund = (userShares * totalTokenPool) / winningPool;
  const marketFee = (grossRefund * marketFeeBips) / 10_000n;
  const netAmount = grossRefund - marketFee;

  return { grossRefund, marketFee, netAmount };
}

export const blocksLeftForDispute = (
  resWindow: number,
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  if (market.marketType === 3) {
    const resBurnHeight = market.marketData.resolutionBurnHeight || 0;
    return resBurnHeight + resWindow - currentHeight;
  } else if (market.marketType === 1 || market.marketType === 2) {
    const start = market.marketData.marketStart || 0;
    let end = start + (market.marketData.marketDuration || 0);
    if (market.marketData?.resolutionState > 0)
      end = market.marketData?.resolutionBurnHeight || end;
    const endCooling = end + (market.marketData.coolDownPeriod || 0);
    return endCooling + resWindow - currentHeight;
  }
  return 0;
};

export const coolDownBlock = (market: PredictionMarketCreateEvent) => {
  const start = market.marketData.marketStart || 0;
  let end = start + (market.marketData.marketDuration || 0);
  if (market.marketData?.resolutionState > 0)
    end = market.marketData?.resolutionBurnHeight || end;
  const endCooling = end + (market.marketData.coolDownPeriod || 0);
  return endCooling;
};
// export const dateOfResolution = (market: PredictionMarketCreateEvent) => {
// 	const sess = getSession();
// 	const current = sess.stacksInfo.burn_block_height;
// 	const startOnChain = market.marketData.marketStart || current;
// 	const closeOnChain = market.marketData.marketStart || current + (market.marketData.marketDuration || 0);
// 	const resolvesOnChain = coolDownBlock(market);
// 	return {
// 		startOnChain,
// 		startOffChain: estimateBitcoinBlockTime(startOnChain, current),
// 		closeOnChain,
// 		closeOffChain: estimateBitcoinBlockTime(closeOnChain, current),
// 		resolvesOnChain,
// 		resolvesOffChain: estimateBitcoinBlockTime(resolvesOnChain, current)
// 	};
// };
export const dateOfResolution = (
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  const startOnChain = market.marketData.marketStart || currentHeight;
  const closeOnChain =
    market.marketData.marketStart ||
    currentHeight + (market.marketData.marketDuration || 0);
  const resolvesOnChain = coolDownBlock(market);

  // --- NEW logic ---
  // Convert block difference into ms
  const blocksRemaining = resolvesOnChain - currentHeight;
  if (blocksRemaining <= 0) {
    return null; // already passed
  }

  // 1 block = 10 min
  const totalMinutes = blocksRemaining * 10;
  const totalMs = totalMinutes * 60 * 1000;
  const now = new Date();
  const targetDate = new Date(now.getTime() + totalMs);

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let humanReadable: string;
  if (days >= 2) {
    // just show the actual date
    humanReadable = targetDate.toLocaleString();
  } else if (days >= 1 || hours >= 12) {
    // less than 2 days but more than 12 hours
    humanReadable = `${days > 0 ? days + "d " : ""}${hours}h`;
  } else {
    // less than 12 hours
    humanReadable = `${hours}h ${minutes}m`;
  }

  return {
    startOnChain,
    startOffChain: estimateBitcoinBlockTime(startOnChain, currentHeight),
    closeOnChain,
    closeOffChain: estimateBitcoinBlockTime(closeOnChain, currentHeight),
    resolvesOnChain,
    resolvesOffChain: estimateBitcoinBlockTime(resolvesOnChain, currentHeight),
    humanReadable,
  };
};

export const stopBlockForDispute = (market: PredictionMarketCreateEvent) => {
  const startBlock = startBlockForDispute(market);
  return startBlock + (market.marketData?.coolDownPeriod || 144);
};

export const startBlockForDispute = (market: PredictionMarketCreateEvent) => {
  return (
    market.marketData.resolutionBurnHeight ||
    (market.marketData.marketStart || 0) +
      (market.marketData.marketDuration || 0)
  );
};

export const isDisputable = (
  currentHeight: number,
  resolutionWindow: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVING
  ) {
    if (market.marketType === 3) {
      const resBurnHeight = market.marketData.resolutionBurnHeight || 0;
      return currentHeight < resBurnHeight + resolutionWindow;
    } else if (market.marketType === 1 || market.marketType === 2) {
      const endCooling = coolDownBlock(market);
      return currentHeight < endCooling + resolutionWindow;
    }
  }
  return false;
};

export const isResolvable = (
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  if (market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN) {
    const endCooling = coolDownBlock(market);
    return currentHeight >= endCooling;
  }
  return false;
};

export const isFinalisable = (
  currentHeight: number,
  resolutionWindow: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVING
  ) {
    if (market.marketType === 3) {
      const resBurnHeight = market.marketData.resolutionBurnHeight || 0;
      return currentHeight >= resBurnHeight + resolutionWindow;
    } else if (market.marketType === 1 || market.marketType === 2) {
      const resBurnHeight = market.marketData.resolutionBurnHeight || 0;
      return currentHeight >= resBurnHeight + resolutionWindow;
    }
  }
  return false;
};

export const isDisputeRunning = (market: PredictionMarketCreateEvent) => {
  if (!market.marketData) return false;
  if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_DISPUTED
  ) {
    return true;
  }
  return false;
};

export const isStaking = (
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  if (market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN) {
    if (market.marketType == 3) return true;
    else {
      const start = market.marketData.marketStart || 0;
      let end = start + (market.marketData.marketDuration || 0);
      if (market.marketData?.resolutionState > 0)
        end = market.marketData?.resolutionBurnHeight || end;
      return currentHeight <= end;
    }
  }
  return false;
};

export const isResolving = (market: PredictionMarketCreateEvent) => {
  if (!market.marketData) return false;
  return (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVING
  );
};

export const getResolutionMessage = (
  currentHeight: number,
  resolutionWindow: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return "market state unknown";
  const state = market.marketData.resolutionState;
  if (state === ResolutionState.RESOLUTION_RESOLVING) {
    if (isResolving(market)) return "dispute window open";
    else return "awaiting closure";
  } else if (state === ResolutionState.RESOLUTION_OPEN) {
    if (isCooling(currentHeight, market)) return "market is cooling";
    else if (isPostCooling(currentHeight, market))
      return "market is awaiting resolution";
    else return "market is open";
  } else if (state === ResolutionState.RESOLUTION_RESOLVED) {
    return "market is resolved";
  } else if (state === ResolutionState.RESOLUTION_DISPUTED) {
    if (isFinalisable(currentHeight, resolutionWindow, market))
      return "voting window closed";
    return "voting window open";
  } else {
    return "market state unknown";
  }
};
export const isRunningAtBlock = (
  burnBlock: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  const open =
    market.marketData?.resolutionState === ResolutionState.RESOLUTION_OPEN;
  const start = market.marketData.marketStart || 0;
  let end = start + (market.marketData.marketDuration || 0);
  if (market.marketData?.resolutionState > 0)
    end = market.marketData?.resolutionBurnHeight || end;
  return open && burnBlock < end;
};

export const isRunning = (
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  const open =
    market.marketData?.resolutionState === ResolutionState.RESOLUTION_OPEN;
  const start = market.marketData.marketStart || 0;
  let end = start + (market.marketData.marketDuration || 0);
  if (market.marketData?.resolutionState > 0)
    end = market.marketData?.resolutionBurnHeight || end;
  return open && currentHeight < end;
};

export const isResolved = (market: PredictionMarketCreateEvent) => {
  if (!market.marketData) return false;
  return (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVED
  );
};

export const isCooling = (
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  if (market.marketData?.resolutionState > ResolutionState.RESOLUTION_OPEN)
    return false;
  const start = market.marketData.marketStart || 0;
  let end = start + (market.marketData.marketDuration || 0);
  if (market.marketData?.resolutionState > ResolutionState.RESOLUTION_OPEN)
    end = market.marketData?.resolutionBurnHeight || end;
  const endCooling = end + (market.marketData.coolDownPeriod || 0);
  return currentHeight > end && currentHeight <= endCooling;
};

export const isPostCooling = (
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  if (!market.marketData) return false;
  const endCooling = coolDownBlock(market);
  return (
    currentHeight > endCooling &&
    market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN
  );
};

export const getOutcomeMessage = (
  currentHeight: number,
  selectedCurrency: Currency,
  market: PredictionMarketCreateEvent,
) => {
  try {
    const mStatus = getMarketStatus(currentHeight, market);
    if (getMarketStatus(currentHeight, market) !== "resolved") {
      return mStatus;
    } else {
      if (market.marketType === 1) {
        return `Outcome: <span class="">${market.marketData.categories[market.marketData.outcome!]}</span>`;
      }
      const cats = market.marketData.categories as ScalarMarketDataItem[];
      return `Outcome: ${market.marketData.outcome!}<br/><span class="">${getCategoryLabel(selectedCurrency, market.marketData.outcome!, market.marketData)}</span>`;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return err.message;
  }
};
export const getOutcomeMessageSimple = (
  selectedCurrency: Currency,
  disputeWindowLength: number,
  marketVotingDuration: number,
  currentHeight: number,
  market: PredictionMarketCreateEvent,
) => {
  try {
    const endOfCooling =
      (market.marketData?.marketStart || 0) +
      (market.marketData?.marketDuration || 0) +
      (market.marketData?.coolDownPeriod || 0);
    const endOfResolving =
      (endOfCooling || 0) + (disputeWindowLength || 0) - currentHeight;
    const endOfVoting =
      (market.marketData?.resolutionBurnHeight || 0) +
      (marketVotingDuration || 0);
    const status = getMarketStatus(currentHeight, market);
    let message = "";
    if (status === "cooling") {
      message = "Market is cooling";
    } else if (status === "pending") {
      message = "Market requries resolution";
    } else if (status === "resolving") {
      message = `Market is resolving. <br/>Claims open in ${endOfResolving} blocks`;
    } else if (status === "resolved") {
      message = "Market is resolved - claims are open";
    } else if (status === "disputed") {
      message = `Market is disputed. <br/>Voting open for ${endOfVoting} blocks`;
    } else {
      message = "Market state undetermined";
    }
    return message;
  } catch (err: any) {
    return err.message;
  }
};
export const getOutcomeMessageOneWord = (
  currentHeight: number,
  disputeWindowLength: number,
  marketVotingDuration: number,
  market: PredictionMarketCreateEvent,
) => {
  try {
    const endOfCooling =
      (market.marketData?.marketStart || 0) +
      (market.marketData?.marketDuration || 0) +
      (market.marketData?.coolDownPeriod || 0);
    const endOfResolving =
      (endOfCooling || 0) + (disputeWindowLength || 0) - currentHeight;
    const endOfVoting =
      (market.marketData?.resolutionBurnHeight || 0) +
      (marketVotingDuration || 0);
    const status = getMarketStatus(currentHeight, market);
    let message = "";
    if (status === "open") {
      message = "Running";
    } else if (status === "cooling") {
      message = "Cooling";
    } else if (status === "pending") {
      message = "Resolving";
    } else if (status === "resolving") {
      message = `Resolving`;
    } else if (status === "resolved") {
      message = "Resolved";
    } else if (status === "disputed") {
      message = `Disputed`;
    } else {
      message = "Closed";
    }
    return message;
  } catch (err: any) {
    return err.message;
  }
};
export const getEndBlockNextPhase = (
  currentHeight: number,
  disputeWindow: number,
  market: PredictionMarketCreateEvent,
): any => {
  if (!market.marketData) return -1;
  if (market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN) {
    if (isCooling(currentHeight, market))
      return (
        (market.marketData.marketStart || 0) +
        (market.marketData.marketDuration || 0)
      );
    if (isPostCooling(currentHeight, market))
      return (
        (market.marketData.marketStart || 0) +
        (market.marketData.marketDuration || 0) +
        (market.marketData.coolDownPeriod || 0)
      );
    return (
      (market.marketData.marketStart || 0) +
      (market.marketData.marketDuration || 0)
    );
  } else if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVING
  ) {
    return (market.marketData.resolutionBurnHeight || 0) + disputeWindow;
  } else if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_DISPUTED
  ) {
    return (market.marketData.resolutionBurnHeight || 0) + disputeWindow;
  } else if (
    market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVED
  ) {
    return -1;
  }
};
