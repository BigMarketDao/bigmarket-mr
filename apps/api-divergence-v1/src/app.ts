import express, { ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import morgan from 'morgan';
import cors from 'cors';
import { CONFIG, getConfig, printConfig, setConfigOnStart } from './lib/config.js';
import { connect } from './lib/data/db_models.js';
import { transactionRoutes } from './routes/transactions/ingestRoutes.js';
import { initWebsocket } from './lib/websockets/init.js';
import cookieParser from 'cookie-parser';
import { initIngestMarketsJob } from './routes/transactions/ingestScheduler.js';

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'devnet') {
	const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
	dotenv.config({ path: existsSync(rootEnv) ? rootEnv : undefined });
}

const app = express();
const port = process.env.PORT || 3020;
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '1mb' })); // for /reclaim/start & most routes
app.use(
	cors({
		origin: ['https://api.testnet.bigmarket.ai', 'http://localhost:8080', 'http://localhost:8081']
	})
);

app.use(morgan('tiny'));
app.use(express.static('public'));
app.use(cors());
setConfigOnStart();

app.use((req, res, next) => {
	if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
		next();
	} else {
		next();
	}
});
app.use(cookieParser());
// If you ever disable jsonProofResponse, allow text on the callback:
app.use('/divergence-api/auth/reclaim/receive-proofs', express.text({ type: '*/*', limit: '5mb' }));

// Example protected route

app.use('/divergence-api/transactions', transactionRoutes);

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	// Optionally narrow:
	const status = (err as any)?.status ?? 500;
	const code = (err as any)?.code ?? 'INTERNAL';
	const msg = process.env.NODE_ENV === 'production' ? 'Something went wrong' : ((err as any)?.message ?? 'Unhandled error');

	console.error('[ERROR]', err);
	res.status(status).json({ error: { code, message: msg } });
};

// Must be AFTER all routes
app.use(errorHandler);

console.log(`\n\nExpress is listening at http://localhost:${getConfig().port}`);
console.log('Startup Environment: ', process.env.NODE_ENV);
console.log('using local db = ' + getConfig().mongoDbName);
console.log('publicAppName = ' + getConfig().publicAppName);
console.log('publicAppVersion = ' + getConfig().publicAppVersion);

async function connectToMongoCloud() {
	printConfig();
	await connect();
	console.log('Connected to MongoDB!');

	const server = app.listen(getConfig().port, () => {
		console.log('Server listening!');
		return;
	});
	initWebsocket(server);
	initIngestMarketsJob.start();
}

connectToMongoCloud();
