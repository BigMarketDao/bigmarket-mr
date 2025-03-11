import express from 'express';
import { getConfig, getRpcParams } from '../../lib/config';
import { bitcoinTxProof } from 'bitcoin-tx-proof';
import { fetchTransaction } from '@mijoco/btc_helpers/dist/index';
import { BlockChainInfo, ProofGenerationData, ProofRequest, RpcBlock, RpcTransaction, TransactionProofSet } from 'clarity-bitcoin-client';
import { getProofData, getProofDataRecent, getProofGenerationData } from 'clarity-bitcoin-client';
import { bitcoinRPC } from 'clarity-bitcoin-client';
import { extractProofInfo } from 'clarity-bitcoin-client';

const router = express.Router();

router.get('/blockchain-info', async (req, res) => {
	const block = await bitcoinRPC('getblockchaininfo', [], getRpcParams());
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
router.get('/tx/:txid', async (req, res) => {
	const txM: any = await fetchTransaction(getConfig().mempoolUrl, req.params.txid);
	// not with pruned node const rawTx = await bitcoinRPC('getrawtransaction', [req.params.txid, true], getRpcParams());
	res.json(txM);
});
router.get('/tx/:txid/proof', async (req, res, next) => {
	try {
		const txM: any = await fetchTransaction(getConfig().mempoolUrl, req.params.txid);
		console.log('');
		const data: ProofRequest = await getProofData(req.params.txid, txM.status.block_hash, getRpcParams());
		const pgd: ProofGenerationData = getProofGenerationData(data);
		const proof: TransactionProofSet = extractProofInfo(pgd, data);
		res.json({ proof, data });
	} catch (error) {
		console.log('Error in routes: ', error);
		next('Error - check the transaction not older than 2 days.');
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

export { router as clarityBitcoinRoutes };
