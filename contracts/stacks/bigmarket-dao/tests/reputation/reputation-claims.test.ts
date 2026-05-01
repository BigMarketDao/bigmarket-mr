import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, fred, passProposalByCoreVote, reputationSft, tom } from '../dao_helpers';

// Mainnet defaults baked into bme030-0-reputation-token: reward-per-epoch = 10,000 BIG.
const REWARD_PER_EPOCH = 10_000_000_000n;

// passProposalByCoreVote concludes via bme001-0-proposal-voting.conclude, which
// mints 3 tier-11 tokens to bob (the helper's voter/concluder). Bootstrap sets
// tier-11 weight = 5, so bob accumulates 15 weighted rep per call. Bob's
// join-epoch is therefore 0 in every test that calls passProposalByCoreVote.
const BOB_REP_PER_CONCLUDE = 15n;

// Mirrors the contract's per-epoch share formula (the SCALE factor cancels out).
const sharePerEpoch = (rep: bigint, total: bigint): bigint => (rep * REWARD_PER_EPOCH) / total;

// ---------------------------------------------------------------------------
// Edge cases
//
// passProposalByCoreVote consumes ~220 burn blocks. Bootstrap sets
// epoch-duration = 1000, so a single proposal stays in epoch 0; mineEmptyBlocks
// is needed to cross epoch boundaries.
// ---------------------------------------------------------------------------
describe('reputation claim - edge cases', () => {
	it('returns 0 immediately after launch (no full epoch elapsed)', async () => {
		await constructDao(simnet);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('returns 0 for users with no reputation', async () => {
		await constructDao(simnet);
		simnet.mineEmptyBlocks(4000);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred).result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('returns 0 in the same epoch the user joined (claim-epoch < min-claim)', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(0)));
	});
});

// ---------------------------------------------------------------------------
// Basic mechanics
// ---------------------------------------------------------------------------
describe('reputation claim - basic mechanics', () => {
	it('is idempotent within the same epoch', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		simnet.mineEmptyBlocks(2000);

		// alice 1000, bob's voting bonus 15, total 1015.
		const expected = sharePerEpoch(1000n, 1000n + BOB_REP_PER_CONCLUDE);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(expected)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('advances last-claimed-epoch by epochs-to-pay', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		simnet.mineEmptyBlocks(3000);
		expect(simnet.callReadOnlyFn(reputationSft, 'get-epoch', [], alice).result).toEqual(Cl.uint(3));

		const perEpoch = sharePerEpoch(1000n, 1000n + BOB_REP_PER_CONCLUDE);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(2n * perEpoch)));
		expect(simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(alice)], alice).result).toEqual(Cl.uint(2));
	});

	it('claim share is stable epoch-over-epoch when rep does not change', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		const perEpoch = sharePerEpoch(1000n, 1000n + BOB_REP_PER_CONCLUDE);

		simnet.mineEmptyBlocks(2000);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(perEpoch)));
		simnet.mineEmptyBlocks(1000);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(perEpoch)));
		simnet.mineEmptyBlocks(1000);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(perEpoch)));
	});
});

// ---------------------------------------------------------------------------
// Cross-epoch consistency
// ---------------------------------------------------------------------------
describe('reputation claim - cross-epoch consistency', () => {
	it('per-epoch share is fixed when rep is stable, single and batched calls match', async () => {
		await constructDao(simnet);
		// bdp001-sft-tokens-1: alice and bob each tier-1=1000 + tier-2=10
		// (weighted 1010 each). Plus bob's voting bonus -> total 2035.
		await passProposalByCoreVote('bdp001-sft-tokens-1');
		const total = 2020n + BOB_REP_PER_CONCLUDE;
		const aliceShare = sharePerEpoch(1010n, total);
		const bobShare = sharePerEpoch(1010n + BOB_REP_PER_CONCLUDE, total);

		simnet.mineEmptyBlocks(2000);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(aliceShare)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob).result).toEqual(Cl.ok(Cl.uint(bobShare)));

		simnet.mineEmptyBlocks(1000);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(aliceShare)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob).result).toEqual(Cl.ok(Cl.uint(bobShare)));

		// Skip an epoch then back-fill: 2 epochs each.
		simnet.mineEmptyBlocks(2000);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(2n * aliceShare)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob).result).toEqual(Cl.ok(Cl.uint(2n * bobShare)));

		expect(simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(alice)], alice).result).toEqual(Cl.uint(4));
		expect(simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(bob)], bob).result).toEqual(Cl.uint(4));

		// Conservation: per-epoch sum of all claimants is at most REWARD_PER_EPOCH
		// and within a few units of it (rounding loss bounded by claimant count).
		const perEpochSum = aliceShare + bobShare;
		expect(perEpochSum).toBeLessThanOrEqual(REWARD_PER_EPOCH);
		expect(REWARD_PER_EPOCH - perEpochSum).toBeLessThanOrEqual(2n);
	});

	it('reward share is proportional to weighted rep with bounded rounding loss', async () => {
		await constructDao(simnet);
		// alice 2000, bob 1000 + 15 (voting) = 1015, total 3015.
		await passProposalByCoreVote('bdp001-claim-uneven');
		simnet.mineEmptyBlocks(2000);

		const total = 3000n + BOB_REP_PER_CONCLUDE;
		const aliceShare = sharePerEpoch(2000n, total);
		const bobShare = sharePerEpoch(1000n + BOB_REP_PER_CONCLUDE, total);

		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(aliceShare)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob).result).toEqual(Cl.ok(Cl.uint(bobShare)));

		// Alice's stake is roughly 2x bob's (2000 vs 1015) -> alice's share is
		// roughly 2x bob's. Conservation holds to within rounding.
		expect(aliceShare).toBeGreaterThan(bobShare);
		const perEpochSum = aliceShare + bobShare;
		expect(perEpochSum).toBeLessThanOrEqual(REWARD_PER_EPOCH);
		expect(REWARD_PER_EPOCH - perEpochSum).toBeLessThanOrEqual(2n);
	});

	it('batched back-fill matches per-epoch payouts when rep is stable', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		simnet.mineEmptyBlocks(4000);

		// 3 epochs claimable in one batched call; rep is stable.
		const perEpoch = sharePerEpoch(1000n, 1000n + BOB_REP_PER_CONCLUDE);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(3n * perEpoch)));
		expect(simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(alice)], alice).result).toEqual(Cl.uint(3));
	});
});

