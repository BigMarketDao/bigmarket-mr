import { error } from '@sveltejs/kit';
import { getSection } from '$lib/content/docs-nav';
import { loadAllDocsInSection } from '$lib/content/load-doc';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const section = getSection(params.section);
	if (!section) error(404, 'Section not found');

	const pages = loadAllDocsInSection(params.section).map((doc) => ({
		slug: doc.pageSlug,
		title: doc.title,
		excerpt: doc.excerpt,
		topics: doc.sections.slice(0, 3).map((s) => s.title),
		href: `/docs/${params.section}/${doc.pageSlug}`
	}));

	return {
		section: {
			slug: section.slug,
			title: section.title,
			description: section.description
		},
		pages
	};
};
