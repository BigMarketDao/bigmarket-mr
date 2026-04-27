import { Cl, ClarityType, type ClarityValue } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, deployer, marketScalingCPMM, metadataHash, passProposalByCoreVote, stxToken } from '../dao_helpers';

const wrappedStx = Cl.contractPrincipal(deployer, 'wrapped-stx');
const USD0 = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';

const KNOCKOUT = 1;
const AMM = 2;

/** Error codes from bme024-0-market-scalar-pyth.clar */
const ERR_USER_NOT_STAKED = 10008;
const ERR_NO_LP_POSITION = 10103;
const ERR_SELL_NOT_PERMITTED = 10106;
const ERR_MECHANISM_NOT_SUPPORTED = 10107;
const ERR_INVALID_MECHANISM = 10108;

function createMarket(mechanism: 'none' | 'knockout' | 'amm' | { raw: number }, priceFeed: string = USD0, creator: string = deployer) {
	const arg =
		mechanism === 'none'
			? Cl.none()
			: mechanism === 'knockout'
				? Cl.some(Cl.uint(KNOCKOUT))
				: mechanism === 'amm'
					? Cl.some(Cl.uint(AMM))
					: Cl.some(Cl.uint(mechanism.raw));
	return simnet.callPublicFn(
		marketScalingCPMM,
		'create-market',
		[
			Cl.none(),
			Cl.principal(stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(priceFeed),
			Cl.uint(100000000),
			Cl.none(),
			arg
		],
		creator
	);
}

function getMechanism(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketScalingCPMM, 'get-market-data', [Cl.uint(marketId)], user);
	if (result.type !== ClarityType.OptionalSome) throw new Error('market not found');
	const tuple = result.value;
	if (tuple.type !== ClarityType.Tuple) throw new Error('not tuple');
	const v = tuple.value['market-mechanism'];
	if (v.type !== ClarityType.UInt) throw new Error('market-mechanism not uint');
	return BigInt(v.value);
}

function getAccumulatedLpFees(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketScalingCPMM, 'get-market-data', [Cl.uint(marketId)], user);
	if (result.type !== ClarityType.OptionalSome) throw new Error('market not found');
	const tuple = result.value;
	if (tuple.type !== ClarityType.Tuple) throw new Error('not tuple');
	const v = tuple.value['accumulated-lp-fees'];
	if (v.type !== ClarityType.UInt) throw new Error('accumulated-lp-fees not uint');
	return BigInt(v.value);
}

function totalStakes(marketId: number, user: string): bigint {
	const { result } = simnet.callReadOnlyFn(marketScalingCPMM, 'get-market-data', [Cl.uint(marketId)], user);
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

/** scalar predict-category takes a category index (uint), not a string. */
function predict(user: string, marketId: number, index: number, amount: number) {
	return simnet.callPublicFn(
		marketScalingCPMM,
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.uint(index), Cl.principal(stxToken), Cl.uint(amount * 2)],
		user
	);
}

function sell(user: string, marketId: number, index: number, sharesIn: number) {
	return simnet.callPublicFn(
		marketScalingCPMM,
		'sell-category',
		[Cl.uint(marketId), Cl.uint(0), Cl.uint(index), wrappedStx, Cl.uint(sharesIn)],
		user
	);
}

function addLiquidity(user: string, marketId: number, amount: number, expectedTotal: bigint) {
	return simnet.callPublicFn(
		marketScalingCPMM,
		'add-liquidity',
		[Cl.uint(marketId), Cl.uint(amount), Cl.uint(expectedTotal), Cl.uint(10_000), wrappedStx],
		user
	);
}

function removeLiquidity(user: string, marketId: number, amount: number) {
	return simnet.callPublicFn(marketScalingCPMM, 'remove-liquidity', [Cl.uint(marketId), Cl.uint(amount), Cl.uint(0), wrappedStx], user);
}

function claimLpFees(user: string, marketId: number) {
	return simnet.callPublicFn(marketScalingCPMM, 'claim-lp-fees', [Cl.uint(marketId), wrappedStx], user);
}

function claimWinnings(user: string, marketId: number) {
	return simnet.callPublicFn(marketScalingCPMM, 'claim-winnings', [Cl.uint(marketId), Cl.principal(stxToken)], user);
}

