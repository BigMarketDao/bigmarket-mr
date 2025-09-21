import { hex } from '@scure/base';
import * as btc from '@scure/btc-signer';
import { Cl } from '@stacks/transactions';
import { bitcoinRPC } from 'clarity-bitcoin-client';
import { getRpcParams } from '../../../lib/config.js';
import { fetchTransaction } from '../clarityBitcoinRoutes.js';

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
export async function fetchTransactionHex(mempoolUrl: string, txid: string) {
	try {
		//https://api.blockcypher.com/v1/btc/test3/txs/<txID here>?includeHex=true
		//https://mempool.space/api/tx/15e10745f15593a899cef391191bdd3d7c12412cc4696b7bcb669d0feadc8521/hex
		const url = mempoolUrl + '/tx/' + txid + '/hex';
		const response = await fetch(url);
		const hex = await response.text();
		return hex;
	} catch (err) {
		console.log(err);
		return;
	}
}
export const REGTEST_NETWORK: typeof btc.NETWORK = {
	bech32: 'bcrt',
	pubKeyHash: 0x6f,
	scriptHash: 0xc4,
	wif: 0xc4
};
