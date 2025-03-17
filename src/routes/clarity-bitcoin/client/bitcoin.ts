import * as btc from '@scure/btc-signer';
import type { ProofRequest, ProofGenerationData, RpcTransaction } from './proof-types.js';
import { hex } from '@scure/base';
import { ensureEven } from './proof.js';
import { bitcoinRPC } from './rpc.js';
import { getRpcParams } from '../../../lib/config.js';
import { Cl } from '@stacks/transactions';
import { fetchTransaction, fetchTransactionHex } from '@mijoco/btc_helpers/dist/index.js';
import { sha256 } from '@noble/hashes/sha256';

export const REGTEST_NETWORK: typeof btc.NETWORK = {
	bech32: 'bcrt',
	pubKeyHash: 0x6f,
	scriptHash: 0xc4,
	wif: 0xc4
};

export async function getProofDataRecent(index: number, rpcParams: any): Promise<ProofRequest> {
	const info = await bitcoinRPC('getblockchaininfo', [], rpcParams);
	const block = await bitcoinRPC('getblock', [info.bestblockhash, 2], rpcParams);
	const tx: RpcTransaction = block.tx[index];
	const blockHex = await bitcoinRPC('getblock', [info.bestblockhash, 0], rpcParams);
	const data: ProofRequest = {
		txid: tx.txid,
		block,
		blockHeader: blockHex.slice(0, 160)
	};
	return data;
}

export async function getProofData(txid: string, blockhash: string, rpcParams: any): Promise<ProofRequest> {
	console.log('getProofData:' + txid, blockhash);
	const block = await bitcoinRPC('getblock', [blockhash, 2], rpcParams);
	console.log('getProofData:' + txid, block);

	const blockHex = await bitcoinRPC('getblock', [blockhash, 0], rpcParams);
	const data: ProofRequest = {
		txid,
		block,
		blockHeader: blockHex.slice(0, 160)
	};
	return data;
}

export function reverseAndEven(txs: Array<string>) {
	const txIds = txs.map(function (tx: any) {
		return hex.encode(hex.decode(tx).reverse());
	});
	ensureEven(txIds);
	return txIds;
}

export function getProofGenerationData(data: ProofRequest): ProofGenerationData {
	console.log('getProofGenerationData: txid: ' + data.txid);
	const header = data.blockHeader;
	const iddata = getTxDataEfficiently(data);

	const txIndex = data.block.tx.findIndex((o) => o.txid === data.txid);
	console.log('getProofGenerationData: data.tx: ' + data.block.tx.length);
	console.log('getProofGenerationData: txids: ' + iddata.txids.length);
	console.log('getProofGenerationData: numb txs segwit   :' + iddata.segCounter);
	// const parsedTx = btc.Transaction.fromRaw(hex.decode(data.block.tx[txIndex].hex), { allowUnknownInputs: true, allowUnknownOutputs: true });
	const parsedCTx = btc.Transaction.fromRaw(hex.decode(data.block.tx[0].hex), { allowUnknownInputs: true, allowUnknownOutputs: true, disableScriptCheck: true });
	const { witnessReservedValue, witnessMerkleRoot } = getCommitmentHashFromRawCtx(data.block.tx[0].hex);

	console.log('getProofGenerationData: witnessReservedValue: ' + witnessReservedValue);
	console.log('getProofGenerationData: witnessMerkleRoot: ' + witnessMerkleRoot);

	const txhex = data.block.tx[txIndex].hex;
	return {
		txId: data.txid,
		txhex: txhex,
		ctxhex: hex.encode(parsedCTx.toBytes(true, false)), //ctxhex, // fix for coinbase was-tx-mined
		// hex: hex.encode(parsedTx.toBytes(true, false)),
		// whex: hex.encode(parsedTx.toBytes(true, true)),
		// chex: hex.encode(parsedCTx.toBytes(true, false)),
		// cwhex: hex.encode(parsedCTx.toBytes(true, true)),
		witnessReservedValue,
		witnessMerkleRoot,

		block: {
			id: data.block.hash,
			txids: iddata.txids,
			header,
			//	BEFORE		merkle_root: data.block.merkleroot,
			merkle_root: data.block.merkleroot || data.block.merkle_root!,
			height: data.block.height
		}
	};
}

function getTxDataEfficiently(data: ProofRequest): { segCounter: number; txids: Array<{ txid: string; wtxid: string; segwit: boolean }> } {
	let segCounter = 0;
	let parsedCTx: btc.Transaction;
	const txids = data.block.tx.map((tx, i) => {
		parsedCTx = btc.Transaction.fromRaw(hex.decode(data.block.tx[0].hex), { allowUnknownInputs: true, allowUnknownOutputs: true, disableScriptCheck: true });
		if (i === 0) {
			// Always set coinbase WTXID to 000...000
			//hex.encode(parsedCTx.toBytes(true, false))
			const zerohash = hex.encode(new Uint8Array(32));
			console.log('tx.hash: ' + tx.hash);
			console.log('tx.txid: ' + tx.txid);
			console.log('tx.zerohash: ' + zerohash); // no agreement
			return {
				txid: tx.txid,
				wtxid: zerohash, //'0000000000000000000000000000000000000000000000000000000000000000',
				segwit: false
			};
		} else {
			return {
				txid: tx.txid, // TXID always stays big-endian
				wtxid: tx.hash ? tx.hash : hex.encode(sha256(sha256(parsedCTx.toBytes(true, true).reverse()))), //tx.txid === tx.hash ? tx.hash : hex.encode(hex.decode(tx.hash)), // Reverse WTXID only for SegWit TXs
				// BEFORE: wtxid: tx.hash,
				segwit: tx.txid !== tx.hash
			};
		}
	});

	return { txids, segCounter };
}

