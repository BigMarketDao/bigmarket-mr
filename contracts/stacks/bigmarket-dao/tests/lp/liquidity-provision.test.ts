import { Cl, ClarityType, type ClarityValue } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import { alice, betty, bob, constructDao, deployer, metadataHash, stxToken } from '../dao_helpers';

const marketPredicting = 'bme024-0-market-predicting';

/** Error codes from bme024-0-market-predicting.clar */
const ERR_AMOUNT_TOO_LOW = 10002;
const ERR_MARKET_NOT_FOUND = 10005;
const ERR_USER_NOT_STAKED = 10008;
const ERR_INVALID_TOKEN = 10021;
const ERR_AMOUNT_TOO_HIGH = 10029;
const ERR_SLIPPAGE_TOO_HIGH = 10031;
const ERR_INSUFFICIENT_BALANCE = 10011;
const ERR_NO_LP_POSITION = 10039;

const wrappedStx = Cl.contractPrincipal(deployer, 'wrapped-stx');

function unwrapMarketTuple(result: ClarityValue) {
	if (result.type !== ClarityType.OptionalSome) {
		throw new Error(`expected market some, got ${result.type}`);
	}
	const inner = result.value;
	if (inner.type !== ClarityType.Tuple) {
		throw new Error(`expected tuple, got ${inner.type}`);
	}
	return inner;
}

function sumStakes(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-market-data', [Cl.uint(marketId)], user);
	const tuple = unwrapMarketTuple(result);
	const stakes = tuple.value.stakes;
	if (stakes.type !== ClarityType.List) {
		throw new Error('stakes not a list');
	}
	return (stakes.value as ClarityValue[]).reduce((acc: bigint, u: ClarityValue) => {
		if (u.type !== ClarityType.UInt) {
			throw new Error('stake entry not uint');
		}
		return acc + BigInt(u.value);
	}, 0n);
}

function callAddLiquidity(sender: string, marketId: number, amount: number, expectedTotalStakes: bigint, maxDeviationBips: number) {
	return simnet.callPublicFn(
		marketPredicting,
		'add-liquidity',
		[Cl.uint(marketId), Cl.uint(amount), Cl.uint(expectedTotalStakes), Cl.uint(maxDeviationBips), wrappedStx],
		sender
	);
}

function callRemoveLiquidity(sender: string, marketId: number, amount: number, minRefund: number) {
	return simnet.callPublicFn(marketPredicting, 'remove-liquidity', [Cl.uint(marketId), Cl.uint(amount), Cl.uint(minRefund), wrappedStx], sender);
}

function callClaimLpFees(sender: string, marketId: number) {
	return simnet.callPublicFn(marketPredicting, 'claim-lp-fees', [Cl.uint(marketId), wrappedStx], sender);
}

function getLpBalance(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-lp-balance', [Cl.uint(marketId), Cl.principal(user)], user);
	if (result.type !== ClarityType.ResponseOk) throw new Error(`expected ok, got ${result.type}`);
	const inner = result.value;
	if (inner.type !== ClarityType.UInt) throw new Error('lp-shares not uint');
	return BigInt(inner.value);
}

function getMarketField(marketId: number, field: 'lp-total-shares' | 'accumulated-lp-fees', user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-market-data', [Cl.uint(marketId)], user);
	const tuple = unwrapMarketTuple(result);
	const v = tuple.value[field];
	if (v.type !== ClarityType.UInt) throw new Error(`${field} not uint`);
	return BigInt(v.value);
}

function getCategoryStakeBalance(marketId: number, user: string, index: number): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], user);
	if (result.type !== ClarityType.ResponseOk) throw new Error(`expected ok, got ${result.type}`);
	const list = result.value;
	if (list.type !== ClarityType.List) throw new Error('stake-balances not a list');
	const entry = (list.value as ClarityValue[])[index];
	if (!entry || entry.type !== ClarityType.UInt) throw new Error('stake entry not uint');
	return BigInt(entry.value);
}

