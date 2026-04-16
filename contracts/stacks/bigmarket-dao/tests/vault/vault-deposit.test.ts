import { Cl, principalCV, uintCV } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, constructDao, stxToken, tpepeToken } from '../dao_helpers';

const vault = 'bme050-0-vault';

describe('vault deposit', () => { 
	it('successful deposit', async () => {
		await constructDao(simnet);
 
		let tx = simnet.callPublicFn(vault, 'deposit', [Cl.principal(stxToken), Cl.uint(1000)], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(1000)));
	});

	it('amount = 0 fails', async () => {
		await constructDao(simnet); 

		let tx = simnet.callPublicFn(vault, 'deposit', [Cl.principal(stxToken), Cl.uint(0)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(101)));
	});

	it('token not allowed fails', async () => {
		await constructDao(simnet);

		const tx = simnet.callPublicFn(vault, 'deposit', [Cl.principal(tpepeToken), Cl.uint(1)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(102)));
	});

	it('balance updates correctly', async () => {
		await constructDao(simnet);

		let tx = simnet.callPublicFn(vault, 'deposit', [Cl.principal(stxToken), Cl.uint(1000)], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(1000)));

		let bal = simnet.getMapEntry(
			vault,
			'balances',
			Cl.tuple({
				user: principalCV(alice),
				token: principalCV(stxToken)
			})
		);
		expect(bal).toEqual(Cl.some(uintCV(1000)));

		tx = simnet.callPublicFn(vault, 'deposit', [Cl.principal(stxToken), Cl.uint(2345)], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(2345)));

		bal = simnet.getMapEntry(
			vault,
			'balances',
			Cl.tuple({
				user: principalCV(alice),
				token: principalCV(stxToken)
			})
		);
		expect(bal).toEqual(Cl.some(uintCV(3345)));
	});
});

