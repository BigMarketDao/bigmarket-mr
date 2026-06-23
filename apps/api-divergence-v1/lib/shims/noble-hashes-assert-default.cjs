/**
 * CJS shim for ethereum-cryptography: `import assert from "@noble/hashes/_assert"`.
 */
const { abytes } = require('@noble/hashes/utils');

const assert = {
	bytes: abytes,
	bool(b) {
		if (typeof b !== 'boolean') throw new Error('boolean expected');
	},
};

module.exports = {
	__esModule: true,
	default: assert,
	bytes: abytes,
	bool: assert.bool,
};
