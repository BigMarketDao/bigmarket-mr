import { Cl, ClarityType, contractPrincipalCV, principalCV, serializeCVBytes } from '@stacks/transactions';
import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { beforeAll, describe, expect, it } from 'vitest';
import { alice, betty, bob, BTCUSD, constructDao, deployer, metadataHash, passProposalByCoreVote, tom } from '../dao_helpers';

// Provide a synchronous HMAC-SHA256 for @noble/secp256k1@1.x signSync().
beforeAll(() => {
	(secp.utils as any).hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
		const h = hmac.create(sha256, key);
		for (const m of msgs) h.update(m);
		return h.digest();
	};
});

const vault = 'bme050-0-vault';
const sbtcName = 'sbtc';
const wrappedStxName = 'wrapped-stx';

const CHAIN_EVM = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
const CHAIN_BTC = new Uint8Array([0x00, 0x00, 0x00, 0x02]);
const CHAIN_STACKS = new Uint8Array([0x00, 0x00, 0x00, 0x03]);
const CHAIN_BAD = new Uint8Array([0x00, 0x00, 0x00, 0x09]);

const ZERO_32 = new Uint8Array(32);

const BMP1_MAGIC = new Uint8Array([0x42, 0x4d, 0x50, 0x31, 0x4d, 0x53, 0x47, 0x00]);
const OP_WITHDRAW = 0x01;
const OP_BUY_SHARES = 0x02;
const OP_SELL_SHARES = 0x03;
const OP_CLAIM_WINNINGS = 0x04;
const BMP1_VERSION = 0x01;

// EIP-712 constants — must match bme050-0-vault.clar exactly.
// keccak256("BMP1Withdraw(address controller,uint256 amount,uint256 nonce,bytes32 bmp1Hash)")
const EIP712_TYPEHASH = new Uint8Array([
	0xf1, 0xeb, 0xe4, 0x5c, 0x92, 0x52, 0xe5, 0x9f, 0x16, 0xc9, 0xea, 0xed, 0x22, 0x3a, 0x77, 0x0a,
	0x5d, 0x40, 0xb6, 0xb8, 0xbc, 0x14, 0x50, 0x7a, 0x83, 0xcc, 0x68, 0xa1, 0x49, 0xd6, 0x44, 0xba
]);
// keccak256(domainTypeHash || keccak256("BigMarket") || keccak256("1.0.0"))
const EIP712_DOMAIN_SEP = new Uint8Array([
	0x4e, 0x3c, 0x71, 0x55, 0xc4, 0x29, 0xf3, 0x6e, 0x33, 0xb8, 0x49, 0x8e, 0xc2, 0x58, 0xc6, 0x59,
	0xf3, 0x93, 0xec, 0x00, 0xd8, 0x43, 0x48, 0x84, 0xb7, 0x24, 0x72, 0x30, 0x4c, 0x45, 0x68, 0x1d
]);

/** Compute the EIP-712 digest for BMP1Withdraw — mirrors verify-evm in the vault contract. */
function eip712Digest(message: Uint8Array): Uint8Array {
	const bmp1Hash     = keccak_256(message);
	const controller   = message.slice(16, 48);   // OFF_CONTROLLER
	const slot3        = message.slice(160, 192);  // OFF_SLOT3 (amount)
	const nonce16      = message.slice(48, 64);    // OFF_NONCE
	const nonce32      = concatBytes(new Uint8Array(16), nonce16);
	const structEncoded = concatBytes(EIP712_TYPEHASH, controller, slot3, nonce32, bmp1Hash);
	const structHash   = keccak_256(structEncoded);
	return keccak_256(concatBytes(new Uint8Array([0x19, 0x01]), EIP712_DOMAIN_SEP, structHash));
}

// ── SIP-018 signing constants ─────────────────────────────────────────────────
// ASCII "SIP018" prefix used in the SIP-018 structured-data digest.
const SIP018_PREFIX = new Uint8Array([0x53, 0x49, 0x50, 0x30, 0x31, 0x38]);

// sha256(serializeCV({ name: "BigMarket", version: "1.0.0", chain-id: 2147483648 }))
// Simnet addresses are ST... (testnet version byte) so always use the testnet domain hash.
const BMP1_DOMAIN_HASH_TESTNET = new Uint8Array([
	0x45, 0x0c, 0x6f, 0x4e, 0x56, 0xf5, 0x33, 0x6c, 0xfe, 0xef, 0x9b, 0x23, 0x58, 0x11, 0x01, 0x53,
	0x61, 0xf8, 0xc1, 0x2a, 0x14, 0x6e, 0x35, 0xe9, 0x67, 0x83, 0xb9, 0x4b, 0x36, 0x77, 0xf2, 0x6e,
]);

type StacksKey = {
	privKey: Uint8Array;
	/** Compressed secp256k1 public key (33 bytes). */
	compressed: Uint8Array;
	/** hash160(compressed) = ripemd160(sha256(compressed)) — 20 bytes. */
	hash160Bytes: Uint8Array;
	/** Left-padded 32-byte controller slot. */
	controller32: Uint8Array;
};

/**
 * Build a StacksKey from a raw 32-byte private key.
 * The key must match an account address whose hash160 is known — in tests we
 * use the well-known simnet wallet keys from Devnet.toml.
 */
function stacksKeyFromPriv(privHex: string): StacksKey {
	const privKey = Buffer.from(privHex, 'hex');
	const compressed = secp.getPublicKey(privKey, true); // 33 bytes
	const hash160Bytes = ripemd160(sha256(compressed));
	return { privKey, compressed, hash160Bytes, controller32: padAddress20(hash160Bytes) };
}

/**
 * alice's key from Devnet.toml wallet_1.
 * Address: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
 */
function aliceStacksKey(): StacksKey {
	return stacksKeyFromPriv('7287ba251d44a4d3fd9276c88ce34c5c52a038955511cccaf77e61068649c178');
}

/**
 * Compute the SIP-018 digest for the human-readable BMP1Withdraw tuple.
 *
 * The tuple matches `buildWithdrawMessageCv` in the TypeScript SDK and is
 * reconstructed by `verify-stacks-sip18` in the vault contract.
 *
 * Key ordering (lexicographic): amount < bmp1-hash < nonce < operation < recipient < token.
 */
function sip18WithdrawDigest(
	message: Uint8Array,
	tokenCV: ReturnType<typeof contractPrincipalCV>,
	recipientCV: ReturnType<typeof principalCV>,
	amount: bigint | number,
	nonce: bigint | number,
): Uint8Array {
	const amt = typeof amount === 'bigint' ? amount : BigInt(amount);
	const nc  = typeof nonce  === 'bigint' ? nonce  : BigInt(nonce);
	const bmp1Hash = sha256(message);

	const messageTuple = Cl.tuple({
		amount:    Cl.uint(amt),
		'bmp1-hash': Cl.buffer(bmp1Hash),
		nonce:     Cl.uint(nc),
		operation: Cl.stringAscii('withdraw'),
		recipient: recipientCV,
		token:     tokenCV,
	});

	const msgCvHash = sha256(serializeCVBytes(messageTuple));
	return sha256(concatBytes(SIP018_PREFIX, BMP1_DOMAIN_HASH_TESTNET, msgCvHash));
}

/**
 * Sign a BMP1 message for CHAIN_STACKS verification.
 *
 * Returns a 65-byte RSV secp256k1 signature — the same format expected by
 * `secp256k1-recover?` in the vault contract.
 */
function signStacks(
	message: Uint8Array,
	key: StacksKey,
	tokenCV: ReturnType<typeof contractPrincipalCV>,
	recipientCV: ReturnType<typeof principalCV>,
	amount: bigint | number,
	nonce: bigint | number,
): Uint8Array {
	const digest = sip18WithdrawDigest(message, tokenCV, recipientCV, amount, nonce);
	const [sig, recovery] = secp.signSync(digest, key.privKey, { der: false, recovered: true, canonical: true });
	const out = new Uint8Array(65);
	out.set(sig, 0);
	out[64] = recovery;
	return out;
}

