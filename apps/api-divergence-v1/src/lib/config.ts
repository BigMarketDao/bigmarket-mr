import { ConfigI } from '../types/local_types.js';
import process from 'process';

export let CONFIG = {} as ConfigI;

export function printConfig() {
	console.log('== ' + process.env.NODE_ENV + ' ==========================================================');
	console.log('mongoDbName = ' + CONFIG.mongoDbName);
	console.log('mongoUser = ' + CONFIG.mongoUser);
	console.log('host = ' + CONFIG.host + ':' + CONFIG.port);
	console.log('network = ' + CONFIG.network);
	console.log('publicAppName = ' + CONFIG.publicAppName);
	console.log('publicAppVersion = ' + CONFIG.publicAppVersion);
}

export function setConfigOnStart() {
	const network = process.env.NODE_ENV;
	CONFIG.host = process.env[network + '_div_host'] || '';
	CONFIG.port = Number(process.env[network + '_div_port']) || 6060;

	CONFIG.mongoDbUrl = process.env[network + '_div_mongoDbUrl'] || '';
	CONFIG.mongoDbName = process.env[network + '_div_mongoDbName'] || '';
	CONFIG.mongoUser = process.env[network + '_div_mongoUser'] || '';
	CONFIG.mongoPwd = process.env[network + '_div_mongoPwd'] || '';

	CONFIG.network = process.env[network + '_div_network'] || '';
	CONFIG.publicAppBaseUrl = network === 'devnet' ? 'http://localhost:8081' : 'http://localhost:3000';
	CONFIG.publicAppName = process.env[network + '_div_publicAppName'] || '';
	CONFIG.publicAppVersion = process.env[network + '_div_publicAppVersion'] || '';
	CONFIG.openSeaApiKey = process.env[network + '_div_openSeaApiKey'] || '';
}

export function getConfig() {
	return CONFIG;
}

export function isDev() {
	const environ = process.env.NODE_ENV;
	return !environ || environ === 'test' || environ === 'development' || environ === 'dev';
}
