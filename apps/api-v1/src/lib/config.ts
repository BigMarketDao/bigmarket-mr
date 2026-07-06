import { ConfigI } from '../types/local_types.js';
import process from 'process';

export let CONFIG = {} as ConfigI;
export let BASE_URL: string;

export function printConfig() {
	console.log('== ' + process.env.NODE_ENV + ' ==========================================================');
	console.log('mongoDbName = ' + CONFIG.mongoDbName);
	console.log('mongoUser = ' + CONFIG.mongoUser);
	console.log('host = ' + CONFIG.host + ':' + CONFIG.port);
	console.log('stacksApi = ' + CONFIG.stacksApi);
	console.log('stacksHiroKey = ' + CONFIG.stacksHiroKey.substring(0, 3));
	console.log('network = ' + CONFIG.network);
	console.log('publicAppName = ' + CONFIG.publicAppName);
	console.log('publicAppVersion = ' + CONFIG.publicAppVersion);
	console.log('apiBaseUrl = ' + CONFIG.apiBaseUrl);
	console.log('authFrontendReturnUrl = ' + CONFIG.authFrontendReturnUrl);
	console.log('llmServer = ' + CONFIG.llmServer);
	console.log('rpcUser = ' + CONFIG.rpcUser);
	console.log('rpcHost = ' + CONFIG.rpcHost);
	console.log('rpcPort = ' + CONFIG.rpcPort);
}

export function setConfigOnStart() {
	const network = process.env.NODE_ENV;

	CONFIG.host = process.env[network + '_sui_host'] || '';
	CONFIG.port = Number(process.env[network + '_sui_port']) || 6060;

	CONFIG.mongoDbUrl = process.env[network + '_sui_mongoDbUrl'] || '';
	CONFIG.mongoDbName = process.env[network + '_sui_mongoDbName'] || '';
	CONFIG.mongoUser = process.env[network + '_sui_mongoUser'] || '';
	CONFIG.mongoPwd = process.env[network + '_sui_mongoPwd'] || '';

	CONFIG.network = process.env[network + '_sui_network'] || '';
	CONFIG.stacksApi = process.env[network + '_sui_stacksApi'] || '';
	CONFIG.stacksHiroKey = process.env[network + '_sui_stacksHiroKey'] || '';
	CONFIG.publicAppBaseUrl = network === 'devnet' ? 'http://localhost:8081' : 'http://localhost:3000';
	CONFIG.publicAppName = process.env[network + '_sui_publicAppName'] || '';
	CONFIG.publicAppVersion = process.env[network + '_sui_publicAppVersion'] || '';
	CONFIG.walletKey = process.env[network + '_sui_walletKey'] || '';
	CONFIG.llmServer = process.env[network + '_sui_llmServer'] || '';
	CONFIG.rpcUser = process.env[network + '_RPC_USER'] || '';
	CONFIG.rpcPass = process.env[network + '_RPC_PASS'] || '';
	CONFIG.rpcHost = process.env[network + '_RPC_HOST'] || '';
	CONFIG.rpcPort = process.env[network + '_RPC_PORT'] || '';

	CONFIG.jwtSecret = process.env[network + '_JWT_SECRET'] || '';
	CONFIG.apiBaseUrl =
		process.env[network + '_sui_apiBaseUrl'] ||
		(network === 'devnet'
			? `http://localhost:${CONFIG.port}`
			: network === 'mainnet'
				? 'https://api.bigmarket.ai'
				: `https://api.${CONFIG.network}.bigmarket.ai`);
	CONFIG.authFrontendReturnUrl =
		process.env[network + '_oauth_frontend_return_url'] ||
		(network === 'devnet'
			? 'http://localhost:8081/auth/callback'
			: network === 'mainnet'
				? 'https://bigmarket.ai/auth/callback'
				: `https://${CONFIG.network}.bigmarket.ai/auth/callback`);

	CONFIG.oauthGoogleClientId = process.env[network + '_oauth_google_client_id'] || '';
	CONFIG.oauthGoogleClientSecret = process.env[network + '_oauth_google_client_secret'] || '';
	CONFIG.oauthFacebookClientId = process.env[network + '_oauth_facebook_client_id'] || '';
	CONFIG.oauthFacebookClientSecret = process.env[network + '_oauth_facebook_client_secret'] || '';
	CONFIG.oauthLinkedinClientId = process.env[network + '_oauth_linkedin_client_id'] || '';
	CONFIG.oauthLinkedinClientSecret = process.env[network + '_oauth_linkedin_client_secret'] || '';
	CONFIG.oauthGithubClientId = process.env[network + '_oauth_github_client_id'] || '';
	CONFIG.oauthGithubClientSecret = process.env[network + '_oauth_github_client_secret'] || '';
	CONFIG.oauthTwitterClientId = process.env[network + '_oauth_twitter_client_id'] || '';
	CONFIG.oauthTwitterClientSecret = process.env[network + '_oauth_twitter_client_secret'] || '';

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

export const coordinators = [
	{ stxAddress: 'SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29', btcAddress: '' },
	{ stxAddress: 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z', btcAddress: '' }
];
