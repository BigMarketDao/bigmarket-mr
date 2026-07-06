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
	apiBaseUrl: string;
	authFrontendReturnUrl: string;
	jwtSecret: string;

	oauthGoogleClientId: string;
	oauthGoogleClientSecret: string;
	oauthFacebookClientId: string;
	oauthFacebookClientSecret: string;
	oauthLinkedinClientId: string;
	oauthLinkedinClientSecret: string;
	oauthGithubClientId: string;
	oauthGithubClientSecret: string;
	oauthTwitterClientId: string;
	oauthTwitterClientSecret: string;
};
