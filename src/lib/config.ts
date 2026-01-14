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
	console.log('zkTlsAppId = ' + CONFIG.zkTlsAppId);
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

	CONFIG.zkTlsAppId = process.env[network + '_ZKTLS_APP_ID'] || '';
	CONFIG.zkTlsAppSecret = process.env[network + '_ZKTLS_APP_SECRET'] || '';
	CONFIG.zkTlsProviderGoogle = process.env[network + '_ZKTLS_PROVIDER_GOOGLE'] || '';
	CONFIG.zkTlsProviderTwitter = process.env[network + '_ZKTLS_PROVIDER_TWITTER'] || '';
	CONFIG.zkTlsProviderLinkedIn = process.env[network + '_ZKTLS_PROVIDER_LINKEDIN'] || '';
	CONFIG.zkTlsProviderGithub = process.env[network + '_ZKTLS_PROVIDER_GITHUB'] || '';

	CONFIG.mempoolUrl = 'https://mempool.space/api';
	CONFIG.bigmarketUrl = 'https://bigmarket.ai';

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
	{ stxAddress: 'ST3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNZN9J752', btcAddress: '' },
	{ stxAddress: 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G5', btcAddress: 'bc1qkj5yxgm3uf78qp2fdmgx2k76ccdvj7rx0qwhv0' },
	{ stxAddress: 'ST1NXBK3K5YYMD6FD41MVNP3JS1GABZ8TRVX023PT', btcAddress: 'bc1qkj5yxgm3uf78qp2fdmgx2k76ccdvj7rx0qwhv0' },
	{ stxAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', btcAddress: 'tb1q6ue638m4t5knwxl4kwhwyuffttlp0ffee3zn3e' },
	{ stxAddress: 'SP3N4AJFZZYC4BK99H53XP8KDGXFGQ2PRSQP2HGT6', btcAddress: 'tb1q6ue638m4t5knwxl4kwhwyuffttlp0ffee3zn3e' },
	{ stxAddress: 'ST3N4AJFZZYC4BK99H53XP8KDGXFGQ2PRSPNET8TN', btcAddress: 'tb1q6ue638m4t5knwxl4kwhwyuffttlp0ffee3zn3e' },
	{ stxAddress: 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY', btcAddress: '' },
	{ stxAddress: 'SP1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28GBQA1W0F', btcAddress: '' },
	{ stxAddress: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0', btcAddress: '' },
	{ stxAddress: 'ST22NW0RYCW4GFZRPE8VGJRCKGQMRMMX492QET2ZC', btcAddress: '' },
	{ stxAddress: 'STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A', btcAddress: '' },
	{ stxAddress: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ', btcAddress: '' }, //am
	{ stxAddress: 'SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29', btcAddress: '' },
	{ stxAddress: 'SP2XFH8D1MM2G11C0S6AZRSNP031RAY92XCARPRSQ', btcAddress: '' },
	{ stxAddress: 'SP3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX52CR6XQ', btcAddress: '' },
	{ stxAddress: 'ST3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F46VC5SPJ', btcAddress: '' },
	{ stxAddress: 'ST3NS9010CQ9AK3M6XN3XD9EHNTDZVGYSMCBG3K6Z', btcAddress: '' },
	{ stxAddress: 'SP2Z2CBMGWB9MQZAF5Z8X56KS69XRV3SJF4WKJ7J9', btcAddress: '' }, // deorg
	{ stxAddress: 'SPQE3J7XMMK0DN0BWJZHGE6B05VDYQRXRMDV734D', btcAddress: '' } // jb
];
