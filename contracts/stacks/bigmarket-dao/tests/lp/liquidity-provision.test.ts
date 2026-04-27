import { Cl, ClarityType, type ClarityValue } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import { alice, bob, constructDao, deployer, metadataHash, stxToken } from '../dao_helpers';

const marketPredicting = 'bme024-0-market-predicting';

/** Error codes from bme024-0-market-predicting.clar */
const ERR_AMOUNT_TOO_LOW = 10002;
const ERR_MARKET_NOT_FOUND = 10005;
const ERR_USER_NOT_STAKED = 10008;
const ERR_INVALID_TOKEN = 10021;
const ERR_AMOUNT_TOO_HIGH = 10029;
const ERR_SLIPPAGE_TOO_HIGH = 10031;
const ERR_INSUFFICIENT_BALANCE = 10011;

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
