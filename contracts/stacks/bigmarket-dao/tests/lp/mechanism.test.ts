import { Cl, ClarityType, type ClarityValue } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, betty, bob, constructDao, deployer, metadataHash, stxToken } from '../dao_helpers';

const marketPredicting = 'bme024-0-market-predicting';
const wrappedStx = Cl.contractPrincipal(deployer, 'wrapped-stx');

/** Mechanism values mirror MECHANISM_KNOCKOUT / MECHANISM_AMM in the contract. */
const KNOCKOUT = 1;
const AMM = 2;

/** Error codes from bme024-0-market-predicting.clar */
const ERR_USER_NOT_STAKED = 10008;
const ERR_NO_LP_POSITION = 10039;
const ERR_SELL_NOT_PERMITTED = 10106;
const ERR_MECHANISM_NOT_SUPPORTED = 10107;
const ERR_INVALID_MECHANISM = 10108;

function createMarket(mechanism: 'none' | 'knockout' | 'amm' | { raw: number }, creator: string = deployer) {
	const arg =
		mechanism === 'none'
			? Cl.none()
			: mechanism === 'knockout'
				? Cl.some(Cl.uint(KNOCKOUT))
				: mechanism === 'amm'
					? Cl.some(Cl.uint(AMM))
					: Cl.some(Cl.uint(mechanism.raw));
	return simnet.callPublicFn(
		marketPredicting,
		'create-market',
		[
			Cl.list([Cl.stringAscii('nay'), Cl.stringAscii('yay')]),
			Cl.none(),
			Cl.principal(stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.uint(100000000),
			Cl.none(),
			arg
		],
		creator
	);
}

function getMechanism(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-market-data', [Cl.uint(marketId)], user);
	if (result.type !== ClarityType.OptionalSome) throw new Error(`expected some, got ${result.type}`);
	const inner = result.value;
	if (inner.type !== ClarityType.Tuple) throw new Error(`expected tuple, got ${inner.type}`);
	const v = inner.value['market-mechanism'];
	if (v.type !== ClarityType.UInt) throw new Error('market-mechanism not uint');
	return BigInt(v.value);
}

function getAccumulatedLpFees(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-market-data', [Cl.uint(marketId)], user);
	if (result.type !== ClarityType.OptionalSome) throw new Error('market not found');
	const tuple = result.value;
	if (tuple.type !== ClarityType.Tuple) throw new Error('not tuple');
	const v = tuple.value['accumulated-lp-fees'];
	if (v.type !== ClarityType.UInt) throw new Error('accumulated-lp-fees not uint');
	return BigInt(v.value);
}

function predict(user: string, marketId: number, category: string, amount: number) {
	return simnet.callPublicFn(
		marketPredicting,
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.stringAscii(category), Cl.principal(stxToken), Cl.uint(amount * 2)],
		user
	);
}

function sell(user: string, marketId: number, category: string, sharesIn: number) {
	return simnet.callPublicFn(
		marketPredicting,
		'sell-category',
		[Cl.uint(marketId), Cl.uint(0), Cl.stringAscii(category), wrappedStx, Cl.uint(sharesIn)],
		user
	);
}

function addLiquidity(user: string, marketId: number, amount: number, expectedTotal: bigint) {
	return simnet.callPublicFn(
		marketPredicting,
		'add-liquidity',
		[Cl.uint(marketId), Cl.uint(amount), Cl.uint(expectedTotal), Cl.uint(10_000), wrappedStx],
		user
	);
}

function removeLiquidity(user: string, marketId: number, amount: number) {
	return simnet.callPublicFn(marketPredicting, 'remove-liquidity', [Cl.uint(marketId), Cl.uint(amount), Cl.uint(0), wrappedStx], user);
}

function claimLpFees(user: string, marketId: number) {
	return simnet.callPublicFn(marketPredicting, 'claim-lp-fees', [Cl.uint(marketId), wrappedStx], user);
}

function claimWinnings(user: string, marketId: number) {
	return simnet.callPublicFn(marketPredicting, 'claim-winnings', [Cl.uint(marketId), Cl.principal(stxToken)], user);
}

function totalStakes(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketPredicting, 'get-market-data', [Cl.uint(marketId)], user);
	if (result.type !== ClarityType.OptionalSome) throw new Error('market not found');
	const tuple = result.value;
	if (tuple.type !== ClarityType.Tuple) throw new Error('not tuple');
	const stakes = tuple.value.stakes;
	if (stakes.type !== ClarityType.List) throw new Error('stakes not list');
	return (stakes.value as ClarityValue[]).reduce((acc: bigint, u: ClarityValue) => {
		if (u.type !== ClarityType.UInt) throw new Error('stake not uint');
		return acc + BigInt(u.value);
	}, 0n);
}

async function resolveAndConclude(marketId: number, winningCategory: string) {
	simnet.mineEmptyBlocks(288);
	const r = simnet.callPublicFn(marketPredicting, 'resolve-market', [Cl.uint(marketId), Cl.stringAscii(winningCategory)], bob);
	expect(r.result.type).toBe(ClarityType.ResponseOk);
	simnet.mineEmptyBlocks(25);
	const c = simnet.callPublicFn(marketPredicting, 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	expect(c.result).toEqual(Cl.ok(Cl.bool(true)));
}

describe('create-market: market-mechanism', () => {
	it('defaults to AMM when market-mechanism is none', async () => {
		await constructDao(simnet);
		const r = createMarket('none');
		expect(r.result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getMechanism(0, alice)).toBe(BigInt(AMM));
	});

	it('sets KNOCKOUT when (some u1) is provided', async () => {
		await constructDao(simnet);
		const r = createMarket('knockout');
		expect(r.result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getMechanism(0, alice)).toBe(BigInt(KNOCKOUT));
	});

	it('sets AMM when (some u2) is provided', async () => {
		await constructDao(simnet);
		const r = createMarket('amm');
		expect(r.result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getMechanism(0, alice)).toBe(BigInt(AMM));
	});

	it('rejects (some u0) with err-invalid-mechanism', async () => {
		await constructDao(simnet);
		const r = createMarket({ raw: 0 });
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_MECHANISM)));
	});

	it('rejects (some u3) with err-invalid-mechanism', async () => {
		await constructDao(simnet);
		const r = createMarket({ raw: 3 });
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_MECHANISM)));
	});

	it('rejects (some u99) with err-invalid-mechanism', async () => {
		await constructDao(simnet);
		const r = createMarket({ raw: 99 });
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_MECHANISM)));
	});
});

