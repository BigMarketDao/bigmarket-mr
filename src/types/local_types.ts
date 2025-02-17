import { SignatureData } from '@stacks/connect';

export type ConfigI = {
	mongoDbUrl: string;
	mongoUser: string;
	mongoPwd: string;
	mongoDbName: string;
	host: string;
	port: number;
	network: string;
	publicAppName: string;
	publicAppVersion: string;
	stacksApi: string;

	g_client_id: string;
	g_project_id: string;
	g_auth_uri: string;
	g_token_uri: string;
	g_client_secret: string;
	g_redirect_uris: string;
	g_javascript_origins: string;
};

export type ConfigDaoI = {
	VITE_DOA: string;
	VITE_DOAS: string;
	VITE_DOA_VOTING_CONTRACTS: string;
	VITE_DOA_SIP_VOTES: string;
	VITE_DOA_DEPLOYER: string;
	VITE_DOA_EMERGENCY_EXECUTE_EXTENSION: string;
	VITE_DOA_POX: string;
	VITE_DAO_MARKET_VOTING: string;
	VITE_DAO_MARKET_GATING: string;
	VITE_DAO_MARKET_PREDICTING: string;
	VITE_DAO_MARKET_SCALAR: string;
	VITE_DAO_TREASURY: string;
	VITE_DAO_TOKEN_SALE: string;
};
