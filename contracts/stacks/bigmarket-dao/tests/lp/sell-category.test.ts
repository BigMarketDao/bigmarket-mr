import { Cl, ClarityType, type ClarityValue } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import { alice, bob, constructDao, deployer } from '../dao_helpers';

const marketPredicting = 'bme024-0-market-predicting';

function getAccumulatedLpFees(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-market-data', [Cl.uint(marketId)], user);
	if (result.type !== ClarityType.OptionalSome) throw new Error(`expected market some, got ${result.type}`);
	const inner = result.value;
	if (inner.type !== ClarityType.Tuple) throw new Error(`expected tuple, got ${inner.type}`);
	const v = inner.value['accumulated-lp-fees'];
	if (v.type !== ClarityType.UInt) throw new Error('accumulated-lp-fees not uint');
	return BigInt(v.value);
}

const ERR_AMOUNT_TOO_LOW = 10002;
const ERR_MARKET_NOT_FOUND = 10005;
const ERR_USER_NOT_STAKED = 10008;
const ERR_INSUFFICIENT_BALANCE = 10011;
const ERR_MARKET_NOT_OPEN = 10018;
const ERR_INVALID_TOKEN = 10021;
const ERR_CATEGORY_NOT_FOUND = 10023;
const ERR_SLIPPAGE_TOO_HIGH = 10031;
const ERR_IN_ARITHMATIC = 11043;

const wrappedStx = Cl.contractPrincipal(deployer, 'wrapped-stx');

function callSellCategory(
	sender: string,
	marketId: number,
	minRefund: number,
	category: string,
	sharesIn: number,
	token: ReturnType<typeof Cl.contractPrincipal> = wrappedStx
) {
	return simnet.callPublicFn(marketPredicting, 'sell-category', [Cl.uint(marketId), Cl.uint(minRefund), Cl.stringAscii(category), token, Cl.uint(sharesIn)], sender);
}

describe('sell-category', () => {
	it('err: market not found', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const r = callSellCategory(alice, 7, 0, 'yay', 100_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MARKET_NOT_FOUND)));
	});

	it('err: invalid token (STX market, SBTC trait)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const r = callSellCategory(alice, 0, 0, 'yay', 50_000, Cl.contractPrincipal(deployer, 'sbtc'));
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_TOKEN)));
	});

	it('err: category not found', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const r = callSellCategory(alice, 0, 0, 'maybe', 50_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_CATEGORY_NOT_FOUND)));
	});

	it('err: user not staked (no stake-balances entry)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const r = callSellCategory(bob, 0, 0, 'yay', 10_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_USER_NOT_STAKED)));
	});

	it('err: shares-in zero', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const r = callSellCategory(alice, 0, 0, 'yay', 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_AMOUNT_TOO_LOW)));
	});

	it('err: insufficient balance (sell more than position)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 500_000, 1);
		const r = callSellCategory(alice, 0, 0, 'yay', 9_000_000_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_IN_ARITHMATIC)));
	});

	it('err: slippage — min-refund higher than net refund', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		const r = callSellCategory(alice, 0, 9_000_000_000, 'yay', 100_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_SLIPPAGE_TOO_HIGH)));
	});

	it('err: market not open (past trading window)', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		simnet.mineEmptyBlocks(200);
		const r = callSellCategory(alice, 0, 0, 'yay', 50_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MARKET_NOT_OPEN)));
	});

	it('ok: partial sell returns ok with category index', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 3_000_000, 1);
		const r = callSellCategory(alice, 0, 0, 'yay', 200_000);
		expect(r.result).toEqual(Cl.ok(Cl.uint(1)));
	});

	it('ok: second leg sell on nay after two-sided stake', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 2_000_000, 1);
		await predictCategory(alice, 0, 'nay', 1_500_000, 0);
		const r = callSellCategory(alice, 0, 0, 'nay', 50_000);
		expect(r.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('ok: sell-category accumulates lp-fee on the market record', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
		// predict-category accumulates an initial lp-fee
		await predictCategory(alice, 0, 'yay', 3_000_000, 1);
		const accumulatedAfterPredict = getAccumulatedLpFees(0, alice);
		expect(accumulatedAfterPredict).toBeGreaterThan(0n);

		// selling produces a refund-side fee that must also be accumulated, not sent to dev-fund
		const sellR = callSellCategory(alice, 0, 0, 'yay', 200_000);
		expect(sellR.result).toEqual(Cl.ok(Cl.uint(1)));

		const accumulatedAfterSell = getAccumulatedLpFees(0, alice);
		expect(accumulatedAfterSell).toBeGreaterThan(accumulatedAfterPredict);
	});
});