/** Errors from bme050-0-vault.clar */
const ERR_INVALID_AMOUNT = 7101;
const ERR_TOKEN_NOT_ALLOWED = 7102;
const ERR_INSUFFICIENT_BALANCE = 7103;
const ERR_INVALID_NONCE = 7104;
const ERR_ALREADY_SWEPT = 7105;
const ERR_SIG_VERIFICATION = 7106;
const ERR_ADDRESS_MISMATCH = 7107;
const ERR_UNSUPPORTED_CHAIN = 7108;
const ERR_INVALID_ADDRESS = 7109;
const ERR_MSG_MAGIC = 7110;
const ERR_MSG_VERSION = 7111;
const ERR_MSG_OPCODE = 7112;
const ERR_TOKEN_COMMIT = 7113;
const ERR_MAPPED_COMMIT = 7114;
const ERR_RECIPIENT_COMMIT = 7115;
const ERR_EXPIRED = 7116;
const ERR_PUBKEY_MISMATCH = 7117;
const ERR_SIG_SCHEME = 7118;

const sbtcTrait = () => contractPrincipalCV(deployer, sbtcName);
const wrappedStxTrait = () => contractPrincipalCV(deployer, wrappedStxName);
const sbtcPrincipal = `${deployer}.${sbtcName}`;

/** Enable the vault extension and whitelist sBTC + wrapped-stx via a DAO proposal. */
async function setupVault() {
	await constructDao(simnet);
	await passProposalByCoreVote('bdp001-vault-setup');
}

function padAddress20(addr20: Uint8Array): Uint8Array {
	if (addr20.length !== 20) throw new Error(`expected 20-byte address, got ${addr20.length}`);
	const out = new Uint8Array(32);
	out.set(addr20, 12);
	return out;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
	const total = parts.reduce((acc, p) => acc + p.length, 0);
	const out = new Uint8Array(total);
	let off = 0;
	for (const p of parts) {
		out.set(p, off);
		off += p.length;
	}
	return out;
}

function uintToBe16(value: bigint | number): Uint8Array {
	const v = typeof value === 'bigint' ? value : BigInt(value);
	const out = new Uint8Array(16);
	let n = v;
	for (let i = 15; i >= 0; i--) {
		out[i] = Number(n & 0xffn);
		n >>= 8n;
	}
	return out;
}

function slotLowUint(value: bigint | number): Uint8Array {
	return concatBytes(new Uint8Array(16), uintToBe16(value));
}

type EvmKey = {
	privKey: Uint8Array;
	/** Uncompressed pubkey without the 0x04 prefix — X||Y (64 bytes). */
	uncompressed: Uint8Array;
	/** Padded 32-byte controller address slot. */
	controller32: Uint8Array;
	/** Raw 20-byte EVM address. */
	address20: Uint8Array;
};

function newEvmKey(seed: number): EvmKey {
	const privKey = new Uint8Array(32);
	// Deterministic, non-zero key: write seed into the last 4 bytes.
	privKey[28] = (seed >>> 24) & 0xff;
	privKey[29] = (seed >>> 16) & 0xff;
	privKey[30] = (seed >>> 8) & 0xff;
	privKey[31] = seed & 0xff;
	privKey[0] = 0x01; // make sure the scalar is well within [1, n-1]
	// 65-byte uncompressed = 0x04 || X || Y
	const full = secp.getPublicKey(privKey, false);
	const uncompressed = full.subarray(1);
	const address20 = keccak_256(uncompressed).slice(12, 32);
	return { privKey, uncompressed, controller32: padAddress20(address20), address20 };
}

type BuildMessageOpts = {
	opcode?: number;
	version?: number;
	magic?: Uint8Array;
	chain?: Uint8Array;
	controller32: Uint8Array;
	nonce?: bigint | number;
	slot0?: Uint8Array;
	slot1?: Uint8Array;
	slot2?: Uint8Array;
	slot3?: Uint8Array;
	slot4?: Uint8Array;
	slot5?: Uint8Array;
};

function buildBmp1(opts: BuildMessageOpts): Uint8Array {
	const msg = new Uint8Array(256);
	msg.set(opts.magic ?? BMP1_MAGIC, 0);
	msg[8] = opts.opcode ?? OP_WITHDRAW;
	msg[9] = opts.version ?? BMP1_VERSION;
	// flags (10..12) stays 0x0000
	msg.set(opts.chain ?? CHAIN_EVM, 12);
	msg.set(opts.controller32, 16);
	msg.set(uintToBe16(opts.nonce ?? 0n), 48);
	if (opts.slot0) msg.set(opts.slot0, 64);
	if (opts.slot1) msg.set(opts.slot1, 96);
	if (opts.slot2) msg.set(opts.slot2, 128);
	if (opts.slot3) msg.set(opts.slot3, 160);
	if (opts.slot4) msg.set(opts.slot4, 192);
	if (opts.slot5) msg.set(opts.slot5, 224);
	return msg;
}

function signEvm(message: Uint8Array, privKey: Uint8Array): Uint8Array {
	const digest = eip712Digest(message);
	const [sig, recovery] = secp.signSync(digest, privKey, { der: false, recovered: true, canonical: true });
	// Clarity secp256k1-recover? expects R(32) || S(32) || V(1) = RSV format
	const out = new Uint8Array(65);
	out.set(sig, 0);   // R || S (compact 64 bytes)
	out[64] = recovery; // V (0 or 1) as last byte
	return out;
}

function commitPrincipal(cv: ReturnType<typeof principalCV> | ReturnType<typeof contractPrincipalCV>): Uint8Array {
	return keccak_256(serializeCVBytes(cv));
}

type WithdrawMaterials = {
	message: Uint8Array;
	signature: Uint8Array;
	pubkey: Uint8Array;
	tokenCV: ReturnType<typeof contractPrincipalCV>;
	mappedCV: ReturnType<typeof principalCV>;
	recipientCV: ReturnType<typeof principalCV>;
};

function buildWithdraw(args: {
	key: EvmKey;
	tokenName?: string;
	mapped: string;
	recipient: string;
	amount: bigint | number;
	nonce?: bigint | number;
	expiry?: bigint | number;
	overrides?: Partial<BuildMessageOpts>;
}): WithdrawMaterials {
	const tokenName = args.tokenName ?? sbtcName;
	const tokenCV = contractPrincipalCV(deployer, tokenName);
	const mappedCV = principalCV(args.mapped);
	const recipientCV = principalCV(args.recipient);

	const message = buildBmp1({
		controller32: args.key.controller32,
		nonce: args.nonce ?? 0n,
		slot0: commitPrincipal(tokenCV),
		slot1: commitPrincipal(mappedCV),
		slot2: commitPrincipal(recipientCV),
		slot3: slotLowUint(args.amount),
		slot4: slotLowUint(args.expiry ?? 0n),
		...(args.overrides ?? {})
	});

	const signature = signEvm(message, args.key.privKey);
	return { message, signature, pubkey: args.key.uncompressed, tokenCV, mappedCV, recipientCV };
}

function callDeposit(sender: string, amount: number | bigint, tokenName = sbtcName) {
	return simnet.callPublicFn(
		vault,
		'deposit',
		[contractPrincipalCV(deployer, tokenName), Cl.uint(amount)],
		sender
	);
}

function callDepositFor(args: {
	sender: string;
	amount: number | bigint;
	tokenName?: string;
	chain?: Uint8Array;
	controller32: Uint8Array;
	mapped: string;
	intent: Uint8Array;
}) {
	return simnet.callPublicFn(
		vault,
		'deposit-for',
		[
			contractPrincipalCV(deployer, args.tokenName ?? sbtcName),
			Cl.uint(args.amount),
			Cl.buffer(args.chain ?? CHAIN_EVM),
			Cl.buffer(args.controller32),
			principalCV(args.mapped),
			Cl.buffer(args.intent)
		],
		args.sender
	);
}

function callWithdraw(sender: string, mats: WithdrawMaterials) {
	return simnet.callPublicFn(
		vault,
		'withdraw',
		[
			Cl.buffer(mats.message),
			Cl.buffer(mats.signature),
			Cl.buffer(mats.pubkey),
			mats.tokenCV,
			mats.mappedCV,
			mats.recipientCV
		],
		sender
	);
}