async function resolveAndConclude(marketId: number) {
	simnet.mineEmptyBlocks(288);
	const r = simnet.callPublicFn(marketScalingCPMM, 'resolve-market', [Cl.uint(marketId)], bob);
	expect(r.result.type).toBe(ClarityType.ResponseOk);
	simnet.mineEmptyBlocks(25);
	const c = simnet.callPublicFn(marketScalingCPMM, 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	expect(c.result).toEqual(Cl.ok(Cl.bool(true)));
}

describe('scalar create-market: market-mechanism', () => {
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
		expect(createMarket({ raw: 0 }).result).toEqual(Cl.error(Cl.uint(ERR_INVALID_MECHANISM)));
	});

	it('rejects (some u3) with err-invalid-mechanism', async () => {
		await constructDao(simnet);
		expect(createMarket({ raw: 3 }).result).toEqual(Cl.error(Cl.uint(ERR_INVALID_MECHANISM)));
	});

	it('rejects (some u99) with err-invalid-mechanism', async () => {
		await constructDao(simnet);
		expect(createMarket({ raw: 99 }).result).toEqual(Cl.error(Cl.uint(ERR_INVALID_MECHANISM)));
	});
});

describe('scalar KNOCKOUT mechanism: function gates', () => {
	it('predict-category is allowed', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(predict(alice, 0, 0, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
	});

	it('predict-category does not accumulate LP fees', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getAccumulatedLpFees(0, alice)).toBe(0n);
		expect(predict(alice, 0, 0, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(getAccumulatedLpFees(0, alice)).toBe(0n);
	});

	it('sell-category errors with err-sell-not-permitted', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(predict(alice, 0, 0, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		const r = sell(alice, 0, 0, 100_000);
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
		expect(predict(alice, 0, 0, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		const r = removeLiquidity(alice, 0, 100_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MECHANISM_NOT_SUPPORTED)));
	});

	it('claim-lp-fees errors with err-mechanism-not-supported', async () => {
		await constructDao(simnet);
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		const r = claimLpFees(alice, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MECHANISM_NOT_SUPPORTED)));
	});

	it('claim-winnings works after KNOCKOUT market resolves (winning category)', async () => {
		// bdbp001-set-manual-fallback registers fallback prices for market ids 0/1/2 at u9_500_000.
		// scalar resolution falls back to that price when the oracle drift exceeds max-move-bips,
		// so the winning band is determined by where 9_500_000 lands relative to the start price.
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		expect(createMarket('knockout').result).toEqual(Cl.ok(Cl.uint(0)));
		// alice picks index 3, bob picks index 1 — one will win, one will lose
		expect(predict(alice, 0, 3, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(bob, 0, 1, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		await resolveAndConclude(0);
		// at least one of them must be able to claim (winner exists by construction)
		const aliceClaim = claimWinnings(alice, 0);
		const bobClaim = claimWinnings(bob, 0);
		const oneWon = aliceClaim.result.type === ClarityType.ResponseOk || bobClaim.result.type === ClarityType.ResponseOk;
		expect(oneWon).toBe(true);
	});
});

describe('scalar AMM mechanism: full functionality', () => {
	it('predict-category accumulates LP fees', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getAccumulatedLpFees(0, alice)).toBe(0n);
		expect(predict(alice, 0, 0, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(getAccumulatedLpFees(0, alice)).toBeGreaterThan(0n);
	});

	it('all LP functions are accepted (smoke test through full LP lifecycle)', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));

		const total = totalStakes(0, alice);
		expect(addLiquidity(alice, 0, 1_000_000, total).result.type).toBe(ClarityType.ResponseOk);

		expect(predict(bob, 0, 0, 2_000_000).result.type).toBe(ClarityType.ResponseOk);

		// alice received proportional shares across all 6 categories, so she can sell some of index 0
		expect(sell(alice, 0, 0, 50_000).result.type).toBe(ClarityType.ResponseOk);

		expect(removeLiquidity(alice, 0, 100_000).result.type).toBe(ClarityType.ResponseOk);

		expect(claimLpFees(alice, 0).result.type).toBe(ClarityType.ResponseOk);
	});

	it('claim-winnings works after AMM market resolves', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		expect(predict(alice, 0, 3, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		expect(predict(bob, 0, 1, 2_000_000).result.type).toBe(ClarityType.ResponseOk);
		await resolveAndConclude(0);
		const aliceClaim = claimWinnings(alice, 0);
		const bobClaim = claimWinnings(bob, 0);
		const oneWon = aliceClaim.result.type === ClarityType.ResponseOk || bobClaim.result.type === ClarityType.ResponseOk;
		expect(oneWon).toBe(true);
	});
});

describe('scalar gate ordering sanity', () => {
	it('claim-lp-fees on AMM with no LP position still returns err-no-lp-position', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		const r = claimLpFees(alice, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_NO_LP_POSITION)));
	});

	it('remove-liquidity on AMM with no stakes still returns err-user-not-staked', async () => {
		await constructDao(simnet);
		expect(createMarket('amm').result).toEqual(Cl.ok(Cl.uint(0)));
		const r = removeLiquidity(alice, 0, 100_000);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_USER_NOT_STAKED)));
	});
});
