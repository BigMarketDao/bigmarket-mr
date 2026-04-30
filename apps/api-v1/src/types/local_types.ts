import { SignatureData } from '@stacks/connect';

export type ConfigI = {
	mongoDbUrl: string;
	mongoUser: string;
	mongoPwd: string;
	mongoDbName: string;
	host: string;
	port: number;
	network: string;
	publicAppBaseUrl: string;
	publicAppName: string;
	publicAppVersion: string;
	stacksApi: string;
	stacksHiroKey: string;
	walletKey: string;
	llmServer: string;
	rpcUser: string;
	rpcPass: string;
	rpcPort: string;
	rpcHost: string;

	mempoolUrl: string;
	bigmarketUrl: string;

	g_client_id: string;
	g_project_id: string;
	g_auth_uri: string;
	g_token_uri: string;
	g_client_secret: string;
	g_redirect_uris: string;
	g_javascript_origins: string;

	zkTlsAppId: string;
	zkTlsAppSecret: string;
	zkTlsProviderGoogle: string;
	zkTlsProviderTwitter: string;
	zkTlsProviderLinkedIn: string;
	zkTlsProviderGithub: string;
};
