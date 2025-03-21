import { dataHashSip18, ExchangeRate, fetchStacksInfo, getStacksNetwork, marketDataToTupleCV, PredictionMarketCreateEvent, ScalarMarketDataItem, StoredOpinionPoll } from '@mijoco/stx_helpers/dist/index.js';
import { type StacksInfo } from '@mijoco/stx_helpers/dist/index.js';
import { getConfig } from '../../lib/config.js';
import { broadcastTransaction, bufferCV, Cl, listCV, makeContractCall } from '@stacks/transactions';
import { getDaoConfig } from '../../lib/config_dao.js';
import { daoEventCollection } from '../../lib/data/db_models.js';
import { estimateBitcoinBlockTime, formatFiat } from '../../lib/utils.js';
import { getExchangeRates } from '../rates/rates_utils.js';
import { savePoll } from '../polling/polling_helper.js';
import { fetchAllowedTokens } from '../predictions/markets_helper.js';
import { matchMarketSector } from './matchMarketSector.js';
import { cachedData } from '../predictions/predictionMarketRoutes.js';
import { hexToBytes } from '@stacks/common';
import { getClarityProofForCreateMarket } from './create-market-helper.js';

const bitcoinLogo = 'https://media.istockphoto.com/id/1139020309/vector/bitcoin-internet-money-icon-vector.jpg?s=612x612&w=0&k=20&c=vcRUEDzhndMOctdM7PN1qmipo5rY_aOByWFW0IkW8bs=';
const stacksLogo =
	'data:image/jpeg;base64,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';
