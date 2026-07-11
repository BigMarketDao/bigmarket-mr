import type { Handle } from '@sveltejs/kit';
import { startCacheWarming } from '$lib/core/server/cache/cache-warmup';

// Once per SSR worker process
startCacheWarming();

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
