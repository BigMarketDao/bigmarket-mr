import { LeaderBoard, PredictionMarketStakeEvent, TopMarket } from '@mijoco/stx_helpers/dist/index.js';
import { daoEventCollection } from '../../lib/data/db_models.js';

export async function getLeaderBoard(): Promise<LeaderBoard> {
	const changes = {
		latestPredicitons: await getLatestPredictEvents(),
		topMarkets: await topTVLMarkets()
	};
	return changes;
}

async function getLatestPredictEvents(): Promise<Array<PredictionMarketStakeEvent>> {
	const latestEvents = await daoEventCollection.find({ event: 'market-stake' }).sort({ _id: -1 }).limit(10).toArray();

	// console.log(latestEvents);
	return latestEvents as Array<PredictionMarketStakeEvent>;
}
async function topTVLMarkets(): Promise<Array<TopMarket>> {
	const topMarketData = await daoEventCollection
		.aggregate([
			{
				$match: { 'marketData.concluded': false } // Filter only non-concluded markets
			},
			{
				$addFields: { totalStakes: { $sum: '$marketData.stakes' } } // Calculate total stakes
			},
			{
				$sort: { totalStakes: -1 } // Sort by highest total stakes
			},
			{
				$limit: 5 // Get top 5 markets
			}
		])
		.toArray();
	const topMarkets = topMarketData.map((o) => {
		return {
			market: o,
			totalStakes: o.totalStakes
		};
	});
	console.log(topMarkets);
	return topMarkets as Array<TopMarket>;
}
