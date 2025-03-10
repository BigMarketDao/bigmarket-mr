import * as btc from '@scure/btc-signer';
import type { ProofRequest, ProofGenerationData, RpcTransaction } from './proof-types';
import { sha256 } from '@noble/hashes/sha256';
import { hex } from '@scure/base';
import { TransactionOutput } from '@scure/btc-signer/psbt';
import { ensureEven } from './proof';
import { bitcoinRPC } from './rpc';

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
	console.log(txid, blockhash);
	const block = await bitcoinRPC('getblock', [blockhash, 2], rpcParams);

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
	const { witnessReservedValue, witnessMerkleRoot } = getCommitmentHashFromRawCtx(data.block.tx[0].hex); //coinbaseWitness(parsedCTx);

	console.log('getProofGenerationData: witnessReservedValue: ' + witnessReservedValue);
	console.log('getProofGenerationData: witnessMerkleRoot: ' + witnessMerkleRoot);

	const txhex = data.block.tx[txIndex].hex;
	const ctxhex = data.block.tx[0].hex;
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
			merkle_root: data.block.merkleroot,
			height: data.block.height
		}
	};
}

function getTxDataEfficiently(data: ProofRequest): { segCounter: number; txids: Array<{ txid: string; wtxid: string; segwit: boolean }> } {
	//	const segwitTxs = data.block.tx.filter((tx) => tx.vin.some((input: any) => input.witness && input.witness.length > 0));
	let segCounter = 0;
	let parsedCTx: btc.Transaction;
	let segwit = false;
	// const txids = data.block.tx.map((tx) => {
	// 	counter++;
	// 	const parsedTx = btc.Transaction.fromRaw(hex.decode(tx.hex), {
	// 		allowUnknownInputs: true,
	// 		allowUnknownOutputs: true,
	// 		disableScriptCheck: true,
	// 		allowLegacyWitnessUtxo: true,
	// 		allowUnknown: true
	// 	});
	// 	// const hash = tx.hash;
	// 	segwit = tx.hash !== tx.txid; //parsedTx.hasWitnesses;
	// 	if (tx.hash !== tx.txid) {
	// 		segCounter++;
	// 	}
	// 	const wtxid = hex.encode(sha256(sha256(parsedTx.toBytes(true, true))));
	// 	if (wtxid !== hex.encode(hex.decode(tx.hash).reverse())) {
	// 		console.log('wtxid: ' + wtxid);
	// 		console.log('tx.hash: ' + tx.hash);
	// 		throw new Error('expected wtxid to be same as tx hash');
	// 	}
	// 	//return { txid: tx.txid, wtxid: tx.hash, segwit };
	// 	// return {
	// 	// 	wtxid: tx.txid === tx.hash ? tx.hash : hex.encode(hex.decode(tx.hash).reverse()), // Reverse WTXID only if it's SegWit
	// 	// 	txid: tx.txid, // Always reverse WTXID for Merkle tree
	// 	// 	segwit
	// 	// };
	// 	return {
	// 		txid: tx.txid, // TXID always stays big-endian
	// 		wtxid: tx.txid === tx.hash ? tx.hash : hex.encode(hex.decode(tx.hash).reverse()), // Reverse WTXID only for SegWit TXs
	// 		segwit: tx.txid !== tx.hash
	// 	};
	// });
	const txids = data.block.tx.map((tx, i) => {
		// parsedCTx = btc.Transaction.fromRaw(hex.decode(data.block.tx[0].hex), { allowUnknownInputs: true, allowUnknownOutputs: true, disableScriptCheck: true });
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
		}
		// let wtxidScure: string;
		// if (tx.txid !== tx.hash) {
		// 	wtxidScure = hex.encode(sha256(sha256(parsedCTx.toBytes(false, true))));
		// } else {
		// 	wtxidScure = tx.txid;
		// }
		return {
			txid: tx.txid, // TXID always stays big-endian
			wtxid: tx.txid === tx.hash ? tx.hash : hex.encode(hex.decode(tx.hash)), // Reverse WTXID only for SegWit TXs
			segwit: tx.txid !== tx.hash
		};
	});

	return { txids, segCounter };
}