function getBalance(chain: Uint8Array, controller32: Uint8Array, mapped: string, tokenName = sbtcName): bigint {
	const { result } = simnet.callReadOnlyFn(
		vault,
		'get-balance',
		[Cl.buffer(chain), Cl.buffer(controller32), principalCV(mapped), contractPrincipalCV(deployer, tokenName)],
		alice
	);
	if (result.type !== ClarityType.UInt) throw new Error(`get-balance not uint: ${result.type}`);
	return BigInt(result.value);
}

function getNonce(chain: Uint8Array, controller32: Uint8Array): bigint {
	const { result } = simnet.callReadOnlyFn(vault, 'get-nonce', [Cl.buffer(chain), Cl.buffer(controller32)], alice);
	if (result.type !== ClarityType.UInt) throw new Error(`get-nonce not uint: ${result.type}`);
	return BigInt(result.value);
}

function getSbtcBalance(owner: string): bigint {
	const { result } = simnet.callReadOnlyFn(sbtcName, 'get-balance', [principalCV(owner)], alice);
	if (result.type !== ClarityType.ResponseOk) throw new Error(`sbtc get-balance not ok: ${result.type}`);
	const inner = (result as any).value;
	if (inner.type !== ClarityType.UInt) throw new Error('sbtc balance inner not uint');
	return BigInt(inner.value);
}

function intentId(seed: number): Uint8Array {
	const out = new Uint8Array(32);
	out[31] = seed & 0xff;
	out[30] = (seed >>> 8) & 0xff;
	return out;
}

describe('vault — read-only balance accessors', () => {
	it('get-balance returns u0 for an empty key', async () => {
		await setupVault();
		const k = newEvmKey(1);
		expect(getBalance(CHAIN_EVM, k.controller32, alice)).toBe(0n);
	});

	it('get-nonce returns u0 before any withdrawal', async () => {
		await setupVault();
		const k = newEvmKey(1);
		expect(getNonce(CHAIN_EVM, k.controller32)).toBe(0n);
	});

	it('is-intent-swept returns false for an unseen intent', async () => {
		await setupVault();
		const k = newEvmKey(1);
		const { result } = simnet.callReadOnlyFn(
			vault,
			'is-intent-swept',
			[Cl.buffer(intentId(1)), contractPrincipalCV(deployer, sbtcName), Cl.buffer(CHAIN_EVM), Cl.buffer(k.controller32), principalCV(alice)],
			alice
		);
		expect(result).toEqual(Cl.bool(false));
	});

	it('is-token-allowed-read reflects DAO whitelist', async () => {
		await setupVault();
		const allowed = simnet.callReadOnlyFn(vault, 'is-token-allowed-read', [contractPrincipalCV(deployer, sbtcName)], alice);
		expect(allowed.result).toEqual(Cl.bool(true));
		const random = simnet.callReadOnlyFn(vault, 'is-token-allowed-read', [contractPrincipalCV(deployer, 'tpepe')], alice);
		expect(random.result).toEqual(Cl.bool(false));
	});
});

describe('vault — deposit (Use Case 1: Stacks-native, self-custodied)', () => {
	it('err: amount must be > 0', async () => {
		await setupVault();
		const r = callDeposit(alice, 0);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_AMOUNT)));
	});

	it('err: token must be on the allowlist', async () => {
		await setupVault();
		const r = callDeposit(alice, 1_000, 'tpepe');
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_TOKEN_NOT_ALLOWED)));
	});

	it('ok: credits balance under CHAIN_STACKS keyed by sender hash160', async () => {
		await setupVault();
		const before = getSbtcBalance(alice);
		const vaultBefore = getSbtcBalance(`${deployer}.${vault}`);

		const r = callDeposit(alice, 250_000);
		expect(r.result).toEqual(Cl.ok(Cl.uint(250_000)));

		// SIP-010 moved alice → vault contract
		expect(getSbtcBalance(alice)).toBe(before - 250_000n);
		expect(getSbtcBalance(`${deployer}.${vault}`)).toBe(vaultBefore + 250_000n);

		// Confirm vault credit via the convenience read keyed by Stacks principal
		const r2 = simnet.callReadOnlyFn(vault, 'get-stacks-balance', [principalCV(alice), principalCV(alice), contractPrincipalCV(deployer, sbtcName)], alice);
		expect(r2.result).toEqual(Cl.uint(250_000));
	});

	it('ok: repeated deposits accumulate to the same key', async () => {
		await setupVault();
		expect(callDeposit(alice, 100_000).result.type).toBe(ClarityType.ResponseOk);
		expect(callDeposit(alice, 250_000).result.type).toBe(ClarityType.ResponseOk);

		const r = simnet.callReadOnlyFn(vault, 'get-stacks-balance', [principalCV(alice), principalCV(alice), contractPrincipalCV(deployer, sbtcName)], alice);
		expect(r.result).toEqual(Cl.uint(350_000));
	});
});

describe('vault — deposit-for (Use Case 2: relayer sweep)', () => {
	it('err: amount must be > 0', async () => {
		await setupVault();
		const k = newEvmKey(2);
		const r = callDepositFor({ sender: alice, amount: 0, controller32: k.controller32, mapped: alice, intent: intentId(1) });
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_AMOUNT)));
	});

	it('err: token not whitelisted', async () => {
		await setupVault();
		const k = newEvmKey(2);
		const r = callDepositFor({
			sender: alice,
			amount: 1_000,
			tokenName: 'tpepe',
			controller32: k.controller32,
			mapped: alice,
			intent: intentId(1)
		});
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_TOKEN_NOT_ALLOWED)));
	});

	it('err: unsupported source chain id', async () => {
		await setupVault();
		const k = newEvmKey(2);
		const r = callDepositFor({
			sender: alice,
			amount: 1_000,
			chain: CHAIN_BAD,
			controller32: k.controller32,
			mapped: alice,
			intent: intentId(1)
		});
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_UNSUPPORTED_CHAIN)));
	});

	it('err: zero controller-address rejected', async () => {
		await setupVault();
		const r = callDepositFor({ sender: alice, amount: 1_000, controller32: ZERO_32, mapped: alice, intent: intentId(1) });
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_ADDRESS)));
	});

	it('ok: relayer sweeps to the vault and credits the controller key', async () => {
		await setupVault();
		const k = newEvmKey(3);
		const before = getSbtcBalance(alice);
		const vaultBefore = getSbtcBalance(`${deployer}.${vault}`);

		const r = callDepositFor({ sender: alice, amount: 500_000, controller32: k.controller32, mapped: alice, intent: intentId(7) });
		expect(r.result).toEqual(Cl.ok(Cl.uint(500_000)));

		expect(getSbtcBalance(alice)).toBe(before - 500_000n);
		expect(getSbtcBalance(`${deployer}.${vault}`)).toBe(vaultBefore + 500_000n);
		expect(getBalance(CHAIN_EVM, k.controller32, alice)).toBe(500_000n);

		// Convenience read keyed by the raw 20-byte EVM address
		const r2 = simnet.callReadOnlyFn(
			vault,
			'get-evm-balance',
			[Cl.buffer(k.address20), principalCV(alice), contractPrincipalCV(deployer, sbtcName)],
			alice
		);
		expect(r2.result).toEqual(Cl.uint(500_000));

		// Intent flagged as swept
		const swept = simnet.callReadOnlyFn(
			vault,
			'is-intent-swept',
			[Cl.buffer(intentId(7)), contractPrincipalCV(deployer, sbtcName), Cl.buffer(CHAIN_EVM), Cl.buffer(k.controller32), principalCV(alice)],
			alice
		);
		expect(swept.result).toEqual(Cl.bool(true));
	});

	it('err: replaying the same intent triggers already-swept', async () => {
		await setupVault();
		const k = newEvmKey(4);
		const intent = intentId(42);

		expect(callDepositFor({ sender: alice, amount: 100_000, controller32: k.controller32, mapped: alice, intent }).result).toEqual(Cl.ok(Cl.uint(100_000)));

		const replay = callDepositFor({ sender: alice, amount: 100_000, controller32: k.controller32, mapped: alice, intent });
		expect(replay.result).toEqual(Cl.error(Cl.uint(ERR_ALREADY_SWEPT)));
	});
});

