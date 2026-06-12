import express from 'express';
import { WithdrawFromVaultRequest } from '@bigmarket/sdk';
import { withdrawFromVault, executeVaultMarketOp, getRelayInfo, sweepRelayAddress, bridgeRelayToEthereum } from './messageProtocolHelpers.js';
import type { VaultMarketOpRequest } from '@bigmarket/sdk';

const router = express.Router();

/**
 * POST /cross-chain/protocol/vault-market-op
 *
 * Single audited entrypoint for BMP1 vault market ops:
 *   operation: buy-shares | sell-shares | claim-winnings
 */
router.post('/vault-market-op', async (req, res) => {
	try {
		const body = req.body as VaultMarketOpRequest;
		console.log('POST /cross-chain/protocol/vault-market-op', {
			operation: body.operation,
			mappedAddress: body.mappedAddress,
			marketExtension: body.marketExtension,
			tokenContract: body.tokenContract,
			controllerAddress: body.controllerAddress,
			message: body.message,
			signature: body.signature,
			pubkey: body.pubkey
		});
		const result = await executeVaultMarketOp(body);
		res.json(result);
	} catch (err: any) {
		console.error('POST /cross-chain/protocol/vault-market-op failed', err);
		res.status(500).json({ error: err.message ?? 'Vault market operation failed' });
	}
});

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
 * GET /cross-chain/protocol/relay-info?controllerAddress=0x…
 *
 * Returns the mapped Stacks address for `controllerAddress` and its current
 * USDCx balance.  Pass the EVM (0x…) address of the user whose mapped Stacks
 * address received the vault withdrawal.
 */
router.get('/relay-info', async (req, res) => {
	try {
		const controllerAddress = req.query.controllerAddress as string | undefined;
		const info = await getRelayInfo(controllerAddress);
		res.json(info);
	} catch (err: any) {
		console.error('GET /bigmarket-api/cross-chain/protocol/relay-info failed', err);
		res.status(500).json({ error: err.message ?? 'Failed to get relay info' });
	}
});

/**
 * POST /cross-chain/protocol/sweep-relay
 *
 * Body: { controllerAddress: string, recipientAddress: string, amountMicro?: string }
 *
 * Transfers USDCx from the mapped Stacks address of `controllerAddress` to
 * `recipientAddress`.  The server derives the mapped private key from
 * walletKey + controllerAddress (same derivation as createStacksWallet).
 * Used on devnet/testnet where AllBridge is unavailable.
 * Omitting amountMicro sweeps the entire balance.
 */
router.post('/sweep-relay', async (req, res) => {
	try {
		const { controllerAddress, recipientAddress, amountMicro } = req.body as {
			controllerAddress: string;
			recipientAddress: string;
			amountMicro?: string;
		};
		if (!controllerAddress) {
			return res.status(400).json({ error: 'controllerAddress is required' });
		}
		if (!recipientAddress) {
			return res.status(400).json({ error: 'recipientAddress is required' });
		}
		const result = await sweepRelayAddress({ controllerAddress, recipientAddress, amountMicro });
		res.json(result);
	} catch (err: any) {
		console.error('POST /bigmarket-api/cross-chain/protocol/sweep-relay failed', err);
		res.status(500).json({ error: err.message ?? 'Relay sweep failed' });
	}
});

/**
 * POST /cross-chain/protocol/bridge-relay-to-ethereum
 *
 * Body: { controllerAddress: string, toAccountAddress?: string, amountMicro?: string }
 *
 * AllBridge USDCx from the mapped relay address → USDC on Ethereum (mainnet only).
 * Defaults to the full relay balance and the same ETH address as controllerAddress.
 */
router.post('/bridge-relay-to-ethereum', async (req, res) => {
	try {
		const { controllerAddress, toAccountAddress, amountMicro } = req.body as {
			controllerAddress: string;
			toAccountAddress?: string;
			amountMicro?: string;
		};
		if (!controllerAddress) {
			return res.status(400).json({ error: 'controllerAddress is required' });
		}
		const result = await bridgeRelayToEthereum({ controllerAddress, toAccountAddress, amountMicro });
		res.json(result);
	} catch (err: any) {
		console.error('POST /bigmarket-api/cross-chain/protocol/bridge-relay-to-ethereum failed', err);
		res.status(500).json({ error: err.message ?? 'Bridge to Ethereum failed' });
	}
});

export { router as crossChainProtocolRoutes };