// export function coinbaseWitness(parsedCTx: btc.Transaction) {
// 	let witnessReservedValue: string = '00000000000000000000000000000000';
// 	let witnessMerkleRoot: string = '00000000000000000000000000000000';
// 	for (let i = 0; i < parsedCTx.outputsLength; i++) {
// 		const output: TransactionOutput = parsedCTx.getOutput(i);
// 		if (output.script && output.script[0] === 0x6a) {
// 			// OP_RETURN check
// 			if (hex.encode(output.script).startsWith('6a24aa21a9ed')) {
// 				// OP_RETURN + Witness Commitment Tag
// 				witnessMerkleRoot = hex.encode(output.script.slice(10, 74)); // Extract witness-merkle-root (32 bytes after tag)
// 			}
// 			const extractedData = hex.encode(output.script.slice(1)); // OP_RETURN data
// 			witnessReservedValue = ensure32Bytes(extractedData);
// 			break; // Stop after finding the first OP_RETURN
// 		}
// 	}
// 	return { witnessReservedValue, witnessMerkleRoot };
// }
export function coinbaseWitness(parsedCTx: btc.Transaction) {
	let witnessReservedValue = '000999000';
	let witnessMerkleRoot = '000888000';

	// 1️⃣ Extract witness merkle root from OP_RETURN output
	for (let i = 0; i < parsedCTx.outputsLength; i++) {
		const output: TransactionOutput = parsedCTx.getOutput(i);
		if (output.script && output.script[0] === 0x6a) {
			// OP_RETURN check (witness commitment)
			const scriptHex = hex.encode(output.script);
			// if (scriptHex.startsWith('6a24aa21a9ed')) {
			// 	// OP_RETURN (0x6a) + Witness Commitment Tag (0x24aa21a9ed)
			// 	witnessMerkleRoot = scriptHex.slice(10, 74); // Extract 32 bytes of witness merkle root
			// 	console.log('Witness Merkle Root:' + witnessMerkleRoot);
			// }
			const scriptBytes = hex.decode(scriptHex); // Convert hex to bytes
			if (scriptBytes[1] === 0x24 && scriptBytes[2] === 0xaa && scriptBytes[3] === 0x21 && scriptBytes[4] === 0xa9 && scriptBytes[5] === 0xed) {
				// Extract 32 bytes (witness merkle root) starting from byte 6
				witnessMerkleRoot = hex.encode(scriptBytes.slice(6, 38)); // 6 + 32 bytes
				console.log('Witness Merkle Root:' + witnessMerkleRoot);
			}

			break; // Stop after finding the first OP_RETURN
		}
	}

	// 2️⃣ Extract witness reserved value from coinbase transaction's first input
	if (parsedCTx.inputsLength > 0) {
		const coinbaseInput = parsedCTx.getInput(0);

		// `finalScriptWitness` is an array of Uint8Array
		if (coinbaseInput.finalScriptWitness && coinbaseInput.finalScriptWitness.length > 0) {
			const firstWitnessEntry = coinbaseInput.finalScriptWitness[0]; // Extract first witness element
			if (firstWitnessEntry.length >= 32) {
				witnessReservedValue = ensure32Bytes(hex.encode(firstWitnessEntry.slice(0, 32)));
			}
		}
	}

	return { witnessReservedValue, witnessMerkleRoot };
}

function getCommitmentHashFromRawCtx(ctx: string) {
	const chash = ctx.substring(ctx.indexOf('6a24aa21a9ed') + 12, ctx.indexOf('6a24aa21a9ed') + 12 + 64);
	return { witnessMerkleRoot: chash, witnessReservedValue: '0000000000000000000000000000000000000000000000000000000000000000' };
}

function ensure32Bytes(hexStr: string) {
	const clean = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
	if (clean.length < 64) {
		return clean.padEnd(64, '0'); // Pad if too short
	}
	return clean.slice(0, 64); // Trim if too long
}