function getCommitmentHashFromRawCtx(ctx: string) {
	const chash = ctx.substring(ctx.indexOf('6a24aa21a9ed') + 12, ctx.indexOf('6a24aa21a9ed') + 12 + 64);
	return { witnessMerkleRoot: chash, witnessReservedValue: '0000000000000000000000000000000000000000000000000000000000000000' };
}

export async function buildRegtestBitcoinSegwitTransaction(marketId: number, outcomeIndex: number, stxAddress: string, amountBtc: number): Promise<{ txid: string }> {
	// Define a SegWit-compatible UTXO (mocked)
	const response = await bitcoinRPC('listunspent', [], getRpcParams());
	const utxos = response;

	// Create a new Bitcoin transaction (SegWit enabled)
	const transaction = new btc.Transaction({
		allowUnknownInputs: true,
		allowUnknownOutputs: true
	});
	// Serialize OP_RETURN Data
	const mult = 100_000_000;
	const amountSats = Math.round(amountBtc * 100_000_000);

	const data = Cl.serialize(
		Cl.tuple({
			o: Cl.uint(outcomeIndex),
			i: Cl.uint(marketId),
			p: Cl.principal(stxAddress)
		})
	);
	//const encodedData = hex.encode(data);
	console.log('buildMockBitcoinSegwitTransaction: encodedData length: ' + data.length);
	console.log('buildMockBitcoinSegwitTransaction: encodedData length: ' + hex.decode(data).length);
	console.log('buildMockBitcoinSegwitTransaction: encodedData: ' + data);
	//if (data.length > 2) return '';
	// const OP_RETURN_PREFIX = new Uint8Array([0x6e]); // ✅ Correctly represents `0x6E` as a byte
	// const finalScript = concatBytes(OP_RETURN_PREFIX, hex.decode(encodedData));

	transaction.addOutput({
		script: btc.Script.encode(['RETURN', hex.decode(data)]),
		amount: BigInt(0)
	});

	//const amountSats = BigInt(Math.round(amountBtc * 100_000_000));

	transaction.addOutputAddress(getRpcParams().wallet, BigInt(amountSats), REGTEST_NETWORK); // ✅ Market wallet address (SegWit)
	const totalInput = utxos.reduce((acc: number, utxo: { amount: number }) => acc + utxo.amount, 0);
	console.log('buildMockBitcoinSegwitTransaction: input amount: ', amountBtc);

	const feeBtc = 0.0001;
	const feeSats = BigInt(Math.round(feeBtc * 100_000_000)); // ✅ 10,000 sats
	const totalOutputSats = BigInt(amountSats) + feeSats; // ✅ Safe BigInt math

	const totalInputSats = BigInt(Math.round(totalInput * 100_000_000)); // Convert total input

	const changeAmountSats = totalInputSats - totalOutputSats;
	if (changeAmountSats > 0) transaction.addOutputAddress(utxos[0].address, BigInt(changeAmountSats), REGTEST_NETWORK);

	// const privateKey: Signer = secp256k1.utils.randomPrivateKey();
	// const publicKey = secp256k1.getPublicKey(privateKey, true); // ✅ Derive compressed public key
	// const pubKeyHash = ripemd160(sha256(publicKey));
	// 4️⃣ Construct the SegWit `scriptPubKey` (0x00 | 0x14 | pubKeyHash)
	// const scriptPubKey = hex.encode(new Uint8Array([0x00, 0x14, ...pubKeyHash]));
	utxos.forEach((utxo: any) => {
		transaction.addInput({
			txid: utxo.txid,
			index: utxo.vout
		});
		console.log('buildMockBitcoinSegwitTransaction: input utxo: ', utxo);
	});

	// transaction.signIdx(privateKey, 0);
	// transaction.finalize();
	console.log('buildMockBitcoinSegwitTransaction: unsigned: ' + hex.encode(transaction.toBytes(true, true)));
	const signedTx = await bitcoinRPC('signrawtransactionwithwallet', [hex.encode(transaction.toBytes(true, true))], getRpcParams());
	console.log('buildMockBitcoinSegwitTransaction: signed rsponce: ', signedTx);
	const txid = await bitcoinRPC('sendrawtransaction', [signedTx.hex], getRpcParams());
	console.log('buildMockBitcoinSegwitTransaction: broadcast result: ' + txid);
	return { txid };
}

export async function getBitcoinBlockSbtcTestnet(txid: string, blockhash: string) {
	let url = `https://beta.sbtc-mempool.tech/api/proxy/block/${blockhash}/txids`;
	//console.log('getBitcoinBlockSbtcTestnet: url: ' + url);
	let response = await fetch(url);
	let txids = await response.json();
	console.log('getBitcoinBlockSbtcTestnet: txids: ', txids);

	url = `https://beta.sbtc-mempool.tech/api/proxy/block/${blockhash}`;
	//console.log('getBitcoinBlockSbtcTestnet: url: ' + url);
	response = await fetch(url);
	let actualBlock = await response.json();

	actualBlock.tx = [];

	await Promise.all(
		txids.map(async (txid: string) => {
			const txM = await fetchTransaction('https://beta.sbtc-mempool.tech/api/proxy', txid);
			const txMHex = await fetchTransactionHex('https://beta.sbtc-mempool.tech/api/proxy', txid);
			txM.hex = txMHex;
			actualBlock.tx.push(txM);
			console.log('getBitcoinBlockSbtcTestnet: txM: ', txM);
		})
	);
	console.log('getBitcoinBlockSbtcTestnet: actualBlock: ', actualBlock);

	return actualBlock;
}