const solanaLogo =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAMAAzAMBEQACEQEDEQH/xAAcAAEBAAIDAQEAAAAAAAAAAAAAAQYHBAUIAgP/xABEEAABAwICBQgGBwYGAwAAAAABAAIDBAUGEQcWIVGTEhMxQVNUYdEiQnGBocEUI1KRseHwJDIzYnKSCDVDgoPCc6Ky/8QAGgEBAQEBAQEBAAAAAAAAAAAAAAIDAQUEBv/EAC4RAQEAAQMBBwQBAwUAAAAAAAABAwIEERQFEhUxUWGhIUFSkSITIzJCcbHB4f/aAAwDAQACEQMRAD8A3igICAgIIelBjeK8cWPCsJNzq28+R6NNGeVI73dXvQaSxZpnv13L4bMBa6U7A5npSkf1dXu+9BrSrqZ6ud81VPLPK45ukleXOPtJQfigICAgICC5oIgyHDeM7/hp4NquUzIgczTvPKiP+07PuyQblwbpst1x5qlxHEKCpIA5+PbC4/i39bUG16aohqoGT0szJonjNr43cpp9hQfsgICAgICAgICAg/Kpmip4XzVEjY4o2lz3vOQaPFBo/SFpmkeZLdg9/Ib+7JXlu3cRGD/9fdvQaXqqiarnfPVTSTTPObpJHFznHxJQfigICAgICAgICAgICDKcG45veEKlrrfUl9KT9bSSkmN469nqnxCD0fgbHVnxjTB1DJzVYwZy0shyez2bx4oMrQEBAQEBAQEHDu1yo7Tb5q64VDIKaFvKfI85AIPNGknSVW4sqH0lGX0tnYfQhz9KX+Z/kgwFxByyQfKAgICAgICAgICAgICAg5dtuFVa66Kst9Q+CoidmyRh2hB6R0W6S6bFcTbfciynvDG7R0NqBvb47wg2MCCgqAgICAg/GrqoKOmlqamVsUMTS573HINA25oPL2lHSBPjC4mCmc+K0U7/AKmLo5wj13fIdSDBCUEQEBAQEBAQEBAQEBAQEBBR0oP2pqmalqIqimldFPE4OZIw5FpHWEHpvRRpBixfb/olcWx3emaOdaOiVv2x89yDYKAgICCZoNAadMdurap2GrVMRSwO/bJG9Er9noewde8+xBp4uzCD5QEBBQCgZIGRQMkDIoGSBkgZICBkgZIGSBkgZIAQc+yXarsl0guVulMVTA7lNI6D4HeCg9bYLxJS4rsFPdKT0S8cmWLPbE8dLT+uhB3qAgIML0q4tGE8MyzROArqn6qmb4kbXe4IPKckjpHue9xc5xzc4naTvKD4QEBBQEHeYXsEt6qSXZspYz9ZIPwHit8OG5L9fJ8+4zzFp+nmzgYQsYAH0V58TKV9vTY3mXeZ/U1QsfdHcUqem0Iu9z+vwup9j7o7ilcu30Iu+3Hr8LqfYu6O4pU/0NCLv9x+XwanWLujuKVNw6U3tDc/l8LqdYu6O4pU/wBLSm9o7n8vg1OsXdHcUrn9PSi9p7r8vhdTbF3R3FKm49Kb2pu/y+DU2xd0fxSudyIvau7/AC+F1NsXdH8UqbpiL2vvPy+DUyw90fxSp7sTe2N7+XwpwZYAM3Uzg0DMkzEZLljni+95/wAvhrO8x0sdzqWUD3PpWvIic7pIUv2OC5NWLTck41cfVwEaqEGwNDeL9W8Rtpal+VBXkRy5nYx3qu+SD1C05hBUEKDytpfxOcS4wqeZeTRUOdNTgHYcj6Tve74AIMGQEBBQM0Ha4ess95qxFHmyFpzlly/dHmtsOG5dX08meXLMenmtqUNJBQUkdLSxhkUY2DrPid5Xr6dE0TiPHyarrvNchGNgpsRYqms7FUWM7FBXKixQVFjOxVFiLAKWdiqUWKpsZ2KFNiLPs17jfE5nfJa7dIeYGyeVp2yH7I/l/FY6q/Tdk9mTRxnyz6/aenv/AL/8MJJzXHvvlAQUdexB6o0O4oOJMHw/SH8qtoT9HnJO12Q9F3vHxBQZ0gxbSRftXsHXCtY4NmMfNQ/1O2BB5Hc4uJJOZPSd6D5QEFAzQc6z2uou1Y2nph4veehg3laYsWrJq40p1appnNbWtNugtVGympW5Bv7zj0vO8r3MeKYtPEeZk1XXea5a7YysVRWdirlRYKazsVTWdiqazsUFQixQpsZ2KosRYZqWdiqazsYXjXE5hL7ZbpDznRPKPV/lHjvPuWOvV9eI9zsvs3vf38vl9p/216XHMrJ+k5fKOCAgoKDZWgfEBteMRQSuyguLObIJ9cbWn8UHpgINHf4j7v8A5XZmOyHpVEgB9zc/ig0agICChBl+FsR220290NRDKJnPJdJG0HlDqXobXc48WjjVPqwy49Wu/R3WvNp+zU/2DzX09fi92N2+o14tP2anhjzU9di909LrXXi0fZqf7B5rnW4vdPSZDXi0bqnhjzU9Xi90XZ5PY15tH2an+wea51eP3T0OX2fWvNn3VXDHmp6rGi7DL7GvNn3VXDHmudTjTez83suvNm3VXDHmudToRezc3sox1Z91Vwx5qeo0JvZeb2NerP1iq4Y81z+voReys/t+117s26q4Y81NzaU3snce37/8dfe8cwSUborSyVsrxkZXgDkjwG9Z68ss4jfbdkWa5qzeU+zAnPcXEk5knpKwe8+F0EBAQEHKtlY+33GlrIieXTytkGXgc0Hs+2VbK+3U1XGQWTxNkaRuIzQeYdNVxNw0h3EdLaUMp2+4Zn4koMEQEBBc0DMoIgILmgZoGaBmUDMoGZQM0DNBEFzQRAQEBAQEFHWg9VaGLibho7thefTpw6nPsaSB8MkHmzF1SavFV4qXPLucrZiD4cs5fDJB06AgIKEGX4TsNqutA+SpdI6oY4h7Gv5PJHUvT2e2xZtP8vNnr1WeTvNTLN2U4/5V9V7Pws7k1LqZZezn4q50GH3Rcus1LsvZz8UqehwpufWupdl7Ofilc6HF7ou4yGpdl7KbjFT0eL3TdzkXUuydlNxip6TEm7rKupVk7KbjFc6XGi7zKowXZOxm4xXOlxou9zeqjBVk7GXilTdtjTd9n9fg1KsnYy8UrnT6EXtDP6/C6lWTsJuKVN2+hHiO49fh117wPTfRHSWgPE7BnzT3Z8seazyYJx/Fvt+09Xf4y+Xq1+9pa9zXAhwORBHQvle3zy+UBAQEBBQg3VoYxA224VqKeWTLKteWg9QLGfPNBpmok56olkPrvLvvKD8kBAQEHMtdwqLZVsqqV/Je07Qehw3HwWuLLqxau9pcs5bVtNygulEypp9gOxzCdrHbl+hw5tOXR3tLDVp4c1a2M7BRYzsVTYzsVTYiwU2M7FUWIsVTwzsApsRYoU8M7FU2M7FBUVFjEMZYYFWHXG3sAqAM5ox/qeI8fx/H5c2Ln+UensN73OMWS/T7X0a6IIJzB2L5XuogICAgIO1tVzlo6d0cbiAXl2z2DyQdfURmKoljIy5Dy37ig/JAQEBAQdnYrvPZ6sTQnNjtkkZOxw8/FfRt8+rDq70c1TmNo26tguNIyqpXF0bx19IPWCv0OPJpy6Jq0vnscodC7YiwUosXNTYysVTYixVHDOxQpsRYKUWKFLOwU8M7FU2M7DNRYzsYNjXDXJL7pbmZtO2oiaP3f5h4b18mbFx/LS9nYb3n+1kv1+1YLkV8z2EQEBAQdrarZJWU7pGNzAfyfgPNB9YtpjSYpvFO5vJ5utmAHhyzl8EHUICAgICAg7jDl8lstVyhm6nk2Sx+G8eK+ra7m4NXP2TZyzQYzsxH8WYeHMr1fEMHr8M7jq652btZuCVy7/B6/CLiq66WbtZuCVN32H1+E3DrNdLL2s3BKnrcPr8JuDWa6WXtJ+Eudbh9fhF22s10svaz8JT1mL1qelyLrrZO1n4Snq8frUXZ5AY1svaz8Jc6rH61F2WX0XXay9pNwly7nGm7HN6T9mu9l7SfhKeoxouwz+37XXeydpPwvzU9RjTezs/pP2a72TLLnJyMugw9PxXLnxp8O3HPM4/bXV1mpp7hUS0UZjp3vJjYeoL49XHN4e7imrTok13muGpaCAgoGaDdWhnD7blhWoqJWA51rw0nrAYz55oMP01W91BpDuJOXIqgyoZ7C0A/FpQYIgICAgICC5IGScCICAguSBkgZICCIKgZHcgckrnIZELoiAgIKOhB6q0L291v0d2wSD06jl1B8Q5xI+GSDBf8SFo/yu8MafWp5CB7x8/vQaOQEBAQEFAQdrh+yzXiq5thLYW/xJMuj819W22urPq4nlPM4ZiMFWnLaag/8g8l6/huHj7uVdSrTvqeJ+S54bh9b+096rqVad9TxPyXL2dh9/2jv1dSrQeup4v5KfD8Xv8AtNyajUi0b6niDyU3YYvdNzal1ItG+p4g8lPh+JNz6zUi0H1qniDyXLsMSLudYMD2jfU8QeSm7LGm7rIaj2g+tU8QeS50WNN3mQ1GtH2qn+8eSm7PGm73IajWj7VT/ePJc6TGi7/L7LqNaO0qR7XjyU9LoT4hm9mAXaCGmuFRBTS87DG8tY/eF8OuSarw9fHq1atEurzcJSsQEHKtdHJcLjS0UWfLqJWxjIbzkg9n2ykZQW6mo4wAyCJsYA3AZIOg0k2LWLB1xomtDphHzkP9bdoQeRy0tJDgQR0goPlAQEFQc+z2qoutU2Cn2D13kbGDeVvt8GrPrmjS7NPLaFtoKe20bKWmbkxvST0uPWT+ti/U4cGjDomnS07vDlK6ixc1NiLFU2MrFBU1Fi5qbEWKo4Z2AU8M7FU2IsVRwzsFNiLFUM7GFY0xNyOXbLdJmciKiVp/9R8yvg3Gf693S9DabT/XkjBCc+pfE9J8oCAg2XoHsBumMBXyMzp7eznCSPXOxo/FB6XCBkg8q6XsMOw1jCp5pmVFXZ1FOeoZn0m+4/AhBg6AgqDlW2imuFUynpmcqRx6+ho3k9QWmLDry6po0T6u6dN1XiNn2a1w2ijbBB6Tjtkky2vO/wDJfrNttdODR3Z5+r6po7s4c/NfRU2KoqLBTWdiqbGdiqbEWAKjhnY+gVNiLFU8M7AKWdiqaixVFZ2MUxfiT6Cx1DQu/aj/ABXj/SG72/gvg3Ofu/wnm+rb7bvXv6vJrsuJJJ25rzXovlAQEFHSg9UaHcLnDeD4fpDeTW1x+kTg9Lcx6LfcPiSgzpAQYXpUwk3FmF5YYWj6dTfXUxy25gbW+8IPKcjDG5zHtLXtOTg7YQdyD4QUdaDL8J3i1Wyhe2oLo6lzjynBmeY6l7PZ262+DRe//k+nDr0aZ9Xe62WbvD+GV6Xim29V3Lov3NbLN3l3DK54ntvX4Tden1XWyzd6dwiueJbb8vhF1aTWyy96dwip8R235fCOYutll707hFc8Q2/5fCKuttl707hFT4ht/wAvhFhrbZe9O4RXOv2/5fCbpUYtsvencMqeuweqLov2XW2y96dwypu9weqbi1Gt1l707hlTd7h9UXDrUYusvezwyudZh9UXBrdfesZ0jKRzbU90k7tgcW5NZ4+1YZt7o7vGjzVj2173Opr98jnvc5zi5zjmSes715dtvm+18LgICCjp2oNgaG8HnEuJWVNTHnb6AiWXMbHu9VvzKD1AzY3IbBu3IPpAQQ9CDQGnTApoax2JbXD+yzn9sY3ojf1Oy3Hr8fag06Rs2IIgpJKBmnIZrvNDNOaGac0M05oZpzQzTmhmnNDNcBBEFzQRAQEFHSg51ltNZe7nT263Rc5Uzu5LG9Q3k7gOlB62wXhqlwpYKe10npFg5UsuW2V56T+upB3yAgICD8aymgrKWWmqomywysLJGOGxzT0hB5e0o6P6jB9xNRStdLaKh/1MnTzZ+w75HrQYK4ZIPlAQEBAQEBAQEBAQEBAQEBB+1JTTVlTFTUsTpZpXBkcbBmXE9AQenNFGj6LCNB9LrWtku9Sz61/VE37DfnvQbByQEBAQEBBw7rbaS7UE1BcIGT00zeS9jhmD+t6DzRpK0a12Eqh9VRh9TZ3nNk2Wbov5X+aDAD1IIgICAgICAgICAgICAgIOXbqCrulbFR0EEk9RKcmRsGZKD0lou0aU2FIm3C5Bk95e3a7pbANzfHeUGxkBAQEBAQEBB+VTDFUwvhnjbJFIOS9jhmCDvCDSGkPQy9rpLjhFubNrpKAnaP8Axn/r9yDS1VTz0lQ+CphkhmYcnRyNLXNPiCg/FAQEBAQEBAQEBAQEGU4MwLe8X1LW2+nLKQECSslGUbB/2PgEHo/A+BLTg6lDaKIS1j25TVbx6Tz4bh4BBlaAgICAgICAgICCFBjeK8D2LFUJbc6Nony9Goi9GRvv6/eg0lizQxfbSXz2ci50g2hrfRlaPFvQfd9yDWlVTVFJO6GqglglacnRysLXD2goPyyO5BEFQRAQXIoGSBkgyDDeC8Q4leBabbM+LPbO8ciJv+47D7BmUG5sHaE7fb+aqsSSiuqQATTszETT+LkG1qamhpIGQUsTIYWDJscbQGj3IP2QEBAQEBB//9k=';
const ethereumLogo =
	'data:image/jpeg;base64,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';
