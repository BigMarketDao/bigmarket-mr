import { docsNav } from '$lib/content/docs-nav';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return { docsNav };
};
