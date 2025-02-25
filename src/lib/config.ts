import { ConfigI } from '../types/local_types';
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
	CONFIG.publicAppName = process.env[network + '_sui_publicAppName'] || '';
	CONFIG.publicAppVersion = process.env[network + '_sui_publicAppVersion'] || '';
	CONFIG.walletKey = process.env[network + '_sui_walletKey'] || '';
}

export function getConfig() {
	return CONFIG;
}

export function isDev() {
	const environ = process.env.NODE_ENV;
	return !environ || environ === 'test' || environ === 'development' || environ === 'dev';
}