const ONE_DAY = 144;
const DAI_MULTIPLIER = 100000000;
const PYTH_MULTIPLIER = 100000000;
export const ORACLE_MULTIPLIER = PYTH_MULTIPLIER;
const STXUSD = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17';
const BTCUSD = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
const SOLUSD = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
const ETHUSD = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';

export async function resolveScalarMarketsOnChain(): Promise<Array<PredictionMarketCreateEvent>> {
	const markets = (await daoEventCollection.find({ 'marketData.resolutionState': 0, event: 'create-market', marketType: 2 }).toArray()) as Array<PredictionMarketCreateEvent>;
	const resolvedMarkets: PredictionMarketCreateEvent[] = [];
	for (const market of markets) {
		console.log('resolveScalarMarketsOnChain: market: ' + market.votingContract.split('.')[1] + ':' + market.marketId + ' ' + market.unhashedData.name);
		const rm = await resolveScalarMarketOnChain(market);
		if (rm) resolvedMarkets.push(rm);
		await sleep(30000);
	}
	return resolvedMarkets;
}

export async function resolveUndisputedScalarMarketsOnChain(): Promise<Array<PredictionMarketCreateEvent>> {
	const markets = (await daoEventCollection.find({ 'marketData.resolutionState': 1, event: 'create-market', marketType: 2 }).toArray()) as Array<PredictionMarketCreateEvent>;
	const resolvedMarkets: PredictionMarketCreateEvent[] = [];
	for (const market of markets) {
		console.log('resolveScalarMarketsOnChain: market: ' + market.votingContract.split('.')[1] + ':' + market.marketId + ' ' + market.unhashedData.name);
		const rm = await resolveUndisputedScalarMarketOnChain(market);
		if (rm) resolvedMarkets.push(rm);
		await sleep(30000);
	}
	return resolvedMarkets;
}

