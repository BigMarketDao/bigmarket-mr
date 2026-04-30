import { DaoConfig } from '@bigmarket/bm-types';
import process from 'process';

let CONFIG = {} as DaoConfig;

export function setDaoConfigOnStart() {
	const network = process.env.NODE_ENV;

	CONFIG.VITE_PEPE_FULL_CONTRACT = process.env[network + '_' + 'VITE_PEPE_FULL_CONTRACT'] || '';
	CONFIG.VITE_USDH_FULL_CONTRACT = process.env[network + '_' + 'VITE_USDH_FULL_CONTRACT'] || '';
	CONFIG.VITE_WRAPPED_STX_FULL_CONTRACT = process.env[network + '_' + 'VITE_WRAPPED_STX_FULL_CONTRACT'] || '';

	CONFIG.VITE_DAO = process.env[network + '_' + 'VITE_DAO'] || '';
	CONFIG.VITE_DAOS = 'ecosystem-dao,bigmarket-dao';
	CONFIG.VITE_DAO_SIP_VOTES = process.env[network + '_' + 'VITE_DAO_SIP_VOTES'] || '';
	CONFIG.VITE_DAO_VOTING_CONTRACTS = process.env[network + '_' + 'VITE_DAO_VOTING_CONTRACTS'] || '';
	CONFIG.VITE_DAO_DEPLOYER = process.env[network + '_' + 'VITE_DAO_DEPLOYER'] || '';
	CONFIG.VITE_DAO_EMERGENCY_EXECUTE_EXTENSION = process.env[network + '_' + 'VITE_DAO_EMERGENCY_EXECUTE_EXTENSION'] || '';
	CONFIG.VITE_DAO_POX = process.env[network + '_' + 'VITE_DAO_POX'] || '';
	CONFIG.VITE_DAO_MARKET_VOTING = process.env[network + '_' + 'VITE_DAO_MARKET_VOTING'] || '';
	CONFIG.VITE_DAO_MARKET_GATING = process.env[network + '_' + 'VITE_DAO_MARKET_GATING'] || '';
	CONFIG.VITE_DAO_MARKET_PREDICTING = process.env[network + '_' + 'VITE_DAO_MARKET_PREDICTING'] || '';
	CONFIG.VITE_DAO_MARKET_SCALAR = process.env[network + '_' + 'VITE_DAO_MARKET_SCALAR'] || '';
	CONFIG.VITE_DAO_MARKET_BITCOIN = process.env[network + '_' + 'VITE_DAO_MARKET_BITCOIN'] || 'bme023-0-market-bitcoin';
	CONFIG.VITE_DAO_TREASURY = process.env[network + '_' + 'VITE_DAO_TREASURY'] || '';
	CONFIG.VITE_DAO_CORE_PROPOSALS = process.env[network + '_' + 'VITE_DAO_CORE_PROPOSALS'] || 'bme003-0-core-proposals';
	CONFIG.VITE_DAO_CORE_VOTING = process.env[network + '_' + 'VITE_DAO_CORE_VOTING'] || 'bme001-0-proposal-voting';
	CONFIG.VITE_DAO_GOVERNANCE_TOKEN = process.env[network + '_' + 'VITE_DAO_GOVERNANCE_TOKEN'] || 'bme000-0-governance-token';
	CONFIG.VITE_DAO_REPUTATION_TOKEN = process.env[network + '_' + 'VITE_DAO_REPUTATION_TOKEN'] || 'bme030-0-reputation-token';
	CONFIG.VITE_DAO_TOKEN_SALE = process.env[network + '_' + 'VITE_DAO_TOKEN_SALE'] || '';
	CONFIG.VITE_DAO_LIQUIDITY_CONTRIBUTION = process.env[network + '_' + 'VITE_DAO_LIQUIDITY_CONTRIBUTION'] || 'bme010-0-liquidity-contribution';
	CONFIG.VITE_DAO_SCALAR_HEDGE_STRATEGY = process.env[network + '_' + 'VITE_DAO_SCALAR_HEDGE_STRATEGY'] || 'bme032-0-scalar-strategy-hedge';
	CONFIG.VITE_DAO_RESOLUTION_COORDINATOR = process.env[network + '_' + 'VITE_DAO_RESOLUTION_COORDINATOR'] || 'bme008-0-resolution-coordinator';

	CONFIG.VITE_SBTC_DEPLOYER = network === 'mainnet' ? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4' : 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT';
}

export function getDaoConfig() {
	return CONFIG;
}

export function printDaoConfig() {
	console.log('== ' + process.env.NODE_ENV + ' ==========================================================');
	console.log('VITE_DAO = ' + CONFIG.VITE_DAO);
	console.log('VITE_DAOS = ' + CONFIG.VITE_DAOS);
	console.log('VITE_DAO_SIP_VOTES = ' + CONFIG.VITE_DAO_SIP_VOTES);
	console.log('VITE_DAO_VOTING_CONTRACTS = ' + CONFIG.VITE_DAO_VOTING_CONTRACTS);
	console.log('VITE_DAO_DEPLOYER = ' + CONFIG.VITE_DAO_DEPLOYER);
	console.log('VITE_DAO_EMERGENCY_EXECUTE_EXTENSION = ' + CONFIG.VITE_DAO_EMERGENCY_EXECUTE_EXTENSION);
	console.log('VITE_DAO_POX = ' + CONFIG.VITE_DAO_POX);
	console.log('VITE_DAO_MARKET_VOTING = ' + CONFIG.VITE_DAO_MARKET_VOTING);
	console.log('VITE_DAO_MARKET_GATING = ' + CONFIG.VITE_DAO_MARKET_GATING);
	console.log('VITE_DAO_MARKET_PREDICTING = ' + CONFIG.VITE_DAO_MARKET_PREDICTING);
	console.log('VITE_DAO_MARKET_SCALAR = ' + CONFIG.VITE_DAO_MARKET_SCALAR);
	console.log('VITE_DAO_MARKET_BITCOIN = ' + CONFIG.VITE_DAO_MARKET_BITCOIN);
	console.log('VITE_DAO_TREASURY = ' + CONFIG.VITE_DAO_TREASURY);
	console.log('VITE_DAO_GOVERNANCE_TOKEN = ' + CONFIG.VITE_DAO_GOVERNANCE_TOKEN);
	console.log('VITE_DAO_TOKEN_SALE = ' + CONFIG.VITE_DAO_TOKEN_SALE);
	console.log('VITE_DAO_REPUTATION_TOKEN = ' + CONFIG.VITE_DAO_REPUTATION_TOKEN);
	console.log('VITE_DAO_LIQUIDITY_CONTRIBUTION = ' + CONFIG.VITE_DAO_LIQUIDITY_CONTRIBUTION);
	console.log('VITE_DAO_RESOLUTION_COORDINATOR = ' + CONFIG.VITE_DAO_RESOLUTION_COORDINATOR);
}