// ---------------------------------------------------------------------------
// Mid-epoch state changes must NOT retroactively change historic claims.
//
// The contract reconstructs end-of-claim-epoch state by adding back the
// current epoch's burns and subtracting its mints. These tests pin that
// reconstruction. Each test runs two passProposalByCoreVote calls, so bob
// gains 2 * BOB_REP_PER_CONCLUDE - the second call is intentionally placed
// in the claim epoch and must be subtracted out.
// ---------------------------------------------------------------------------
describe('reputation claim - mid-epoch state changes', () => {
	it('mint in current epoch does not inflate prior epoch claim', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice'); // conclude #1 (epoch 0)
		simnet.mineEmptyBlocks(2000); // -> epoch 2

		// End-of-epoch-1 state: alice 1000, bob 15, total 1015.
		const expected = sharePerEpoch(1000n, 1000n + BOB_REP_PER_CONCLUDE);

		// Conclude #2 in epoch 2 mints alice another 1000 AND bob another 15.
		// The reconstruction must subtract both.
		await passProposalByCoreVote('bdp001-claim-mint-alice-extra');
		expect(simnet.callReadOnlyFn(reputationSft, 'get-epoch', [], alice).result).toEqual(Cl.uint(2));

		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(expected)));
	});

	it('burn in current epoch does not deflate prior epoch claim', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(2000);

		// End-of-epoch-1 state: alice 1010, bob 1025, total 2035.
		const total = 2020n + BOB_REP_PER_CONCLUDE;
		const aliceExpected = sharePerEpoch(1010n, total);
		const bobExpected = sharePerEpoch(1010n + BOB_REP_PER_CONCLUDE, total);

		// Conclude #2 mints bob +15; proposal then burns 500 of alice's tier-1.
		await passProposalByCoreVote('bdp001-claim-burn-alice');
		expect(simnet.callReadOnlyFn(reputationSft, 'get-epoch', [], alice).result).toEqual(Cl.uint(2));

		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(aliceExpected)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob).result).toEqual(Cl.ok(Cl.uint(bobExpected)));
	});

	it('transfer in current epoch is supply-conservative for prior epoch claim', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(2000);

		const total = 2020n + BOB_REP_PER_CONCLUDE;
		const aliceExpected = sharePerEpoch(1010n, total);
		const bobExpected = sharePerEpoch(1010n + BOB_REP_PER_CONCLUDE, total);

		// Sender side modeled as current-epoch burn-by-sender, recipient side as
		// current-epoch mint-by-recipient. Global mint/burn totals untouched
		// (transfer is supply-conservative). Bob's voting mint IS in global
		// minted-in-epoch and must be subtracted.
		await passProposalByCoreVote('bdp001-claim-transfer');

		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(aliceExpected)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob).result).toEqual(Cl.ok(Cl.uint(bobExpected)));
	});
});

