import { GateKeeper } from '@mijoco/stx_helpers/dist/index.js';
import { marketGatingCollection, marketInterestCollection } from '../../lib/data/db_models.js';
import { ObjectId } from 'mongodb';

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function fetchCreateMarketMerkleInput(): Promise<GateKeeper> {
	const result = await marketGatingCollection.findOne({
		gateType: 'create-market'
	});
	return result as unknown as GateKeeper;
}

export async function registerInterest(email: string): Promise<any> {
	let result = false;
	try {
		const o = {
			_id: new ObjectId(),
			email: email
		};
		const result = await marketInterestCollection.insertOne(o);
		return result;
	} catch (err: any) {
		result = false;
	}
	return result;
}
