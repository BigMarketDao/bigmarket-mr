import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import { getConfig, printConfig, setConfigOnStart } from './lib/config.js';
import { WebSocketServer } from 'ws';
import { jwtRoutes } from './routes/jwt/jwtRoutes.js';
import { pollingRoutes } from './routes/polling/pollingRoutes.js';
import { connect } from './lib/data/db_models.js';
import { daoEventRoutes } from './routes/dao/events/daoEventsRoutes.js';
import { predictionMarketRoutes } from './routes/predictions/predictionMarketRoutes.js';
import { myMarketRoutes } from './routes/predictions/my_markets/myMarketRoutes.js';
import { daoProposalRoutes } from './routes/dao/proposals/daoProposalRoutes.js';
import { voterRoutes } from './routes/dao/voter/voterRoutes.js';
import { gatingRoutes } from './routes/gating/gatingRoutes.js';
import { daoSip18VotingRoutes } from './routes/dao/sip18-voting/daoSip18VotingRoutes.js';
import { clarityBitcoinRoutes } from './routes/clarity-bitcoin/clarityBitcoinRoutes.js';
import { tokenSaleRoutes } from './routes/dao/token-sale/tokenSaleRoutes.js';
import { exchangeRoutes } from './routes/rates/exchangeRoutes.js';
import { pythRoutes } from './routes/oracle/pyth/pythRoutes.js';
import { agentRoutes } from './routes/agent/agentRoutes.js';
import { reputationRoutes } from './routes/reputation/reputationRoutes.js';
import { initScanDaoEventsJob } from './routes/dao/events/eventScheduler.js';
import { printDaoConfig, setDaoConfigOnStart } from './lib/config_dao.js';
import { initExchangeRatesJob } from './routes/rates/ratesScheduler.js';
import { initCreateMarketsJobBitcoin, initCreateMarketsJobEthereum, initCreateMarketsJobStacks, initResolveMarketsJob, initResolveUndisputedMarketsJob } from './routes/agent/agentScheduler.js';
import { startUICacheWarming } from './routes/cache/cache_utils.js';
import { runWeeklyClaimSweepJob } from './routes/reputation/reputation-helper.js';
import type { ErrorRequestHandler } from 'express';

if (process.env.NODE_ENV === 'development') {
	dotenv.config();
}

const app = express();
const port = process.env.PORT || 3020;
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());
app.use(
	cors({
		origin: ['http://localhost:5173', 'http://localhost:8060', 'http://localhost:8080', 'http://localhost:8081', 'https://brightblock.org', 'https://bigmarket.ai', 'https://dao.bigmarket.ai']
	})
);

app.use(morgan('tiny'));
app.use(express.static('public'));
app.use(cors());
setConfigOnStart();
setDaoConfigOnStart();

app.use(
	bodyParser.urlencoded({
		extended: true
	})
);
app.use(bodyParser.json());
app.use((req, res, next) => {
	if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
		next();
	} else {
		next();
	}
});

app.use('/bigmarket-api/jwt', jwtRoutes);
app.use('/bigmarket-api/pm', predictionMarketRoutes);
app.use('/bigmarket-api/polling', pollingRoutes);
app.use('/bigmarket-api/my-markets', myMarketRoutes);
app.use('/bigmarket-api/dao/events', daoEventRoutes);
app.use('/bigmarket-api/dao/proposals', daoProposalRoutes);
app.use('/bigmarket-api/dao/voter', voterRoutes);
app.use('/bigmarket-api/dao/sip18-voting', daoSip18VotingRoutes);
app.use('/bigmarket-api/dao/token-sale', tokenSaleRoutes);
app.use('/bigmarket-api/gating', gatingRoutes);
app.use('/bigmarket-api/exchange', exchangeRoutes);
app.use('/bigmarket-api/oracle', pythRoutes);
app.use('/bigmarket-api/agent', agentRoutes);
app.use('/bigmarket-api/reputation', reputationRoutes);
app.use('/bigmarket-api/clarity-bitcoin', clarityBitcoinRoutes);

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
	printDaoConfig();
	await connect();
	console.log('Connected to MongoDB!');
	initScanDaoEventsJob.start();
	initExchangeRatesJob.start();
	initResolveMarketsJob.start();
	initResolveUndisputedMarketsJob.start();
	initCreateMarketsJobBitcoin.start();
	initCreateMarketsJobStacks.start();
	// initCreateMarketsJobSolana.start();
	initCreateMarketsJobEthereum.start();
	runWeeklyClaimSweepJob.start();
	startUICacheWarming(); // runs ui caching every 25s

	const server = app.listen(getConfig().port, () => {
		console.log('Server listening!');
		return;
	});

	const wss = new WebSocketServer({ server });
	// initScanVotingEventsJob.start();

	wss.on('connection', function connection(ws: any) {
		ws.on('message', function incoming(message: any) {
			ws.send('Got your new rates : ' + message);
		});
	});
}

connectToMongoCloud();
