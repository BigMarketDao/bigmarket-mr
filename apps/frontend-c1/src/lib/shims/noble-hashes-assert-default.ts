/**
 * ethereum-cryptography uses `import assert from "@noble/hashes/_assert"` expecting
 * `{ bytes, bool }`. Noble 1.x ESM only has named exports — provide a default for bundlers.
 */
import { abytes } from '@noble/hashes/utils';

export default {
	bytes: abytes,
	bool(b: unknown) {
		if (typeof b !== 'boolean') throw new Error('boolean expected');
	},
};