function callSellCategory(sender: string, marketId: number, minRefund: number, category: string, sharesIn: number) {
	return simnet.callPublicFn(
		marketPredicting,
		'sell-category',
		[Cl.uint(marketId), Cl.uint(minRefund), Cl.stringAscii(category), wrappedStx, Cl.uint(sharesIn)],
		sender
	);
}

/** Mine past market-end + cool-down, then walk through resolution to RESOLUTION_RESOLVED. */
async function resolveBinaryMarketUndisputed(marketId: number, winningCategory: string) {
	simnet.mineEmptyBlocks(288);
	const resolved = simnet.callPublicFn(marketPredicting, 'resolve-market', [Cl.uint(marketId), Cl.stringAscii(winningCategory)], bob);
	expect(resolved.result.type).toBe(ClarityType.ResponseOk);
	simnet.mineEmptyBlocks(25);
	const concluded = simnet.callPublicFn(marketPredicting, 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	expect(concluded.result).toEqual(Cl.ok(Cl.bool(true)));
}

describe('add-liquidity', () => {
	it('err: market not found', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		const r = callAddLiquidity(alice, 99, 1_000_000, total, 10_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MARKET_NOT_FOUND)));
	});

	it('err: invalid token (market is STX, pass SBTC trait)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const total = sumStakes(0, alice);
		const r = simnet.callPublicFn(
			marketPredicting,
			'add-liquidity',
			[Cl.uint(0), Cl.uint(500_000), Cl.uint(total), Cl.uint(10_000), Cl.contractPrincipal(deployer, 'sbtc')],
			alice
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_TOKEN)));
	});

	it('err: amount too low (zero requested)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const total = sumStakes(0, alice);
		const r = callAddLiquidity(alice, 0, 0, total, 10_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_AMOUNT_TOO_LOW)));
	});

	it('err: slippage — expected total stakes off (0 bips tolerance)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const total = sumStakes(0, alice);
		const wrong = total > 10n ? total - 10n : 0n;
		const r = callAddLiquidity(alice, 0, 500_000, wrong, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_SLIPPAGE_TOO_HIGH)));
	});

	it('ok: adds proportional liquidity with loose slippage bounds', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 3_000_000, 1);
		await predictCategory(bob, 0, 'nay', 3_000_000, 0);
		const totalBefore = sumStakes(0, alice);
		const addAmount = 600_000;
		const r = callAddLiquidity(alice, 0, addAmount, totalBefore, 10_000);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		const totalAfter = sumStakes(0, alice);
		expect(totalAfter).toBeGreaterThan(totalBefore);
		const stakeRead = simnet.callReadOnlyFn(marketPredicting, 'get-stake-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		expect(stakeRead.result.type).toBe(ClarityType.ResponseOk);
	});

	it('ok: first LP receives lp-shares equal to actual-amount deposited; lp-total-shares matches', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const totalBefore = sumStakes(0, alice);
		expect(getLpBalance(0, alice)).toBe(0n);
		expect(getMarketField(0, 'lp-total-shares', alice)).toBe(0n);

		const r = callAddLiquidity(alice, 0, 800_000, totalBefore, 10_000);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		// returned `actual-amount` is the principal recorded as lp-shares for the first LP.
		const actualAmount = (r.result as any).value.value as bigint;
		const aliceLp = getLpBalance(0, alice);
		expect(aliceLp).toBe(BigInt(actualAmount));
		expect(getMarketField(0, 'lp-total-shares', alice)).toBe(aliceLp);
	});

	it('ok: second LP receives shares pro-rata to pre-deposit pool', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total0 = sumStakes(0, alice);
		const aliceAdd = 1_000_000;
		const aliceResp = callAddLiquidity(alice, 0, aliceAdd, total0, 10_000);
		expect(aliceResp.result.type).toBe(ClarityType.ResponseOk);
		const aliceLp = getLpBalance(0, alice);
		expect(aliceLp).toBeGreaterThan(0n);

		const total1 = sumStakes(0, alice);
		const bobAdd = 500_000;
		const bobResp = callAddLiquidity(bob, 0, bobAdd, total1, 10_000);
		expect(bobResp.result.type).toBe(ClarityType.ResponseOk);

		const bobLp = getLpBalance(0, bob);
		// bob deposited ~half of alice's amount into a pool that's now larger than at alice's deposit;
		// his lp-shares must be strictly less than alice's.
		expect(bobLp).toBeGreaterThan(0n);
		expect(bobLp).toBeLessThan(aliceLp);
		expect(getMarketField(0, 'lp-total-shares', alice)).toBe(aliceLp + bobLp);
	});
});

