import { ConfigI } from '../types/local_types.js';
import process from 'process';

let CONFIG = {} as ConfigI;
export let BASE_URL: string;

export function printConfig() {
	console.log('== ' + process.env.NODE_ENV + ' ==========================================================');
	console.log('mongoDbUrl = ' + CONFIG.mongoDbUrl);
	console.log('mongoDbName = ' + CONFIG.mongoDbName);
	console.log('mongoUser = ' + CONFIG.mongoUser);
	console.log('mongoPwd = ' + CONFIG.mongoPwd);
	console.log('host = ' + CONFIG.host + ':' + CONFIG.port);
	console.log('stacksApi = ' + CONFIG.stacksApi);
	console.log('network = ' + CONFIG.network);
	console.log('publicAppName = ' + CONFIG.publicAppName);
	console.log('publicAppVersion = ' + CONFIG.publicAppVersion);
	console.log('walletKey = ' + CONFIG.walletKey);
	console.log('llmServer = ' + CONFIG.llmServer);
	console.log('rpcUser = ' + CONFIG.rpcUser);
	console.log('rpcHost = ' + CONFIG.rpcHost);
	console.log('rpcPort = ' + CONFIG.rpcPort);
}

export function setConfigOnStart() {
	const network = process.env.NODE_ENV;

	CONFIG.g_client_id = process.env[network + '_g_client_id'] || '';
	CONFIG.g_project_id = process.env[network + '_g_project_id'] || '';
	CONFIG.g_auth_uri = process.env[network + '_g_auth_uri'] || '';
	CONFIG.g_token_uri = process.env[network + '_g_token_uri'] || '';
	CONFIG.g_client_secret = process.env[network + '_g_client_secret'] || '';
	CONFIG.g_redirect_uris = process.env[network + '_g_redirect_uris'] || '';
	CONFIG.g_javascript_origins = process.env[network + '_g_javascript_origins'] || '';

	CONFIG.host = process.env[network + '_sui_host'] || '';
	CONFIG.port = Number(process.env[network + '_sui_port']) || 6060;
	CONFIG.host = process.env[network + '_sui_host'] || '';

	CONFIG.mongoDbUrl = process.env[network + '_sui_mongoDbUrl'] || '';
	CONFIG.mongoDbName = process.env[network + '_sui_mongoDbName'] || '';
	CONFIG.mongoUser = process.env[network + '_sui_mongoUser'] || '';
	CONFIG.mongoPwd = process.env[network + '_sui_mongoPwd'] || '';

	CONFIG.network = process.env[network + '_sui_network'] || '';
	CONFIG.stacksApi = process.env[network + '_sui_stacksApi'] || '';
	CONFIG.publicAppBaseUrl = network === 'devnet' ? 'http://localhost:8081' : 'http://localhost:3000';
	CONFIG.publicAppName = process.env[network + '_sui_publicAppName'] || '';
	CONFIG.publicAppVersion = process.env[network + '_sui_publicAppVersion'] || '';
	CONFIG.walletKey = process.env[network + '_sui_walletKey'] || '';
	CONFIG.llmServer = process.env[network + '_sui_llmServer'] || '';
	CONFIG.rpcUser = process.env[network + '_RPC_USER'] || '';
	CONFIG.rpcPass = process.env[network + '_RPC_PASS'] || '';
	CONFIG.rpcHost = process.env[network + '_RPC_HOST'] || '';
	CONFIG.rpcPort = process.env[network + '_RPC_PORT'] || '';

	CONFIG.mempoolUrl = 'https://mempool.space/api';
	//CONFIG.mempoolUrl = 'https://beta.sbtc-mempool.tech/api/proxy';
}

export function getConfig() {
	return CONFIG;
}

export function getRpcParams() {
	if (getConfig().network === 'devnet') {
		console.log(' + getRpcParams ++++++++++++++++++++++++++++++++++++++++++++++++++++');
		return {
			rpcHost: 'http://127.0.0.1',
			rpcPort: '18445',
			rpcPass: 'devnet',
			rpcUser: 'devnet',
			wallet: 'bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47'
		};
	}
	return {
		rpcHost: CONFIG.rpcHost,
		rpcPort: CONFIG.rpcPort,
		rpcPass: CONFIG.rpcPass,
		rpcUser: CONFIG.rpcUser,
		wallet: 'bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47'
	};
}

export function isDev() {
	const environ = process.env.NODE_ENV;
	return !environ || environ === 'test' || environ === 'development' || environ === 'dev';
}
