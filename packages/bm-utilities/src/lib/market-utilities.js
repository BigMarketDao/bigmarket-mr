import { formatUnits } from "viem";
import { fmtMicroToStxNumber, fmtStxMicro } from "./format.js";
import { convertCryptoToFiatNumber } from "./conversion.js";
export const CLAIMING_TIER = 1;
export const LIQUIDITY_TIER = 4;
export const STAKING_TIER = -1; // removed due to sybil
export const CREATE_MARKET_TIER = 2;
export const MARKET_VOTE_TIER = -1; // removed due to sybil
export const RECLAIM_VOTES_TIER = 12;
export const STXUSD = "0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17";
export const BTCUSD = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
export const SOLUSD = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
export const ETHUSD = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
export const SUIUSD = "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";
export const TONUSD = "0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026";
export const DECIMALS_BY_FEED = {
    [BTCUSD]: 16,
    // If you *really* need per-feed scaling:
    [STXUSD]: 16,
    [SOLUSD]: 16,
    [SUIUSD]: 16,
    [ETHUSD]: 16,
    [TONUSD]: 16,
};
const currencyToLocale = {
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    JPY: "ja-JP",
    AUD: "en-AU",
    CAD: "en-CA",
    CHF: "de-CH",
    CNY: "zh-CN",
    INR: "en-IN",
    // add more as needed
};
export function formatFiat(selectedCurrency, raw, bare) {
    const value = raw;
    const c = selectedCurrency;
    const locale = currencyToLocale[c.code] || "en-US";
    if (bare) {
        return value.toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
    else {
        return value.toLocaleString(locale, {
            style: "currency",
            currency: c.code,
            currencyDisplay: "code", // shows "USD 1,234.56"
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
}
export function fmtFiatFromRaw(selectedCurrency, raw, decimals) {
    const s = formatUnits(raw, decimals); // exact string
    const n = Number(s); // ok for display
    return formatFiat(selectedCurrency, n);
}
export function totalPoolSum(stakes) {
    if (!Array.isArray(stakes) || stakes.length === 0)
        return 0;
    return stakes.reduce((sum, value) => sum + value, 0);
}
export function userStakeSum(userStake) {
    try {
        return userStake && userStake.stakes
            ? userStake?.stakes.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
            : 0;
    }
    catch (err) {
        return 0;
    }
}
const defToken = {
    symbol: "BIG",
    name: "BitcoinDAO Governance Token",
    decimals: 6,
    balance: 0,
    tokenUri: "",
    totalSupply: 0,
};
export function getMarketToken(tokenContract, tokens) {
    const token = tokens.find((t) => t.token === tokenContract);
    return token?.sip10Data || defToken;
}
export function isSTX(token) {
    return token.toLowerCase().indexOf("stx") > -1;
}
export function getGovernanceToken(daoDeployer, governanceToken, tokens) {
    const token = tokens.find((t) => t.token === `${daoDeployer}.${governanceToken}`);
    return token?.sip10Data || defToken;
}
export function validatePurchaseAgainstMax({ index, totalCost, feeBips, slippage }, marketData, decimals = 6) {
    const BIPS = 10000;
    const slippageBips = Math.floor(slippage * BIPS);
    const fee = Math.floor((totalCost * feeBips) / BIPS);
    const netCost = totalCost - fee;
    const idealShares = cpmmSharesForCost(marketData, netCost, index);
    const minShares = Math.floor(idealShares * ((BIPS - slippageBips) / BIPS));
    const maxSpend = estimateMaxSpendIncludingFee(marketData, index, feeBips, decimals);
    const idealSharesAtMaxSpend = cpmmSharesForCost(marketData, maxSpend.maxSpendNet, index);
    const minSharesAtMaxSpend = Math.floor(idealSharesAtMaxSpend * ((BIPS - slippageBips) / BIPS));
    if (totalCost > maxSpend.maxSpendIncludingFee) {
        return {
            willFail: true,
            reason: `Overbuy: trying to spend ${fmtMicroToStxNumber(totalCost)}, max allowed is ${fmtMicroToStxNumber(maxSpend.maxSpendIncludingFee)} - refresh the page and try again`,
            idealShares,
            minShares,
            maxSpendIncludingFee: maxSpend.maxSpendIncludingFee,
            idealSharesAtMaxSpend,
            minSharesAtMaxSpend,
        };
    }
    return {
        willFail: false,
        idealShares,
        minShares,
        maxSpendIncludingFee: maxSpend.maxSpendIncludingFee,
        idealSharesAtMaxSpend,
        minSharesAtMaxSpend,
    };
}
function cpmmSharesForCost(marketData, cost, index) {
    if (cost === 0)
        return 0;
    const stakes = marketData.stakes;
    const selectedPool = Number(stakes[index]);
    const totalPool = stakes.reduce((sum, s) => sum + Number(s), 0);
    const otherPool = totalPool - selectedPool;
    const numerator = selectedPool * otherPool;
    const denominator = selectedPool + cost;
    const newY = Math.floor(numerator / denominator);
    const shares = otherPool - newY;
    return shares;
}
export function estimateMaxSpendIncludingFee(marketData, index, feeBips, decimals) {
    const BIPS = 10000;
    const maxPurchase = cpmmMaxPurchase(marketData, index);
    const pricePerShare = cpmmPricePerShare(marketData, index);
    const rawCost = maxPurchase * pricePerShare;
    const maxSpendNet = Math.floor(rawCost); // in microtokens
    const maxSpendIncludingFee = Math.ceil((maxSpendNet * BIPS) / (BIPS - feeBips));
    return { maxSpendNet, maxSpendIncludingFee };
}
function cpmmMaxPurchase(marketData, index) {
    const stakes = marketData.stakes;
    if (index < 0 || index >= stakes.length)
        throw new Error("Invalid category index");
    const selectedPool = Number(stakes[index]);
    const totalPool = stakes.reduce((sum, s) => sum + Number(s), 0);
    const otherPool = totalPool - selectedPool;
    // Mirror Clarity's `(if (> other-pool u0) (- other-pool u1) u0)`
    const maxPurchase = otherPool > 0 ? otherPool - 1 : 0;
    return maxPurchase;
}
export function cpmmPricePerShare(marketData, index) {
    const stakes = marketData.stakes;
    if (index < 0 || index >= stakes.length)
        throw new Error("Invalid category index");
    const selectedPool = stakes[index];
    const totalPool = stakes.reduce((sum, s) => sum + s, 0);
    const otherPool = totalPool - selectedPool;
    if (otherPool === 0)
        return Infinity;
    return selectedPool / otherPool;
}
export async function resolveMarketAI(bmApiUrl, marketId, marketType) {
    const path = `${bmApiUrl}/agent/resolve/${marketId}/${marketType}`;
    const response = await fetch(path);
    const res = (await response.json()) || [];
    return res;
}
export async function fetchMarketsVotes(bmApiUrl, marketId, marketType) {
    const path = `${bmApiUrl}/pm/markets/votes/${marketId}/${marketType}`;
    const response = await fetch(path);
    if (response.status === 404)
        return [];
    const res = await response.json();
    return res || [];
}
export function calculatePayoutCategorical(exchangeRates, amount, decimals, userStake, marketData, currency) {
    const mult = Number(`1e${decimals}`);
    const microAmount = fmtStxMicro(amount, decimals); //Math.round(amount * mult);
    const numCategories = marketData.categories.length;
    const marketType = marketData.coolDownPeriod && marketData.coolDownPeriod > 0 ? 2 : 1;
    const userStakes = [];
    for (let i = 0; i < numCategories; i++) {
        userStakes.push(userStake && userStake.stakes && userStake?.stakes.length > i
            ? userStake?.stakes[i]
            : 0);
    }
    const totalStakes = [...marketData.stakes];
    // total stake in market
    const totalMarketStake = totalStakes.reduce((sum, stake) => sum + stake, 0);
    const payouts = [];
    for (let i = 0; i < numCategories; i++) {
        const myTotalStake = microAmount; //userStakes[i] + microAmount; // User's total stake in category i
        const categoryPool = totalStakes[i]; // Total market stake in category i
        // Calculate total stake excluding the current category
        const totalNotI = totalMarketStake - categoryPool;
        let stakeInMicro = 0;
        if (categoryPool === 0) {
            stakeInMicro = myTotalStake;
        }
        else {
            //payouts.push((myTotalStake * totalNotI) / categoryPool);
            stakeInMicro = myTotalStake + (myTotalStake * totalNotI) / categoryPool;
        }
        const crypto = parseFloat(fmtMicroToStxNumber(stakeInMicro, decimals).toFixed(decimals));
        const cryptoCurr = decimals === 8 ? " BTC" : " STX";
        const amountFiat = convertCryptoToFiatNumber(exchangeRates, currency, decimals === 6, crypto);
        const amounts = {
            fiat: String(amountFiat),
            cryptoMicro: stakeInMicro,
            crypto: crypto.toString() + cryptoCurr,
            btc: convertFiatToBitcoin(exchangeRates, convertCryptoToFiatNumber(exchangeRates, currency, decimals === 6, crypto), currency).toString() + " BTC",
        };
        payouts.push(amounts);
    }
    return payouts;
}
export const btcToken = {
    symbol: "BTC",
    name: "bitcoin",
    decimals: 8,
    balance: 0,
    tokenUri: "",
    totalSupply: 0,
};
export function convertFiatToBitcoin(exchangeRates, amountFiat, currency) {
    // const microAmount = fmtStxMicro(amount, decimals); //Math.round(amount * mult);
    const rate = exchangeRates.find((c) => c.currency === currency.code);
    if (!rate)
        return 0;
    const amountNative = amountFiat / (rate.fifteen ?? 0);
    return parseFloat(amountNative.toFixed(btcToken.decimals)); //fmtStxMicro(amountNative, sip10Data.decimals);
}
export async function getTierBalance(bmApiUrl, tier, address) {
    const path = `${bmApiUrl}/reputation/${tier}/${address}`;
    const response = await fetch(path);
    const result = (await response.json()) || 0;
    return result || 0;
}
export async function getPredictionMarket(bmApiUrl, marketId, marketType) {
    const path = `${bmApiUrl}/pm/markets/${marketId}/${marketType}`;
    console.log("getPredictionMarket " + path);
    const response = await fetch(path);
    if (response.status === 404)
        return [];
    const res = await response.json();
    return res;
}
export async function fetchMarketClaims(bmApiUrl, marketId, marketType) {
    const path = `${bmApiUrl}/pm/claims/${marketId}/${marketType}`;
    const response = await fetch(path);
    if (response.status === 404)
        return [];
    const res = await response.json();
    return res;
}
export async function getPredictionMarketSSR(bmApiUrl, marketId, marketType) {
    const path = `${bmApiUrl}/pm/markets/${marketId}/${marketType}`;
    console.log("getPredictionMarket " + path);
    const response = await fetch(path);
    if (response.status === 404)
        return undefined;
    const res = await response.json();
    return res;
}
export async function fetchMarketStakesSSR(bmApiUrl, marketId, marketType) {
    const path = `${bmApiUrl}/pm/stakes/${marketId}/${marketType}`;
    const response = await fetch(path);
    if (response.status === 404)
        return [];
    const res = await response.json();
    return res;
}
