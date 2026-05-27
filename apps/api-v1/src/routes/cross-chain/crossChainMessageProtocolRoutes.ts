import express from 'express';
import { WithdrawFromVaultRequest } from '@bigmarket/sdk';
import { withdrawFromVault, getRelayInfo, sweepRelayAddress } from './messageProtocolHelpers.js';

const router = express.Router();

router.post('/withdraw-from-vault', async (req, res) => {
	try {
		const body: WithdrawFromVaultRequest = req.body;
		console.log('POST /bigmarket-api/cross-chain/protocol/withdraw-from-vault body', body);
		const result = await withdrawFromVault(body);
		res.json(result);
	} catch (err: any) {
		console.error('POST /bigmarket-api/cross-chain/protocol/withdraw-from-vault failed', err);
		res.status(500).json({ error: err.message ?? 'Vault withdrawal failed' });
	}
});

/**
 * GET /cross-chain/protocol/relay-info
 *
 * Returns the server relay address (the Stacks address derived from walletKey)
 * and its current USDCx balance in micro-units.
 */
router.get('/relay-info', async (_req, res) => {
	try {
		const info = await getRelayInfo();
		res.json(info);
	} catch (err: any) {
		console.error('GET /bigmarket-api/cross-chain/protocol/relay-info failed', err);
		res.status(500).json({ error: err.message ?? 'Failed to get relay info' });
	}
});

/**
 * POST /cross-chain/protocol/sweep-relay
 *
 * Body: { recipientAddress: string, amountMicro?: string }
 *
 * Transfers USDCx from the server relay address to any Stacks address.
 * Used on devnet/testnet where AllBridge is unavailable — manually
 * complete an EVM withdrawal demo by draining the relay to a test address.
 * Omitting amountMicro sweeps the entire relay balance.
 */
router.post('/sweep-relay', async (req, res) => {
	try {
		const { recipientAddress, amountMicro } = req.body as {
			recipientAddress: string;
			amountMicro?: string;
		};
		if (!recipientAddress) {
			return res.status(400).json({ error: 'recipientAddress is required' });
		}
		const result = await sweepRelayAddress({ recipientAddress, amountMicro });
		res.json(result);
	} catch (err: any) {
		console.error('POST /bigmarket-api/cross-chain/protocol/sweep-relay failed', err);
		res.status(500).json({ error: err.message ?? 'Relay sweep failed' });
	}
});

export { router as crossChainProtocolRoutes };