export async function createScalarMarketsOnChain(chain: number) {
	await createMarketOnChain(chain);
}

async function getMetaData(chain: number, endBlockHeight: number, ends: string) {
	const rates = await getExchangeRates();
	const rate = rates.find((o) => o.currency === 'USD');
	if (!rate) throw new Error('Unable to cretae market without rates');
	const btcPrice = rate.fifteen;
	const stxPrice = rate.stxToBtc * btcPrice;
	const ethPrice = rate.ethToBtc * btcPrice;
	const solPrice = rate.solToBtc * btcPrice;
	let coin = 'BTC';
	let price = formatFiat(btcPrice);
	let priceFeedId = BTCUSD;
	let cats = generateOutcomeCategories(btcPrice, 0.01);
	let logo = bitcoinLogo;

	if (chain === 2) {
		coin = 'STX';
		price = formatFiat(stxPrice);
		cats = generateOutcomeCategories(stxPrice, 0.06);
		priceFeedId = STXUSD;
		logo = stacksLogo;
	} else if (chain === 3) {
		coin = 'SOL';
		price = formatFiat(solPrice);
		cats = generateOutcomeCategories(solPrice, 0.04);
		priceFeedId = SOLUSD;
		logo = solanaLogo;
	} else if (chain === 4) {
		coin = 'ETH';
		price = formatFiat(ethPrice);
		cats = generateOutcomeCategories(ethPrice, 0.04);
		priceFeedId = ETHUSD;
		logo = ethereumLogo;
	}

	return {
		title: `${coin} Price Prediction at Bitcoin Block Height: ${endBlockHeight.toLocaleString('en-US')}`,
		description: `Predicting the price of ${coin} at bitcoin block height ${endBlockHeight.toLocaleString('en-US')}, which is expected around ${ends}.<br/><br/>Current price: USD ${price} - The price will resolve into one of several ranges at that time. - The market has two phases: Active: Users can stake. - Cooldown: Staking closes, and final price is determined.`,
		outcome_categories: cats,
		logo,
		priceFeedId,
		criterion: {
			resolvesAt: new Date(ends).getTime(),
			sources: ['Pyth Oracle'],
			criteria: `How the market resolves<br/><br/>BigMarket use the official Pyth price feed oracle on the Stacks blockchain* to determine the final ${coin} price, at bitcoin block ${endBlockHeight.toLocaleString('en-US')}. The result is taken after the cooldown period and locked in on-chain for full transparency..`
		}
	};
}
async function createMarketOnChain(chain: number) {
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
	const current = stacksInfo.burn_block_height;
	const endCooling = current + ONE_DAY + ONE_DAY;
	const ends = estimateBitcoinBlockTime(endCooling, current);
	const meta = await getMetaData(chain, endCooling, ends);
	console.log('createMarketOnChain: getArgsCV: meta: ', meta);
	const market = await convertMarketToLocalFormat(meta);
	await savePoll(market);
	const network = getStacksNetwork(getConfig().network);
	console.log('createMarketOnChain: network: ' + network);
	console.log('createMarketOnChain: getConfig().walletKey: ' + getConfig().walletKey);
	const transaction = await makeContractCall({
		contractAddress: getDaoConfig().VITE_DOA_DEPLOYER,
		contractName: getDaoConfig().VITE_DAO_MARKET_SCALAR,
		functionName: 'create-market',
		functionArgs: await getArgsCV(meta.priceFeedId, market),
		senderKey: getConfig().walletKey,
		network
	});
	const txResult = await broadcastTransaction({ transaction });
	console.log('resolveMarketOnChain: txResult:', txResult);
}