describe('remove-liquidity', () => {
	it('err: user has no LP position (no stake-balances entry)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const r = callRemoveLiquidity(bob, 0, 100_000, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_USER_NOT_STAKED)));
	});

	it('err: amount too high (must be strictly less than total stakes)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const total = sumStakes(0, alice);
		const r = callRemoveLiquidity(alice, 0, Number(total), 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_AMOUNT_TOO_HIGH)));
	});

	it('err: min-refund / slippage too high', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const total = sumStakes(0, alice);
		const burn = 200_000;
		expect(burn).toBeLessThan(Number(total));
		const r = callRemoveLiquidity(alice, 0, burn, 9_000_000_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INSUFFICIENT_BALANCE)));
	});

	it('err: insufficient balance (single-sided stake, not full LP vector)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const total = sumStakes(0, alice);
		const r = callRemoveLiquidity(alice, 0, Math.floor(Number(total) / 2), 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INSUFFICIENT_BALANCE)));
	});

	it('ok: add balanced LP then remove partial', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		await predictCategory(bob, 0, 'nay', 2_000_000, 0);
		let total = sumStakes(0, alice);
		let r = callAddLiquidity(alice, 0, 800_000, total, 10_000);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		total = sumStakes(0, alice);
		r = callRemoveLiquidity(alice, 0, 400_000, 0);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
	});

	it('ok: round-trip add then remove same amount parameter', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 5_000_000, 1);
		await predictCategory(bob, 0, 'nay', 5_000_000, 0);
		const total0 = sumStakes(0, alice);
		const addAmt = 1_000_000;
		let r = callAddLiquidity(alice, 0, addAmt, total0, 10_000);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		r = callRemoveLiquidity(alice, 0, addAmt, 0);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
	});
});