describe('vault — withdraw (Use Case 3: signed BMP1 message)', () => {
	async function setupCreditedVault(amount: bigint, seed = 11): Promise<{ key: EvmKey; mapped: string }> {
		await setupVault();
		const key = newEvmKey(seed);
		// alice acts as the relayer & holds the mapped funds in this slot
		const credit = callDepositFor({ sender: alice, amount, controller32: key.controller32, mapped: alice, intent: intentId(seed) });
		expect(credit.result).toEqual(Cl.ok(Cl.uint(amount)));
		return { key, mapped: alice };
	}

	it('ok: signed withdraw debits the slot, bumps the nonce and pays the recipient', async () => {
		const { key, mapped } = await setupCreditedVault(1_000_000n);
		const recipient = betty;
		const recipientBefore = getSbtcBalance(recipient);
		const vaultBefore = getSbtcBalance(`${deployer}.${vault}`);

		const mats = buildWithdraw({ key, mapped, recipient, amount: 400_000n, nonce: 0n });
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.ok(Cl.uint(400_000)));

		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(600_000n);
		expect(getNonce(CHAIN_EVM, key.controller32)).toBe(1n);
		expect(getSbtcBalance(recipient)).toBe(recipientBefore + 400_000n);
		expect(getSbtcBalance(`${deployer}.${vault}`)).toBe(vaultBefore - 400_000n);
	});

	it('ok: a second withdraw consumes the next nonce', async () => {
		const { key, mapped } = await setupCreditedVault(1_000_000n);
		const recipient = betty;

		expect(callWithdraw(tom, buildWithdraw({ key, mapped, recipient, amount: 100_000n, nonce: 0n })).result).toEqual(Cl.ok(Cl.uint(100_000)));
		expect(callWithdraw(tom, buildWithdraw({ key, mapped, recipient, amount: 50_000n, nonce: 1n })).result).toEqual(Cl.ok(Cl.uint(50_000)));

		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(850_000n);
		expect(getNonce(CHAIN_EVM, key.controller32)).toBe(2n);
	});

	it('err: BMP1 magic is enforced', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({
			key,
			mapped,
			recipient: betty,
			amount: 100_000n,
			overrides: { magic: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) }
		});
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MSG_MAGIC)));
	});

	it('err: BMP1 version mismatch', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n, overrides: { version: 0x02 } });
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MSG_VERSION)));
	});

	it('err: opcode must be OP_WITHDRAW', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n, overrides: { opcode: OP_BUY_SHARES } });
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MSG_OPCODE)));
	});

	it('err: chain ids outside the supported set are rejected', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n, overrides: { chain: CHAIN_BAD } });
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_UNSUPPORTED_CHAIN)));
	});

	it('err: zero amount in slot3', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 0n });
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_AMOUNT)));
	});

	it('err: token-commit must match the token passed', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		// Build a message that commits to sbtc, but pass wrapped-stx as the token parameter
		const message = buildBmp1({
			controller32: key.controller32,
			nonce: 0n,
			slot0: commitPrincipal(contractPrincipalCV(deployer, sbtcName)),
			slot1: commitPrincipal(principalCV(mapped)),
			slot2: commitPrincipal(principalCV(betty)),
			slot3: slotLowUint(100_000),
			slot4: slotLowUint(0)
		});
		const signature = signEvm(message, key.privKey);
		const r = simnet.callPublicFn(
			vault,
			'withdraw',
			[
				Cl.buffer(message),
				Cl.buffer(signature),
				Cl.buffer(key.uncompressed),
				wrappedStxTrait(),
				principalCV(mapped),
				principalCV(betty)
			],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_TOKEN_COMMIT)));
	});

	it('err: mapped-commit mismatch when wrong mapped principal is passed', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n });
		// Tamper: call with bob as mapped (his slot has zero balance and the commit will fail before the balance check)
		const r = simnet.callPublicFn(
			vault,
			'withdraw',
			[
				Cl.buffer(mats.message),
				Cl.buffer(mats.signature),
				Cl.buffer(mats.pubkey),
				mats.tokenCV,
				principalCV(bob),
				mats.recipientCV
			],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MAPPED_COMMIT)));
	});

	it('err: recipient-commit mismatch when payload says betty but call says bob', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n });
		const r = simnet.callPublicFn(
			vault,
			'withdraw',
			[
				Cl.buffer(mats.message),
				Cl.buffer(mats.signature),
				Cl.buffer(mats.pubkey),
				mats.tokenCV,
				mats.mappedCV,
				principalCV(bob)
			],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_RECIPIENT_COMMIT)));
	});

	it('err: insufficient balance when amount exceeds the slot credit', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 999_999_999n });
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INSUFFICIENT_BALANCE)));
	});

	it('err: wrong nonce is rejected (replay protection)', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		// First call at nonce 0 succeeds, advancing the controller nonce to 1.
		expect(callWithdraw(tom, buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n, nonce: 0n })).result).toEqual(Cl.ok(Cl.uint(100_000)));
		// Replaying the same nonce-0 envelope must fail.
		const replay = buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n, nonce: 0n });
		const r = callWithdraw(tom, replay);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_NONCE)));
	});

	it('err: expired message rejected when expiry < current burn block height', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		// Advance the chain so expiry=1 is in the past
		simnet.mineEmptyBlocks(5);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: 100_000n, expiry: 1n });
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_EXPIRED)));
	});

	it('err: pubkey mismatch when payload signed by a different controller', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const attacker = newEvmKey(99);
		// Build a payload bound to the legitimate controller but sign with the attacker's key
		const message = buildBmp1({
			controller32: key.controller32,
			nonce: 0n,
			slot0: commitPrincipal(contractPrincipalCV(deployer, sbtcName)),
			slot1: commitPrincipal(principalCV(mapped)),
			slot2: commitPrincipal(principalCV(betty)),
			slot3: slotLowUint(100_000),
			slot4: slotLowUint(0)
		});
		const signature = signEvm(message, attacker.privKey);
		// Pass the legitimate uncompressed pubkey — secp256k1-recover? will recover the attacker's pubkey,
		// which won't match the compressed form of the supplied pubkey.
		const r = simnet.callPublicFn(
			vault,
			'withdraw',
			[
				Cl.buffer(message),
				Cl.buffer(signature),
				Cl.buffer(key.uncompressed),
				contractPrincipalCV(deployer, sbtcName),
				principalCV(mapped),
				principalCV(betty)
			],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_PUBKEY_MISMATCH)));
	});

	it('err: address mismatch when supplied pubkey does not correspond to the controller slot', async () => {
		const { key, mapped } = await setupCreditedVault(500_000n);
		const attacker = newEvmKey(101);

		// The slot belongs to `key`. We sign with `attacker` AND supply the attacker pubkey.
		// secp256k1-recover? matches the attacker's pubkey, so PUBKEY_MISMATCH won't fire.
		// But the derived address (= attacker EVM address) won't match the controller slot (= key's address).
		const message = buildBmp1({
			controller32: key.controller32,
			nonce: 0n,
			slot0: commitPrincipal(contractPrincipalCV(deployer, sbtcName)),
			slot1: commitPrincipal(principalCV(mapped)),
			slot2: commitPrincipal(principalCV(betty)),
			slot3: slotLowUint(100_000),
			slot4: slotLowUint(0)
		});
		const signature = signEvm(message, attacker.privKey);
		const r = simnet.callPublicFn(
			vault,
			'withdraw',
			[
				Cl.buffer(message),
				Cl.buffer(signature),
				Cl.buffer(attacker.uncompressed),
				contractPrincipalCV(deployer, sbtcName),
				principalCV(mapped),
				principalCV(betty)
			],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_ADDRESS_MISMATCH)));
	});

	it('err: unsupported signature scheme — CHAIN_BTC reaches the dispatcher but has no verifier', async () => {
		await setupVault();
		const key = newEvmKey(7);
		// Credit a BTC-flavoured slot so we get past balance/nonce checks
		expect(
			callDepositFor({
				sender: alice,
				amount: 200_000,
				chain: CHAIN_BTC,
				controller32: key.controller32,
				mapped: alice,
				intent: intentId(77)
			}).result
		).toEqual(Cl.ok(Cl.uint(200_000)));

		const mats = buildWithdraw({
			key,
			mapped: alice,
			recipient: betty,
			amount: 100_000n,
			overrides: { chain: CHAIN_BTC }
		});
		const r = callWithdraw(tom, mats);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_SIG_SCHEME)));
	});
});