// ---------------------------------------------------------------------------
// Joining and tier weights
// ---------------------------------------------------------------------------
describe('reputation claim - joining and tier weights', () => {
	it('late joiner only claims from join epoch onwards', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		simnet.mineEmptyBlocks(2000);

		await passProposalByCoreVote('bdp001-claim-mint-tom'); // tom mint in epoch 2
		expect(simnet.callReadOnlyFn(reputationSft, 'get-join-epoch', [Cl.principal(tom)], tom).result).toEqual(Cl.uint(2));

		// claim-epoch=1 < tom.joined=2 -> nothing yet.
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom).result).toEqual(Cl.ok(Cl.uint(0)));

		simnet.mineEmptyBlocks(1000);

		// At epoch 3 tom claims epoch 2 only.
		// End-of-epoch-2 total: alice 1000 + bob (2 * 15) + tom 1000 = 2030.
		const total = 1000n + 2n * BOB_REP_PER_CONCLUDE + 1000n;
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom).result).toEqual(Cl.ok(Cl.uint(sharePerEpoch(1000n, total))));
		expect(simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(tom)], tom).result).toEqual(Cl.uint(2));
	});

	it('claiming eagerly retains a higher per-period payout than lazy claiming', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		simnet.mineEmptyBlocks(2000);

		// Alice claims epoch 1 BEFORE tom joins -> larger denominator-free share.
		const eagerEpoch1 = sharePerEpoch(1000n, 1000n + BOB_REP_PER_CONCLUDE);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(eagerEpoch1)));

		await passProposalByCoreVote('bdp001-claim-mint-tom');
		simnet.mineEmptyBlocks(1000);

		// Alice claims epoch 2 with tom present.
		const totalEpoch2 = 1000n + 2n * BOB_REP_PER_CONCLUDE + 1000n;
		const eagerEpoch2 = sharePerEpoch(1000n, totalEpoch2);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(eagerEpoch2)));

		// Lazy alternative: alice would back-fill both epochs at the current snapshot.
		const lazyEquivalent = 2n * sharePerEpoch(1000n, totalEpoch2);
		expect(eagerEpoch1 + eagerEpoch2).toBeGreaterThan(lazyEquivalent);
	});

	it('lazy claim across a supply change pays the contracts current-snapshot approximation', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		simnet.mineEmptyBlocks(2000);

		// Tom joins WITHOUT alice claiming first.
		await passProposalByCoreVote('bdp001-claim-mint-tom');
		simnet.mineEmptyBlocks(1000);

		// Both back-filled epochs are paid using the current snapshot.
		const total = 1000n + 2n * BOB_REP_PER_CONCLUDE + 1000n;
		const lazyShare = 2n * sharePerEpoch(1000n, total);
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(lazyShare)));
	});

	it('tier weight scales claim share, not raw balance', async () => {
		await constructDao(simnet);
		// alice tier-10 amount 100 (weight 5) -> 500 weighted
		// bob   tier-1  amount 500 (weight 1) -> 500 weighted, plus 15 voting.
		await passProposalByCoreVote('bdp001-claim-tier-mix');
		simnet.mineEmptyBlocks(2000);

		const total = 500n + 500n + BOB_REP_PER_CONCLUDE;
		const aliceShare = sharePerEpoch(500n, total);
		const bobShare = sharePerEpoch(500n + BOB_REP_PER_CONCLUDE, total);

		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(aliceShare)));
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob).result).toEqual(Cl.ok(Cl.uint(bobShare)));

		// Raw balances differ ~5x but the underlying tier-weight portions match:
		// alice's share equals bob's share computed without the voting bonus.
		expect(aliceShare).toEqual(sharePerEpoch(500n, total));

		expect(simnet.callReadOnlyFn(reputationSft, 'get-overall-balance', [Cl.principal(alice)], alice).result).toEqual(Cl.ok(Cl.uint(100)));
		// bob holds 500 tier-1 + 3 tier-11 (the conclude bonus) -> overall ft balance = 503.
		expect(simnet.callReadOnlyFn(reputationSft, 'get-overall-balance', [Cl.principal(bob)], alice).result).toEqual(Cl.ok(Cl.uint(503)));
	});
});

// ---------------------------------------------------------------------------
// Back-fill cap (MAX_BACKFILL = 12)
// ---------------------------------------------------------------------------
describe('reputation claim - backfill cap', () => {
	it('caps backfill at 12 epochs per call and continues across calls', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-claim-mint-alice');
		simnet.mineEmptyBlocks(20000); // ~epoch 20

		const perEpoch = sharePerEpoch(1000n, 1000n + BOB_REP_PER_CONCLUDE);

		// First call pays the 12-epoch cap.
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(12n * perEpoch)));
		expect(simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(alice)], alice).result).toEqual(Cl.uint(12));

		// Second call pays the remaining 7 epochs (13..19).
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(7n * perEpoch)));
		expect(simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(alice)], alice).result).toEqual(Cl.uint(19));

		// Nothing further until the chain advances.
		expect(simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice).result).toEqual(Cl.ok(Cl.uint(0)));
	});
});