describe('claim-lp-fees', () => {
	it('err: market not found', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const r = callClaimLpFees(alice, 99);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MARKET_NOT_FOUND)));
	});

	it('err: caller has no LP position', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		// bob bought no shares and never LPed
		const r = callClaimLpFees(bob, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_NO_LP_POSITION)));
	});

	it('err: invalid token (STX market, SBTC trait)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 500_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		const r = simnet.callPublicFn(marketPredicting, 'claim-lp-fees', [Cl.uint(0), Cl.contractPrincipal(deployer, 'sbtc')], alice);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_TOKEN)));
	});

	it('ok: returns u0 fee and burns lp-shares when no trading occurred', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 500_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		expect(getMarketField(0, 'accumulated-lp-fees', alice)).toBe(0n);

		const r = callClaimLpFees(alice, 0);
		expect(r.result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getLpBalance(0, alice)).toBe(0n);
		expect(getMarketField(0, 'lp-total-shares', alice)).toBe(0n);
	});

	it('ok: sole LP collects 100% of accumulated fees and lp-balances entry is deleted', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		// bob trades; lp-fee accrues entirely to alice (sole LP)
		await predictCategory(bob, 0, 'yay', 2_000_000, 1);
		const accumulated = getMarketField(0, 'accumulated-lp-fees', alice);
		expect(accumulated).toBeGreaterThan(0n);

		const r = callClaimLpFees(alice, 0);
		expect(r.result).toEqual(Cl.ok(Cl.uint(accumulated)));
		expect(getLpBalance(0, alice)).toBe(0n);
		expect(getMarketField(0, 'lp-total-shares', alice)).toBe(0n);
		expect(getMarketField(0, 'accumulated-lp-fees', alice)).toBe(0n);
	});

	it('ok: two LPs split fees pro-rata to lp-shares', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		// alice and bob both LP before any trading; their pro-rata weights determine the split
		const total0 = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total0, 10_000).result.type).toBe(ClarityType.ResponseOk);
		const total1 = sumStakes(0, alice);
		expect(callAddLiquidity(bob, 0, 1_000_000, total1, 10_000).result.type).toBe(ClarityType.ResponseOk);
		const aliceShares = getLpBalance(0, alice);
		const bobShares = getLpBalance(0, bob);
		const lpTotal = aliceShares + bobShares;

		// betty trades, generating lp-fee
		await predictCategory(betty, 0, 'yay', 5_000_000, 1);
		const accumulated = getMarketField(0, 'accumulated-lp-fees', alice);
		expect(accumulated).toBeGreaterThan(0n);

		const expectedAlice = (accumulated * aliceShares) / lpTotal;
		const expectedBob = (accumulated * bobShares) / lpTotal;

		const aliceClaim = callClaimLpFees(alice, 0);
		expect(aliceClaim.result).toEqual(Cl.ok(Cl.uint(expectedAlice)));
		// after alice claims, lp-total-shares = bobShares; bob's claim now equals the remaining accumulated
		const remaining = getMarketField(0, 'accumulated-lp-fees', alice);
		expect(remaining).toBe(accumulated - expectedAlice);

		const bobClaim = callClaimLpFees(bob, 0);
		// bob claims everything left (he's now the only LP)
		expect(bobClaim.result).toEqual(Cl.ok(Cl.uint(remaining)));
		// rounding dust may remain but must be strictly less than the second claim
		const dust = getMarketField(0, 'accumulated-lp-fees', alice);
		expect(dust).toBeLessThanOrEqual(1n);
		// bob's actual payout is at least the naive pro-rata estimate (he absorbs alice's rounding remainder)
		expect(remaining).toBeGreaterThanOrEqual(expectedBob);
	});

	it('Bug 1 fix: claim-lp-fees works after market resolution', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		await predictCategory(bob, 0, 'yay', 2_000_000, 1);
		const accumulated = getMarketField(0, 'accumulated-lp-fees', alice);
		expect(accumulated).toBeGreaterThan(0n);

		// resolve and conclude — past the RESOLUTION_OPEN gate that used to lock LPs out
		await resolveBinaryMarketUndisputed(0, 'yay');

		// remove-liquidity is now closed (market not open), but claim-lp-fees must still work
		const removeR = callRemoveLiquidity(alice, 0, 100_000, 0);
		expect(removeR.result.type).toBe(ClarityType.ResponseErr);

		const claimR = callClaimLpFees(alice, 0);
		expect(claimR.result).toEqual(Cl.ok(Cl.uint(accumulated)));
		expect(getLpBalance(0, alice)).toBe(0n);
	});

	it('Bug 2 fix: claim-lp-fees works after sell-category unbalances stakes', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		// alice LPs, then sells some yay shares — her stake-balances become unbalanced relative to the pool ratio
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		const aliceLp = getLpBalance(0, alice);
		expect(aliceLp).toBeGreaterThan(0n);

		// generate a fee
		await predictCategory(bob, 0, 'yay', 2_000_000, 1);
		const accumulated = getMarketField(0, 'accumulated-lp-fees', alice);
		expect(accumulated).toBeGreaterThan(0n);

		// alice now sells some of her yay shares — this used to lock her LP position permanently
		const aliceYayBefore = getCategoryStakeBalance(0, alice, 1);
		expect(aliceYayBefore).toBeGreaterThan(0n);
		const sellR = callSellCategory(alice, 0, 0, 'yay', Number(aliceYayBefore / 2n));
		expect(sellR.result.type).toBe(ClarityType.ResponseOk);

		// claim-lp-fees does not depend on outcome share balance — must succeed
		const claimR = callClaimLpFees(alice, 0);
		expect(claimR.result.type).toBe(ClarityType.ResponseOk);
		const paid = (claimR.result as any).value.value as bigint;
		// alice was the only LP, so she gets the full accumulated amount that was on the market at claim time
		expect(BigInt(paid)).toBeGreaterThan(0n);
		expect(getLpBalance(0, alice)).toBe(0n);
	});
});