describe('vault — withdraw (CHAIN_STACKS, SIP-018 human-readable tuple)', () => {
	/**
	 * For CHAIN_STACKS withdrawals the user calls `deposit` directly (tx-sender IS
	 * the controller).  The contract keys the balance as:
	 *   (CHAIN_STACKS, pad-address-20(hash160(tx-sender)), tx-sender, token)
	 * The signed BMP1 must embed the same pad-address-20(hash160) as the
	 * controller field so `verify-stacks-sip18` can recover and compare.
	 */
	async function setupStacksCreditedVault(amount: bigint): Promise<{ key: StacksKey }> {
		await setupVault();
		const key = aliceStacksKey();
		// alice deposits directly — credits (CHAIN_STACKS, alice-hash160, alice, sbtc)
		const r = callDeposit(alice, amount);
		expect(r.result).toEqual(Cl.ok(Cl.uint(amount)));
		return { key };
	}

	it('ok: Stacks SIP-018 signed withdraw debits the balance and pays the recipient', async () => {
		const { key } = await setupStacksCreditedVault(1_000_000n);
		const tokenCV   = contractPrincipalCV(deployer, sbtcName);
		const mappedCV  = principalCV(alice);
		const recipientCV = principalCV(betty);

		// Build BMP1 for CHAIN_STACKS — controller32 is alice's hash160 padded to 32 bytes
		const message = buildBmp1({
			chain:        CHAIN_STACKS,
			controller32: key.controller32,
			nonce:        0n,
			slot0:        commitPrincipal(tokenCV),
			slot1:        commitPrincipal(mappedCV),
			slot2:        commitPrincipal(recipientCV),
			slot3:        slotLowUint(400_000n),
			slot4:        slotLowUint(0n),
		});

		const signature = signStacks(message, key, tokenCV, recipientCV, 400_000n, 0n);

		const recipientBefore = getSbtcBalance(betty);
		const vaultBefore     = getSbtcBalance(`${deployer}.${vault}`);

		const r = simnet.callPublicFn(
			vault, 'withdraw',
			[
				Cl.buffer(message),
				Cl.buffer(signature),
				Cl.buffer(new Uint8Array(64)), // pubkey unused for CHAIN_STACKS
				tokenCV, mappedCV, recipientCV,
			],
			tom,
		);
		expect(r.result).toEqual(Cl.ok(Cl.uint(400_000)));

		expect(getBalance(CHAIN_STACKS, key.controller32, alice)).toBe(600_000n);
		expect(getNonce(CHAIN_STACKS, key.controller32)).toBe(1n);
		expect(getSbtcBalance(betty)).toBe(recipientBefore + 400_000n);
		expect(getSbtcBalance(`${deployer}.${vault}`)).toBe(vaultBefore - 400_000n);
	});

	it('err: CHAIN_STACKS signature with wrong amount fails sig verification', async () => {
		const { key } = await setupStacksCreditedVault(500_000n);
		const tokenCV     = contractPrincipalCV(deployer, sbtcName);
		const mappedCV    = principalCV(alice);
		const recipientCV = principalCV(betty);

		const message = buildBmp1({
			chain:        CHAIN_STACKS,
			controller32: key.controller32,
			nonce:        0n,
			slot0:        commitPrincipal(tokenCV),
			slot1:        commitPrincipal(mappedCV),
			slot2:        commitPrincipal(recipientCV),
			slot3:        slotLowUint(100_000n),
			slot4:        slotLowUint(0n),
		});

		// Sign for amount=100_000 but BMP1 slot3 also encodes 100_000 — they match.
		// To produce a mismatch, sign for amount=999 (digest differs from message).
		const badSignature = signStacks(message, key, tokenCV, recipientCV, 999n, 0n);

		const r = simnet.callPublicFn(
			vault, 'withdraw',
			[Cl.buffer(message), Cl.buffer(badSignature), Cl.buffer(new Uint8Array(64)), tokenCV, mappedCV, recipientCV],
			tom,
		);
		// The recovered key won't hash to alice's address
		expect(r.result.type).toBe(ClarityType.ResponseErr);
	});

	it('err: CHAIN_STACKS withdraw with wrong nonce in message fails', async () => {
		const { key } = await setupStacksCreditedVault(500_000n);
		const tokenCV     = contractPrincipalCV(deployer, sbtcName);
		const mappedCV    = principalCV(alice);
		const recipientCV = principalCV(betty);

		// Sign and submit nonce=0 successfully
		const msg0 = buildBmp1({
			chain: CHAIN_STACKS, controller32: key.controller32, nonce: 0n,
			slot0: commitPrincipal(tokenCV), slot1: commitPrincipal(mappedCV),
			slot2: commitPrincipal(recipientCV), slot3: slotLowUint(100_000n), slot4: slotLowUint(0n),
		});
		expect(simnet.callPublicFn(vault, 'withdraw',
			[Cl.buffer(msg0), Cl.buffer(signStacks(msg0, key, tokenCV, recipientCV, 100_000n, 0n)),
			 Cl.buffer(new Uint8Array(64)), tokenCV, mappedCV, recipientCV], tom,
		).result).toEqual(Cl.ok(Cl.uint(100_000)));

		// Replay nonce=0 should fail
		const r = simnet.callPublicFn(vault, 'withdraw',
			[Cl.buffer(msg0), Cl.buffer(signStacks(msg0, key, tokenCV, recipientCV, 100_000n, 0n)),
			 Cl.buffer(new Uint8Array(64)), tokenCV, mappedCV, recipientCV], tom,
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_INVALID_NONCE)));
	});
});

// ════════════════════════════════════════════════════════════════════════════
// Use Case 4: buy-shares via signed BMP1 + prediction-market-trait
//
// The relayer submits (message, signature, pubkey, token, mapped, market). The
// vault verifies the controller signature, debits its ledger for `max-cost`,
// bumps the nonce, and relays into the market extension via `predict-vault`.
// `mapped-address` is both the vault balance key AND the beneficiary that owns
// the resulting shares / BIGR.
//
// BMP1 OP_BUY_SHARES body:
//   slot0  keccak256(consensus(token))
//   slot1  keccak256(consensus(mapped-address))
//   slot2  outcome-index (high 16) || market-id (low 16)
//   slot3  keccak256(consensus(market-extension-principal))
//   slot4  max-cost (high 16) || min-shares (low 16)
//   slot5  expiry (low 16)
// ════════════════════════════════════════════════════════════════════════════

const marketPredicting = 'bme024-0-market-predicting';
const marketScalar = 'bme024-0-market-scalar-pyth';
const gating = `${deployer}.bme022-0-market-gating`;
const sbtcToken = `${deployer}.${sbtcName}`;

const ERR_MARKET_COMMIT = 7119;

/** Pack two u128 big-endian values into a single 32-byte slot (high 16 || low 16). */
function slotHighLow(high: bigint | number, low: bigint | number): Uint8Array {
	return concatBytes(uintToBe16(high), uintToBe16(low));
}

type BuySharesMaterials = {
	message: Uint8Array;
	signature: Uint8Array;
	pubkey: Uint8Array;
	tokenCV: ReturnType<typeof contractPrincipalCV>;
	mappedCV: ReturnType<typeof principalCV>;
	marketCV: ReturnType<typeof contractPrincipalCV>;
};