const getArgsCV = async (priceFeeId: string, examplePoll: StoredOpinionPoll) => {
	const proposer = 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY'; //getDaoConfig().VITE_DOA_DEPLOYER;
	const marketFeeCV = examplePoll.marketFee === 0 ? Cl.none() : Cl.some(Cl.uint((examplePoll.marketFee || 0) * 100));
	const metadataHash = bufferCV(hexToBytes(examplePoll.objectHash)); // Assumes the hash is a string of 32 bytes in hex format
	//let proof = cachedData?.contractData.creationGated ? await getClarityProofForCreateMarket(proposer) : Cl.list([]);
	let proof = await getClarityProofForCreateMarket(proposer);
	if (cachedData && !cachedData.contractData.creationGated) proof = Cl.list([]);
	const genCats = examplePoll!.outcomes as Array<ScalarMarketDataItem>;
	console.log('resolveMarketOnChain: getArgsCV: cachedData?.contractData: ', cachedData?.contractData);
	console.log('resolveMarketOnChain: getArgsCV: proof: ', proof);
	const cats = listCV(genCats.map((o) => Cl.tuple({ min: Cl.uint(o.min), max: Cl.uint(o.max) })));
	return [cats, marketFeeCV, Cl.contractPrincipal(examplePoll.token.split('.')[0], examplePoll.token.split('.')[1]), metadataHash, proof, Cl.principal(examplePoll.treasury), Cl.none(), Cl.none(), Cl.bufferFromHex(priceFeeId)];
};

