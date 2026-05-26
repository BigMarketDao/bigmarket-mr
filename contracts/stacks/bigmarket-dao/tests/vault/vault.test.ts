import { Cl, ClarityType, contractPrincipalCV, principalCV, serializeCVBytes } from '@stacks/transactions';
import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { beforeAll, describe, expect, it } from 'vitest';
import { alice, betty, bob, constructDao, deployer, passProposalByCoreVote, tom } from '../dao_helpers';

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
const BMP1_VERSION = 0x01;

// "\x19Ethereum Signed Message:\n256"
const EIP191_PREFIX_256 = new Uint8Array([
	0x19, 0x45, 0x74, 0x68, 0x65, 0x72, 0x65, 0x75, 0x6d, 0x20, 0x53, 0x69, 0x67, 0x6e, 0x65, 0x64, 0x20, 0x4d, 0x65, 0x73,
	0x73, 0x61, 0x67, 0x65, 0x3a, 0x0a, 0x32, 0x35, 0x36
]);

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
	const digest = keccak_256(concatBytes(EIP191_PREFIX_256, message));
	const [sig, recovery] = secp.signSync(digest, privKey, { der: false, recovered: true, canonical: true });
	// 64-byte compact (r || s) || 1-byte recovery
	const out = new Uint8Array(65);
	out.set(sig, 0);
	out[64] = recovery;
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
