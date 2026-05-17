import { error } from '@sveltejs/kit';
import { getAdjacentPages, getDocPage } from '$lib/content/docs-nav';
import { loadDoc } from '$lib/content/load-doc';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const meta = getDocPage(params.section, params.page);
	if (!meta) error(404, 'Page not found');

	const doc = loadDoc(params.section, params.page);
	if (!doc) error(404, 'Document not found');

	const { prev, next } = getAdjacentPages(params.section, params.page);

	return {
		section: {
			slug: meta.section.slug,
			title: meta.section.title
		},
		page: {
			slug: meta.page.slug,
			title: meta.page.title
		},
		doc: {
			title: doc.title,
			subtitle: doc.subtitle,
			lede: doc.lede,
			html: doc.html,
			sections: doc.sections
		},
		prev: prev
			? { title: prev.title, href: prev.href, direction: 'prev' as const }
			: null,
		next: next
			? { title: next.title, href: next.href, direction: 'next' as const }
			: null
	};
};