function buildBuyShares(args: {
	key: EvmKey;
	tokenName?: string;
	mapped: string;
	market: string;
	marketId: bigint | number;
	outcomeIndex: bigint | number;
	maxCost: bigint | number;
	minShares: bigint | number;
	nonce?: bigint | number;
	expiry?: bigint | number;
	chain?: Uint8Array;
	overrides?: Partial<BuildMessageOpts>;
}): BuySharesMaterials {
	const tokenName = args.tokenName ?? sbtcName;
	const tokenCV = contractPrincipalCV(deployer, tokenName);
	const mappedCV = principalCV(args.mapped);
	const marketCV = contractPrincipalCV(deployer, args.market);

	const message = buildBmp1({
		opcode: OP_BUY_SHARES,
		chain: args.chain ?? CHAIN_EVM,
		controller32: args.key.controller32,
		nonce: args.nonce ?? 0n,
		slot0: commitPrincipal(tokenCV),
		slot1: commitPrincipal(mappedCV),
		slot2: slotHighLow(args.outcomeIndex, args.marketId),
		slot3: commitPrincipal(marketCV),
		slot4: slotHighLow(args.maxCost, args.minShares),
		slot5: slotLowUint(args.expiry ?? 0n),
		...(args.overrides ?? {})
	});

	const signature = signEvm(message, args.key.privKey);
	return { message, signature, pubkey: args.key.uncompressed, tokenCV, mappedCV, marketCV };
}

function callBuyShares(sender: string, mats: BuySharesMaterials, marketName: string) {
	return simnet.callPublicFn(
		vault,
		'buy-shares',
		[
			Cl.buffer(mats.message),
			Cl.buffer(mats.signature),
			Cl.buffer(mats.pubkey),
			mats.tokenCV,
			mats.mappedCV,
			contractPrincipalCV(deployer, marketName)
		],
		sender
	);
}

/** Create a binary sBTC market on the categorical extension. */
function createCategoricalSbtcMarket(creator = deployer) {
	const r = simnet.callPublicFn(
		marketPredicting,
		'create-market',
		[
			Cl.list([Cl.stringAscii('nay'), Cl.stringAscii('yay')]),
			Cl.none(),
			Cl.principal(sbtcToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(gating),
			Cl.none(),
			Cl.none(),
			Cl.uint(100_000_000),
			Cl.none(),
			Cl.none()
		],
		creator
	);
	expect(r.result).toEqual(Cl.ok(Cl.uint(0)));
	return r;
}

/** Create a binary sBTC scalar market on the pyth extension. */
function createScalarSbtcMarket(creator = deployer) {
	const r = simnet.callPublicFn(
		marketScalar,
		'create-market',
		[
			Cl.none(),
			Cl.principal(sbtcToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(gating),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(BTCUSD),
			Cl.uint(100_000_000),
			Cl.none(),
			Cl.none()
		],
		creator
	);
	expect(r.result).toEqual(Cl.ok(Cl.uint(0)));
	return r;
}

/** Read the beneficiary's share balance for a single outcome index. */
function getStakeAt(marketName: string, marketId: number, user: string, index: number): bigint {
	const { result } = simnet.callReadOnlyFn(marketName, 'get-stake-balances', [Cl.uint(marketId), principalCV(user)], alice);
	if (result.type !== ClarityType.ResponseOk) throw new Error(`get-stake-balances not ok: ${result.type}`);
	const list = (result as any).value; // listCV
	return BigInt(list.value[index].value);
}

/**
 * Stand up the vault + an sBTC market and credit an EVM controller slot so the
 * vault holds enough sBTC to relay a buy. `mapped` is the beneficiary that owns
 * the resulting shares.
 */
async function setupBuySharesVault(args: { marketName: string; credit: bigint; mapped?: string; seed?: number }): Promise<{ key: EvmKey; mapped: string }> {
	await setupVault();
	if (args.marketName === marketScalar) {
		createScalarSbtcMarket();
	} else {
		createCategoricalSbtcMarket();
	}
	const mapped = args.mapped ?? alice;
	const key = newEvmKey(args.seed ?? 21);
	// alice acts as the relayer that sweeps the bridged sBTC into the vault.
	const credit = callDepositFor({ sender: alice, amount: args.credit, controller32: key.controller32, mapped, intent: intentId(args.seed ?? 21) });
	expect(credit.result).toEqual(Cl.ok(Cl.uint(args.credit)));
	return { key, mapped };
}

describe('vault — buy-shares (Use Case 4: signed BMP1 + categorical market)', () => {
	it('ok: signed buy debits the vault ledger, bumps the nonce and credits the beneficiary', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const vaultBefore = getBalance(CHAIN_EVM, key.controller32, mapped);

		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n, nonce: 0n });
		const r = callBuyShares(tom, mats, marketPredicting);
		// buy-shares returns the outcome-index that was bought
		expect(r.result).toEqual(Cl.ok(Cl.uint(1)));

		// Vault ledger debited by max-cost, nonce advanced
		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(vaultBefore - 1_000_000n);
		expect(getNonce(CHAIN_EVM, key.controller32)).toBe(1n);

		// Beneficiary (mapped-address) now owns shares in the bought outcome
		expect(getStakeAt(marketPredicting, 0, mapped, 1)).toBeGreaterThan(0n);
	});

	it('ok: a second buy consumes the next nonce', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 500_000n, minShares: 1n, nonce: 0n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(1)));
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 0, maxCost: 500_000n, minShares: 1n, nonce: 1n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(0)));
		expect(getNonce(CHAIN_EVM, key.controller32)).toBe(2n);
	});

	it('err: BMP1 magic is enforced', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n, overrides: { magic: new Uint8Array(8) } });
		expect(callBuyShares(tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_MSG_MAGIC)));
	});

	it('err: BMP1 version mismatch', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n, overrides: { version: 0x02 } });
		expect(callBuyShares(tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_MSG_VERSION)));
	});

	it('err: opcode must be OP_BUY_SHARES', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n, overrides: { opcode: OP_WITHDRAW } });
		expect(callBuyShares(tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_MSG_OPCODE)));
	});

	it('err: unsupported source chain id', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n, chain: CHAIN_BAD });
		expect(callBuyShares(tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_UNSUPPORTED_CHAIN)));
	});

	it('err: zero max-cost rejected', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 0n, minShares: 1n });
		expect(callBuyShares(tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_INVALID_AMOUNT)));
	});

	it('err: token-commit must match the token passed', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n });
		// Pass wrapped-stx as the token param while the payload commits to sbtc
		const r = simnet.callPublicFn(
			vault,
			'buy-shares',
			[Cl.buffer(mats.message), Cl.buffer(mats.signature), Cl.buffer(mats.pubkey), wrappedStxTrait(), mats.mappedCV, contractPrincipalCV(deployer, marketPredicting)],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_TOKEN_COMMIT)));
	});

	it('err: mapped-commit mismatch when wrong mapped principal is passed', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n });
		const r = simnet.callPublicFn(
			vault,
			'buy-shares',
			[Cl.buffer(mats.message), Cl.buffer(mats.signature), Cl.buffer(mats.pubkey), mats.tokenCV, principalCV(bob), contractPrincipalCV(deployer, marketPredicting)],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MAPPED_COMMIT)));
	});

	it('err: market-commit mismatch when the payload binds a different market', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		// Payload commits to the scalar market, but we pass the categorical market as the trait ref
		const mats = buildBuyShares({ key, mapped, market: marketScalar, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n });
		const r = simnet.callPublicFn(
			vault,
			'buy-shares',
			[Cl.buffer(mats.message), Cl.buffer(mats.signature), Cl.buffer(mats.pubkey), mats.tokenCV, mats.mappedCV, contractPrincipalCV(deployer, marketPredicting)],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MARKET_COMMIT)));
	});

	it('err: insufficient balance when max-cost exceeds the vault credit', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 500_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n });
		expect(callBuyShares(tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_INSUFFICIENT_BALANCE)));
	});

	it('err: wrong nonce is rejected (replay protection)', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 500_000n, minShares: 1n, nonce: 0n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(1)));
		const replay = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 500_000n, minShares: 1n, nonce: 0n });
		expect(callBuyShares(tom, replay, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_INVALID_NONCE)));
	});

	it('err: expired message rejected when expiry < current stacks block height', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		simnet.mineEmptyBlocks(5);
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n, expiry: 1n });
		expect(callBuyShares(tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_EXPIRED)));
	});

	it('err: pubkey mismatch when payload signed by a different controller', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const attacker = newEvmKey(98);
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n });
		// Re-sign with the attacker key but keep the legitimate controller pubkey
		const badSig = signEvm(mats.message, attacker.privKey);
		const r = simnet.callPublicFn(
			vault,
			'buy-shares',
			[Cl.buffer(mats.message), Cl.buffer(badSig), Cl.buffer(key.uncompressed), mats.tokenCV, mats.mappedCV, contractPrincipalCV(deployer, marketPredicting)],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_PUBKEY_MISMATCH)));
	});
});