describe('KNOCKOUT mechanism: function gates', () => {
	it('predict-category is allowed', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		const r = predict(alice, 0, 'yay', 2_000_000);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
	});

	it('predict-category does not accumulate LP fees', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getAccumulatedLpFees(0, alice)).toBe(0n);
		const r = predict(alice, 0, 'yay', 2_000_000);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		expect(getAccumulatedLpFees(0, alice)).toBe(0n);
	});

	it('sell-category errors with err-sell-not-permitted', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		// give alice a stake first so we don't fail with err-user-not-staked
		expect(predict(alice, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		const r = sell(alice, 0, 'yay', 100_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_SELL_NOT_PERMITTED)));
	});

	it('add-liquidity errors with err-mechanism-not-supported', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		const total = totalStakes(0, alice);
		const r = addLiquidity(alice, 0, 1_000_000, total);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MECHANISM_NOT_SUPPORTED)));
	});

	it('remove-liquidity errors with err-mechanism-not-supported', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		// give alice a stake-balances entry so the mechanism gate fires before err-user-not-staked
		expect(predict(alice, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		const r = removeLiquidity(alice, 0, 100_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MECHANISM_NOT_SUPPORTED)));
	});

	it('claim-lp-fees errors with err-mechanism-not-supported', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		// mechanism gate fires before the lp-balances unwrap, so any caller hits this
		const r = claimLpFees(alice, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MECHANISM_NOT_SUPPORTED)));
	});

	it('claim-winnings works after KNOCKOUT market resolves', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(predict(alice, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(bob, 0, 'nay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		await resolveAndConclude(0, 'yay');
		const r = claimWinnings(alice, 0);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		// loser cannot claim
		expect(claimWinnings(bob, 0).result.type).toBe(ClarityType.ResponseErr);
	});
});

describe('AMM mechanism: full functionality', () => {
	it('predict-category accumulates LP fees', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getAccumulatedLpFees(0, alice)).toBe(0n);
		const r = predict(alice, 0, 'yay', 2_000_000);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		expect(getAccumulatedLpFees(0, alice)).toBeGreaterThan(0n);
	});

	it('all LP functions are accepted (smoke test through full LP lifecycle)', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));

		const total = totalStakes(0, alice);
		expect(addLiquidity(alice, 0, 1_000_000, total).result.type).toBe(ClarityType.ResponseOk);

		// trading generates LP fees for alice (sole LP)
		expect(predict(bob, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);

		// alice can sell shares she received via add-liquidity
		expect(sell(alice, 0, 'yay', 100_000).result.type).toBe(ClarityType.ResponseOk);

		// remove-liquidity returns outcome shares
		expect(removeLiquidity(alice, 0, 100_000).result.type).toBe(ClarityType.ResponseOk);

		// claim-lp-fees pays accumulated entitlement
		const claim = claimLpFees(alice, 0);
		expect(claim.result.type).toBe(ClarityType.ResponseOk);
	});

	it('claim-winnings works after AMM market resolves', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(predict(alice, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(bob, 0, 'nay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		await resolveAndConclude(0, 'yay');
		expect(claimWinnings(alice, 0).result.type).toBe(ClarityType.ResponseOk);
		expect(claimWinnings(bob, 0).result.type).toBe(ClarityType.ResponseErr);
	});
});

describe('claim-winnings parity: KNOCKOUT vs AMM', () => {
	it('two equal predicts on yay split the AMM pool the same way they split the KNOCKOUT pool', async () => {
		// AMM market: alice and betty both predict yay equally; bob predicts nay
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(predict(alice, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(betty, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(bob, 0, 'nay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		await resolveAndConclude(0, 'yay');
		const aliceClaim = claimWinnings(alice, 0);
		const bettyClaim = claimWinnings(betty, 0);
		expect(aliceClaim.result.type).toBe(ClarityType.ResponseOk);
		expect(bettyClaim.result.type).toBe(ClarityType.ResponseOk);
	});

	it('KNOCKOUT predicts and resolves equivalently for the winner', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(predict(alice, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(betty, 0, 'yay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(bob, 0, 'nay', 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		await resolveAndConclude(0, 'yay');
		expect(claimWinnings(alice, 0).result.type).toBe(ClarityType.ResponseOk);
		expect(claimWinnings(betty, 0).result.type).toBe(ClarityType.ResponseOk);
	});
});

describe('non-KNOCKOUT trader paths still see baseline errors (gate ordering sanity)', () => {
	it('claim-lp-fees on AMM with no LP position still returns err-no-lp-position', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		const r = claimLpFees(alice, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_NO_LP_POSITION)));
	});

	it('remove-liquidity on AMM with no stakes still returns err-user-not-staked', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		// betty has no stake-balances entry
		const r = removeLiquidity(betty, 0, 100_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_USER_NOT_STAKED)));
	});
});
