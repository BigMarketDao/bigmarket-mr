import express from 'express';
import { getConfig, getRpcParams } from '../../lib/config.js';
import { bitcoinTxProof } from 'bitcoin-tx-proof';
import { fetchTransaction } from '@mijoco/btc_helpers/dist/index.js';
import { bitcoinRPC, BlockChainInfo, extractProofInfo, getProofData, getProofDataRecent, getProofGenerationData, ProofGenerationData, ProofRequest, RpcBlock, RpcTransaction, TransactionProofSet } from 'clarity-bitcoin-client';
import { buildRegtestBitcoinSegwitTransaction, getBitcoinBlockSbtcTestnet } from './client/bitcoin.js';

const router = express.Router();

router.get('/blockchain-info', async (req, res) => {
	const block = await bitcoinRPC('getblockchaininfo', [], getRpcParams());
	res.json(block);
});

router.get('/listunspent', async (req, res) => {
	const block = await bitcoinRPC('listunspent', [1, 99999], getRpcParams());
	res.json(block);
});

router.get('/block/:hash/hex', async (req, res) => {
	const block = await bitcoinRPC('getblock', [req.params.hash, 0], getRpcParams());
	res.json(block);
});
router.get('/block/:hash/header', async (req, res) => {
	const blockHex = await bitcoinRPC('getblock', [req.params.hash, 0], getRpcParams());
	const data = {
		blockHeader: blockHex.slice(0, 160)
	};
	res.json(data);
});
router.get('/block/:hash', async (req, res) => {
	const block: RpcBlock = await bitcoinRPC('getblock', [req.params.hash, 2], getRpcParams());
	res.json(block);
});
router.get('/tx/:txid/rpc', async (req, res) => {
	const tx: RpcTransaction = await bitcoinRPC('getrawtransaction', [req.params.txid, true], getRpcParams());
	// not with pruned node const rawTx = await bitcoinRPC('getrawtransaction', [req.params.txid, true], getRpcParams());
	res.json(tx);
});
router.get('/tx/:txid', async (req, res) => {
	const txM: any = await fetchTransaction(getConfig().mempoolUrl, req.params.txid);
	// not with pruned node const rawTx = await bitcoinRPC('getrawtransaction', [req.params.txid, true], getRpcParams());
	res.json(txM);
});
router.get('/tx/:txid/sbtc-testnet', async (req, res) => {
	const txM: any = await fetchTransaction('https://beta.sbtc-mempool.tech/api/proxy', req.params.txid);
	// not with pruned node const rawTx = await bitcoinRPC('getrawtransaction', [req.params.txid, true], getRpcParams());
	res.json(txM);
});
router.get('/tx/:txid/proof/sbtc-testnet', async (req, res, next) => {
	try {
		const tx = await fetchTransaction('https://beta.sbtc-mempool.tech/api/proxy', req.params.txid);
		const blockhash = tx.status.block_hash;
		//console.log('/tx/:txid/proof/sbtc-testnet: txid: ' + req.params.txid);
		//console.log('/tx/:txid/proof/sbtc-testnet: blockHash: ' + blockhash);

		const block = await getBitcoinBlockSbtcTestnet(req.params.txid, blockhash);
		if (!block) {
			throw new Error('not found: ' + req.params.txid);
		}
		//console.log('/tx/:txid/proof/sbtc-testnet:' + req.params.txid, block);
		//res.json({ block, tx });
		//const blockHex = await bitcoinRPC('getblock', [blockhash, 0], rpcParams);
		const data: ProofRequest = {
			txid: req.params.txid,
			block,
			blockHeader: block.header
		};

		const pgd: ProofGenerationData = getProofGenerationData(data);
		const proof: TransactionProofSet = extractProofInfo(pgd, data);
		res.json({ proof, data });
	} catch (error) {
		console.log('Error in routes: ', error);
		next('Recent mainnet transactions only.');
	}
});

router.get('/tx/:txid/proof', async (req, res, next) => {
	try {
		let txM: any;
		let blockHash: string;
		if (getConfig().network === 'devnet') {
			txM = await bitcoinRPC('getrawtransaction', [req.params.txid, true], getRpcParams());
			console.log('tx rpc: ', txM);
			blockHash = txM.blockhash;
		} else {
			txM = await fetchTransaction(getConfig().mempoolUrl, req.params.txid);
			console.log('tx mempool: ', txM);
			blockHash = txM.status.block_hash;
		}
		console.log('txid' + req.params.txid);
		console.log('network' + getConfig().network);
		console.log('blockHash' + blockHash);
		const data: ProofRequest = await getProofData(req.params.txid, blockHash, getRpcParams());
		const pgd: ProofGenerationData = getProofGenerationData(data);
		const proof: TransactionProofSet = extractProofInfo(pgd, data);
		res.json({ proof, data });
	} catch (error) {
		console.log('Error in routes: ', error);
		next('Recent mainnet transactions only.');
	}
});

router.get('/tx-recent/:index', async (req, res) => {
	const info: BlockChainInfo = await bitcoinRPC('getblockchaininfo', [], getRpcParams());
	const block: RpcBlock = await bitcoinRPC('getblock', [info.bestblockhash, 2], getRpcParams());
	const tx: RpcTransaction = block.tx[Number(req.params.index)];
	res.json({ tx, block });
});

router.get('/tx-recent/:index/proof-data', async (req, res) => {
	const data: ProofRequest = await getProofDataRecent(Number(req.params.index), getRpcParams());
	res.json(getProofGenerationData(data));
});

router.get('/tx-recent/:index/proof', async (req, res) => {
	const data: ProofRequest = await getProofDataRecent(Number(req.params.index), getRpcParams());
	const pgd: ProofGenerationData = getProofGenerationData(data);
	const proof: TransactionProofSet = extractProofInfo(pgd, data);
	console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
	console.log(`/btc-proof/${req.params.index}: `, proof);
	console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
	res.json({ proof, data });
});

router.get('/btc-proof/:txid/:height', async (req, res) => {
	const proof = await bitcoinTxProof(req.params.txid, Number(req.params.height), {
		url: `${getRpcParams().rpcHost}:${getRpcParams().rpcPort}`,
		username: `${getRpcParams().rpcUser}`,
		password: `${getRpcParams().rpcPass}`
	});
	console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
	console.log(`/btc-proof/${req.params.txid}/${req.params.height}: `, proof);
	console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

	res.json(proof);
});

router.get('/send-prediction/:marketId/:outcomeIndex/:stxAddress/:amountBtc', async (req, res) => {
	const resp = await buildRegtestBitcoinSegwitTransaction(Number(req.params.marketId), Number(req.params.outcomeIndex), req.params.stxAddress, Number(req.params.amountBtc));
	console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

	res.json(resp);
});

export { router as clarityBitcoinRoutes };