describe('vault — buy-shares (Use Case 4: signed BMP1 + scalar market)', () => {
	it('ok: signed buy relays into the scalar pyth market and credits the beneficiary', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketScalar, credit: 5_000_000n });
		const vaultBefore = getBalance(CHAIN_EVM, key.controller32, mapped);

		const mats = buildBuyShares({ key, mapped, market: marketScalar, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n, nonce: 0n });
		const r = callBuyShares(tom, mats, marketScalar);
		expect(r.result).toEqual(Cl.ok(Cl.uint(1)));

		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(vaultBefore - 1_000_000n);
		expect(getNonce(CHAIN_EVM, key.controller32)).toBe(1n);

		expect(getStakeAt(marketScalar, 0, mapped, 1)).toBeGreaterThan(0n);
	});

	it('err: market-commit mismatch when the payload binds the categorical market', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketScalar, credit: 5_000_000n });
		const mats = buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 1_000_000n, minShares: 1n });
		const r = simnet.callPublicFn(
			vault,
			'buy-shares',
			[Cl.buffer(mats.message), Cl.buffer(mats.signature), Cl.buffer(mats.pubkey), mats.tokenCV, mats.mappedCV, contractPrincipalCV(deployer, marketScalar)],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MARKET_COMMIT)));
	});

	it('err: wrong nonce is rejected (replay protection)', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketScalar, credit: 5_000_000n });
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketScalar, marketId: 0, outcomeIndex: 1, maxCost: 500_000n, minShares: 1n, nonce: 0n }), marketScalar).result).toEqual(Cl.ok(Cl.uint(1)));
		const replay = buildBuyShares({ key, mapped, market: marketScalar, marketId: 0, outcomeIndex: 1, maxCost: 500_000n, minShares: 1n, nonce: 0n });
		expect(callBuyShares(tom, replay, marketScalar).result).toEqual(Cl.error(Cl.uint(ERR_INVALID_NONCE)));
	});
});

// ════════════════════════════════════════════════════════════════════════════
// Use Case 5/6: sell-shares & claim-winnings via signed BMP1
//
// Both mirror buy-shares but bring funds INTO the vault: the market refunds the
// net proceeds to the vault (payee = contract-caller), and the vault re-credits
// the controller ledger. sell uses OP_SELL_SHARES with slot4 = min-refund (high)
// || shares-in (low); claim uses OP_CLAIM_WINNINGS with only market-id in slot2.
// ════════════════════════════════════════════════════════════════════════════

function buildSellShares(args: {
	key: EvmKey;
	tokenName?: string;
	mapped: string;
	market: string;
	marketId: bigint | number;
	outcomeIndex: bigint | number;
	minRefund: bigint | number;
	sharesIn: bigint | number;
	nonce?: bigint | number;
	expiry?: bigint | number;
	chain?: Uint8Array;
	overrides?: Partial<BuildMessageOpts>;
}): BuySharesMaterials {
	const tokenName = args.tokenName ?? sbtcName;
	const tokenCV = contractPrincipalCV(deployer, tokenName);
	const mappedCV = principalCV(args.mapped);
	const marketCV = contractPrincipalCV(deployer, args.market);

	const message = buildBmp1({
		opcode: OP_SELL_SHARES,
		chain: args.chain ?? CHAIN_EVM,
		controller32: args.key.controller32,
		nonce: args.nonce ?? 0n,
		slot0: commitPrincipal(tokenCV),
		slot1: commitPrincipal(mappedCV),
		slot2: slotHighLow(args.outcomeIndex, args.marketId),
		slot3: commitPrincipal(marketCV),
		slot4: slotHighLow(args.minRefund, args.sharesIn),
		slot5: slotLowUint(args.expiry ?? 0n),
		...(args.overrides ?? {})
	});

	const signature = signEvm(message, args.key.privKey);
	return { message, signature, pubkey: args.key.uncompressed, tokenCV, mappedCV, marketCV };
}

function buildClaimWinnings(args: {
	key: EvmKey;
	tokenName?: string;
	mapped: string;
	market: string;
	marketId: bigint | number;
	nonce?: bigint | number;
	expiry?: bigint | number;
	chain?: Uint8Array;
	overrides?: Partial<BuildMessageOpts>;
}): BuySharesMaterials {
	const tokenName = args.tokenName ?? sbtcName;
	const tokenCV = contractPrincipalCV(deployer, tokenName);
	const mappedCV = principalCV(args.mapped);
	const marketCV = contractPrincipalCV(deployer, args.market);

	const message = buildBmp1({
		opcode: OP_CLAIM_WINNINGS,
		chain: args.chain ?? CHAIN_EVM,
		controller32: args.key.controller32,
		nonce: args.nonce ?? 0n,
		slot0: commitPrincipal(tokenCV),
		slot1: commitPrincipal(mappedCV),
		slot2: slotLowUint(args.marketId),
		slot3: commitPrincipal(marketCV),
		slot5: slotLowUint(args.expiry ?? 0n),
		...(args.overrides ?? {})
	});

	const signature = signEvm(message, args.key.privKey);
	return { message, signature, pubkey: args.key.uncompressed, tokenCV, mappedCV, marketCV };
}

function callVaultMarketFn(fn: string, sender: string, mats: BuySharesMaterials, marketName: string) {
	return simnet.callPublicFn(
		vault,
		fn,
		[Cl.buffer(mats.message), Cl.buffer(mats.signature), Cl.buffer(mats.pubkey), mats.tokenCV, mats.mappedCV, contractPrincipalCV(deployer, marketName)],
		sender
	);
}

