import { docsNav } from '$lib/content/docs-nav';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { docsNav };
};
