import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, constructDao, deployer, marketScalingCPMM, metadataHash, reputationSft, stxToken } from '../dao_helpers';

const USD0 = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
const USD1 = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
const USD2 = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17';
const USD3 = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

async function assertBalance(user: string, tier: number, balance: number) {
	let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(tier), Cl.principal(user)], user);
	expect(bal.result).toEqual(Cl.ok(Cl.uint(balance * 2)));
}

const lion = 0;
const tiger = 1;
const cheetah = 2;

describe('claiming errors', () => {
	it('err too few categories', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(
			marketScalingCPMM,
			'create-market',
			[
				// Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) })]),
				Cl.none(),
				Cl.principal(stxToken),
				Cl.bufferFromHex(metadataHash()),
				Cl.list([]),
				Cl.principal(`${deployer}.bme022-0-market-gating`),
				Cl.none(),
				Cl.none(),
				Cl.bufferFromHex(USD0),
				Cl.uint(100000000),
				Cl.none(),
				Cl.none()
			],
			deployer
		);
		//expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('create binary market ok', async () => {
		await constructDao(simnet);
		let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-price-band-width', [Cl.bufferFromHex(USD0)], alice);
		console.log('create binary market ok', data.result.value.value);
		await createBinaryMarket(0);
	});
});

export async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
	let response = simnet.callPublicFn(
		marketScalingCPMM,
		'create-market',
		[
			// Cl.list([Cl.tuple({ min: Cl.uint( 100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(USD0),
			Cl.uint(100000000),
			Cl.none(),
			Cl.none()
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	return response;
}