/** Resolve a categorical market to `category` and pass the dispute window. */
function resolveCategorical(marketId: number, category: string) {
	simnet.mineEmptyBlocks(288);
	const r = simnet.callPublicFn(marketPredicting, 'resolve-market', [Cl.uint(marketId), Cl.stringAscii(category)], bob);
	expect(r.result.type).toBe(ClarityType.ResponseOk);
	simnet.mineEmptyBlocks(288);
	const u = simnet.callPublicFn(marketPredicting, 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	expect(u.result).toEqual(Cl.ok(Cl.bool(true)));
}

describe('vault — sell-shares (Use Case 5: signed BMP1 brings proceeds back to the vault)', () => {
	it('ok: sell debits the beneficiary shares and credits the vault ledger', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		// First buy so the beneficiary owns shares to sell (nonce 0 -> 1)
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 2_000_000n, minShares: 1n, nonce: 0n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(1)));
		const sharesOwned = getStakeAt(marketPredicting, 0, mapped, 1);
		expect(sharesOwned).toBeGreaterThan(0n);
		const ledgerAfterBuy = getBalance(CHAIN_EVM, key.controller32, mapped);

		// Sell half the shares back (nonce 1 -> 2)
		const sharesIn = sharesOwned / 2n;
		const mats = buildSellShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, minRefund: 1n, sharesIn, nonce: 1n });
		const r = callVaultMarketFn('sell-shares', tom, mats, marketPredicting);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		const netRefund = BigInt((r.result as any).value.value);
		expect(netRefund).toBeGreaterThan(0n);

		// Ledger credited by the net refund, nonce advanced, shares reduced
		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(ledgerAfterBuy + netRefund);
		expect(getNonce(CHAIN_EVM, key.controller32)).toBe(2n);
		expect(getStakeAt(marketPredicting, 0, mapped, 1)).toBe(sharesOwned - sharesIn);
	});

	it('ok: sell on the scalar market credits the vault ledger', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketScalar, credit: 5_000_000n });
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketScalar, marketId: 0, outcomeIndex: 1, maxCost: 2_000_000n, minShares: 1n, nonce: 0n }), marketScalar).result).toEqual(Cl.ok(Cl.uint(1)));
		const sharesOwned = getStakeAt(marketScalar, 0, mapped, 1);
		const ledgerAfterBuy = getBalance(CHAIN_EVM, key.controller32, mapped);

		const mats = buildSellShares({ key, mapped, market: marketScalar, marketId: 0, outcomeIndex: 1, minRefund: 1n, sharesIn: sharesOwned, nonce: 1n });
		const r = callVaultMarketFn('sell-shares', tom, mats, marketScalar);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		const netRefund = BigInt((r.result as any).value.value);
		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(ledgerAfterBuy + netRefund);
		expect(getStakeAt(marketScalar, 0, mapped, 1)).toBe(0n);
	});

	it('err: opcode must be OP_SELL_SHARES', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildSellShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, minRefund: 1n, sharesIn: 1_000n, overrides: { opcode: OP_BUY_SHARES } });
		expect(callVaultMarketFn('sell-shares', tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_MSG_OPCODE)));
	});

	it('err: market-commit mismatch when the payload binds a different market', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildSellShares({ key, mapped, market: marketScalar, marketId: 0, outcomeIndex: 1, minRefund: 1n, sharesIn: 1_000n });
		const r = simnet.callPublicFn(
			vault,
			'sell-shares',
			[Cl.buffer(mats.message), Cl.buffer(mats.signature), Cl.buffer(mats.pubkey), mats.tokenCV, mats.mappedCV, contractPrincipalCV(deployer, marketPredicting)],
			tom
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(ERR_MARKET_COMMIT)));
	});

	it('err: replaying the same nonce is rejected', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 2_000_000n, minShares: 1n, nonce: 0n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(1)));
		const shares = getStakeAt(marketPredicting, 0, mapped, 1);
		expect(callVaultMarketFn('sell-shares', tom, buildSellShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, minRefund: 1n, sharesIn: shares / 4n, nonce: 1n }), marketPredicting).result.type).toBe(ClarityType.ResponseOk);
		// Re-submitting nonce 1 must fail
		const replay = buildSellShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, minRefund: 1n, sharesIn: shares / 4n, nonce: 1n });
		expect(callVaultMarketFn('sell-shares', tom, replay, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_INVALID_NONCE)));
	});
});

describe('vault — claim-winnings (Use Case 6: signed BMP1 brings winnings back to the vault)', () => {
	it('ok: claim pays the resolved winnings into the vault ledger and zeroes the position', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		// Buy the 'yay' outcome (index 1) that the market will resolve to (nonce 0 -> 1)
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 2_000_000n, minShares: 1n, nonce: 0n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(1)));
		expect(getStakeAt(marketPredicting, 0, mapped, 1)).toBeGreaterThan(0n);
		const ledgerAfterBuy = getBalance(CHAIN_EVM, key.controller32, mapped);

		resolveCategorical(0, 'yay');

		// Claim winnings (nonce 1 -> 2)
		const mats = buildClaimWinnings({ key, mapped, market: marketPredicting, marketId: 0, nonce: 1n });
		const r = callVaultMarketFn('claim-winnings', tom, mats, marketPredicting);
		expect(r.result.type).toBe(ClarityType.ResponseOk);
		const netRefund = BigInt((r.result as any).value.value);
		expect(netRefund).toBeGreaterThan(0n);

		// Winnings credited to the vault ledger, nonce advanced, position zeroed
		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(ledgerAfterBuy + netRefund);
		expect(getNonce(CHAIN_EVM, key.controller32)).toBe(2n);
		expect(getStakeAt(marketPredicting, 0, mapped, 1)).toBe(0n);
	});

	it('ok: winnings can be withdrawn from the vault after claiming', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 2_000_000n, minShares: 1n, nonce: 0n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(1)));
		resolveCategorical(0, 'yay');
		expect(callVaultMarketFn('claim-winnings', tom, buildClaimWinnings({ key, mapped, market: marketPredicting, marketId: 0, nonce: 1n }), marketPredicting).result.type).toBe(ClarityType.ResponseOk);

		const ledger = getBalance(CHAIN_EVM, key.controller32, mapped);
		expect(ledger).toBeGreaterThan(0n);

		// Withdraw the credited proceeds to betty (nonce 2 -> 3)
		const recipientBefore = getSbtcBalance(betty);
		const mats = buildWithdraw({ key, mapped, recipient: betty, amount: ledger, nonce: 2n });
		const w = callWithdraw(tom, mats);
		expect(w.result).toEqual(Cl.ok(Cl.uint(Number(ledger))));
		expect(getSbtcBalance(betty)).toBe(recipientBefore + ledger);
		expect(getBalance(CHAIN_EVM, key.controller32, mapped)).toBe(0n);
	});

	it('err: opcode must be OP_CLAIM_WINNINGS', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		const mats = buildClaimWinnings({ key, mapped, market: marketPredicting, marketId: 0, overrides: { opcode: OP_WITHDRAW } });
		expect(callVaultMarketFn('claim-winnings', tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(ERR_MSG_OPCODE)));
	});

	it('err: claiming an unresolved market propagates the market error', async () => {
		const { key, mapped } = await setupBuySharesVault({ marketName: marketPredicting, credit: 5_000_000n });
		expect(callBuyShares(tom, buildBuyShares({ key, mapped, market: marketPredicting, marketId: 0, outcomeIndex: 1, maxCost: 2_000_000n, minShares: 1n, nonce: 0n }), marketPredicting).result).toEqual(Cl.ok(Cl.uint(1)));
		// Market not concluded -> err-market-not-concluded (u10009) bubbles up from the market
		const mats = buildClaimWinnings({ key, mapped, market: marketPredicting, marketId: 0, nonce: 1n });
		expect(callVaultMarketFn('claim-winnings', tom, mats, marketPredicting).result).toEqual(Cl.error(Cl.uint(10009)));
	});
});

describe('prediction market — sell-vault / claim-winnings-vault (trait gate)', () => {
	it('err: sell-vault rejects non-DAO/extension callers on both markets', async () => {
		await setupVault();
		createCategoricalSbtcMarket();
		expect(
			simnet.callPublicFn(marketPredicting, 'sell-vault', [principalCV(bob), Cl.uint(0), Cl.uint(1), Cl.uint(1), Cl.principal(sbtcToken), Cl.uint(1_000)], alice).result
		).toEqual(Cl.error(Cl.uint(10000)));
	});

	it('err: claim-winnings-vault rejects non-DAO/extension callers on the scalar market', async () => {
		await setupVault();
		createScalarSbtcMarket();
		expect(
			simnet.callPublicFn(marketScalar, 'claim-winnings-vault', [principalCV(bob), Cl.uint(0), Cl.principal(sbtcToken)], alice).result
		).toEqual(Cl.error(Cl.uint(10000)));
	});
});

describe('prediction market — predict-vault (trait gate)', () => {
	it('err: predict-vault on categorical market rejects non-DAO/extension callers', async () => {
		await setupVault();
		createCategoricalSbtcMarket();
		// alice is neither the DAO nor an enabled extension -> ERR_UNAUTHORISED (u10000)
		const r = simnet.callPublicFn(
			marketPredicting,
			'predict-vault',
			[principalCV(bob), Cl.uint(0), Cl.uint(1), Cl.uint(1), Cl.principal(sbtcToken), Cl.uint(1_000_000)],
			alice
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(10000)));
	});

	it('err: predict-vault on scalar market rejects non-DAO/extension callers', async () => {
		await setupVault();
		createScalarSbtcMarket();
		const r = simnet.callPublicFn(
			marketScalar,
			'predict-vault',
			[principalCV(bob), Cl.uint(0), Cl.uint(1), Cl.uint(1), Cl.principal(sbtcToken), Cl.uint(1_000_000)],
			alice
		);
		expect(r.result).toEqual(Cl.error(Cl.uint(10000)));
	});
});