async function convertMarketToLocalFormat(meta: any): Promise<StoredOpinionPoll> {
	const tokens = await fetchAllowedTokens();
	const stxToken = tokens.find((t) => t.token.indexOf('wrapped-stx') > -1);
	if (!stxToken) throw new Error('warapped stx token not found');

	const marketMeta = {
		name: meta.title,
		description: meta.description,
		category: 'crypto',
		criterion: meta.criterion,
		outcomes: meta.outcome_categories,
		logo: meta.logo,

		startBurnHeight: 0,
		endBurnHeight: 0,
		createdAt: new Date().getTime(),
		proposer: getDaoConfig().VITE_DOA_DEPLOYER,
		treasury: `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_TREASURY}`,
		token: stxToken.token,
		merkelRoot: '',
		contractIds: [],
		social: {
			twitter: { projectHandle: 'Stacks' },
			discord: { serverId: '1306302974515089510' },
			website: { url: 'https://www.stacks.co/' }
		},
		marketType: 2,
		marketFee: 2,
		objectHash: '',
		signature: '',
		publicKey: '',
		featured: true,
		processed: false
	};
	const tupleMessage = marketDataToTupleCV(marketMeta.name, marketMeta.category, marketMeta.createdAt, marketMeta.proposer, marketMeta.token);
	const dataHash = dataHashSip18(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, tupleMessage);
	marketMeta.objectHash = dataHash;
	return marketMeta;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveScalarMarketOnChain(market: PredictionMarketCreateEvent) {
	if (market.votingContract !== `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`) throw new Error('Scalar market resolution only: ' + market.unhashedData.name);
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
	const blockHeight = stacksInfo.burn_block_height;
	const endCool = market.marketData.marketStart! + market.marketData.marketDuration! + market.marketData.coolDownPeriod!;
	const network = getStacksNetwork(getConfig().network);
	console.log('resolveScalarMarketOnChain: market: ' + market.marketId + ':' + market.marketType + ' : ' + market.unhashedData.name);
	if (blockHeight >= endCool) {
		const transaction = await makeContractCall({
			network,
			contractAddress: market.votingContract.split('.')[0],
			contractName: market.votingContract.split('.')[1],
			functionName: 'resolve-market',
			functionArgs: [Cl.uint(market.marketId)],
			senderKey: getConfig().walletKey
		});
		const txResult = await broadcastTransaction({ transaction });
		console.log('resolveScalarMarketOnChain: txResult: ', txResult);
		return market;
	}
}

async function resolveUndisputedScalarMarketOnChain(market: PredictionMarketCreateEvent) {
	if (market.votingContract !== `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`) throw new Error('Scalar market resolution only: ' + market.unhashedData.name);
	const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
	const blockHeight = stacksInfo.burn_block_height;
	const endDispute = market.marketData.marketStart! + market.marketData.marketDuration! + market.marketData.coolDownPeriod! + (cachedData?.contractData.disputeWindowLength || 144);
	const network = getStacksNetwork(getConfig().network);
	console.log('resolveScalarMarketOnChain: market: ' + market.marketId + ':' + market.marketType + ' : ' + market.unhashedData.name);
	if (blockHeight >= endDispute) {
		const transaction = await makeContractCall({
			network,
			contractAddress: market.votingContract.split('.')[0],
			contractName: market.votingContract.split('.')[1],
			functionName: 'resolve-market-undisputed',
			functionArgs: [Cl.uint(market.marketId)],
			senderKey: getConfig().walletKey
		});
		const txResult = await broadcastTransaction({ transaction });
		console.log('resolveScalarMarketOnChain: txResult: ', txResult);
		return market;
	}
}

function generateOutcomeCategories(price: number, variance: number): Array<ScalarMarketDataItem> {
	const step = price * variance; // 5% increment
	const categories = [];
	for (let i = -2; i <= 2; i++) {
		const min = Math.round((price + (i - 1) * step) * ORACLE_MULTIPLIER);
		const max = Math.round((price + i * step) * ORACLE_MULTIPLIER);
		categories.push({ min, max });
	}
	return categories;
}
