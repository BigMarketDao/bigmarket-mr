import levenshtein from 'fast-levenshtein';
import { fetchAllMarketCategories } from '../predictions/markets_helper.js';

/**
 * Matches the LLM's predicted market sector to the closest allowed category.
 * Returns the best match or assigns a default category if no match is found.
 */
export async function matchMarketSector(predictedSector: string): Promise<string> {
	const categories = await fetchAllMarketCategories();
	predictedSector = predictedSector.trim().toLowerCase();

	let bestMatch = '';
	let lowestDistance = Infinity;

	for (const sector of categories) {
		const distance = levenshtein.get(predictedSector, sector.name.trim().toLowerCase());

		if (distance < lowestDistance) {
			lowestDistance = distance;
			bestMatch = sector.name;
		}
	}
	if (lowestDistance <= 3 && bestMatch.length > 0) return bestMatch;
	for (const sector of categories) {
		if (predictedSector.indexOf(sector.name) > -1) return sector.name;
	}
	return 'crypto';
}