describe('LP / outcome share decoupling', () => {
	it('remove-liquidity does not touch lp-balances or accumulated-lp-fees', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		await predictCategory(bob, 0, 'yay', 2_000_000, 1);

		const lpSharesBefore = getLpBalance(0, alice);
		const lpTotalBefore = getMarketField(0, 'lp-total-shares', alice);
		const accumulatedBefore = getMarketField(0, 'accumulated-lp-fees', alice);
		expect(lpSharesBefore).toBeGreaterThan(0n);
		expect(accumulatedBefore).toBeGreaterThan(0n);

		const removeR = callRemoveLiquidity(alice, 0, 200_000, 0);
		expect(removeR.result.type).toBe(ClarityType.ResponseOk);

		// LP-side state must be untouched by remove-liquidity
		expect(getLpBalance(0, alice)).toBe(lpSharesBefore);
		expect(getMarketField(0, 'lp-total-shares', alice)).toBe(lpTotalBefore);
		expect(getMarketField(0, 'accumulated-lp-fees', alice)).toBe(accumulatedBefore);
	});

	it('claim-lp-fees does not touch outcome share balances or stakes pools', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		await predictCategory(bob, 0, 'yay', 2_000_000, 1);

		const stakesBefore = sumStakes(0, alice);
		const aliceYay = getCategoryStakeBalance(0, alice, 1);
		const aliceNay = getCategoryStakeBalance(0, alice, 0);

		expect(callClaimLpFees(alice, 0).result.type).toBe(ClarityType.ResponseOk);

		expect(sumStakes(0, alice)).toBe(stakesBefore);
		expect(getCategoryStakeBalance(0, alice, 1)).toBe(aliceYay);
		expect(getCategoryStakeBalance(0, alice, 0)).toBe(aliceNay);
	});

	it('claim-lp-fees then remove-liquidity both succeed', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		await predictCategory(bob, 0, 'yay', 2_000_000, 1);

		expect(callClaimLpFees(alice, 0).result.type).toBe(ClarityType.ResponseOk);
		expect(getLpBalance(0, alice)).toBe(0n);

		// outcome shares are still removable after fees have been claimed
		const removeR = callRemoveLiquidity(alice, 0, 100_000, 0);
		expect(removeR.result.type).toBe(ClarityType.ResponseOk);
	});

	it('remove-liquidity then claim-lp-fees both succeed', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 1_000_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		await predictCategory(bob, 0, 'yay', 2_000_000, 1);

		const removeR = callRemoveLiquidity(alice, 0, 100_000, 0);
		expect(removeR.result.type).toBe(ClarityType.ResponseOk);

		const claimR = callClaimLpFees(alice, 0);
		expect(claimR.result.type).toBe(ClarityType.ResponseOk);
		expect(getLpBalance(0, alice)).toBe(0n);
	});

	it('claim-lp-fees twice errors with no-lp-position on second call', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		const total = sumStakes(0, alice);
		expect(callAddLiquidity(alice, 0, 500_000, total, 10_000).result.type).toBe(ClarityType.ResponseOk);
		expect(callClaimLpFees(alice, 0).result.type).toBe(ClarityType.ResponseOk);
		expect(callClaimLpFees(alice, 0).result).toEqual(Cl.error(Cl.uint(ERR_NO_LP_POSITION)));
	});
});

describe('create-market guardrails (existing)', () => {
	it('err too few categories', async () => {
		await constructDao(simnet);
		const response = simnet.callPublicFn(
			marketPredicting,
			'create-market',
			[
				Cl.list([Cl.stringAscii('lion')]),
				Cl.none(),
				Cl.principal(stxToken),
				Cl.bufferFromHex(metadataHash()),
				Cl.list([]),
				Cl.principal(`${deployer}.bme022-0-market-gating`),
				Cl.none(),
				Cl.none(),
				Cl.uint(100000000),
				Cl.none(),
				Cl.none()
			],
			deployer
		);
		expect(response.result).toEqual(Cl.error(Cl.uint(10024)));
	});

	it('create binary market ok', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
	});

	it('create and stake not ok on unknown category', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await createBinaryMarket(1);
		await predictCategory(alice, 0, 'lionness', 1000, 10023);
	});
});
