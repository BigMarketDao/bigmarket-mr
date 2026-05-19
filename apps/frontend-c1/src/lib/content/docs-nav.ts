export type DocPage = {
	slug: string;
	title: string;
	file: string;
};

export type DocSection = {
	slug: string;
	title: string;
	description: string;
	pages: DocPage[];
};

export const docsNav: DocSection[] = [
	{
		slug: 'getting-started',
		title: 'Getting Started',
		description:
			'What BigMarket is, how it works, and everything you need before your first prediction.',
		pages: [
			{ slug: 'overview', title: 'Overview', file: 'overview.md' },
			{ slug: 'bigmarket-101', title: 'BigMarket 101', file: 'bigmarket-101.md' }
		]
	},
	{
		slug: 'core-concepts',
		title: 'Core Concepts',
		description: 'Markets, prices, positions, and how outcomes are decided.',
		pages: [
			{ slug: 'markets-and-events', title: 'Markets and Events', file: 'markets-and-events.md' },
			{
				slug: 'prices-and-how-they-move',
				title: 'Prices and How They Move',
				file: 'prices-and-how-they-move.md'
			},
			{ slug: 'positions-and-tokens', title: 'Positions and Tokens', file: 'positions-and-tokens.md' },
			{ slug: 'resolution', title: 'Resolution', file: 'resolution.md' }
		]
	},
	{
		slug: 'trading',
		title: 'Trading',
		description: 'From your first prediction to fees, payouts, and managing positions.',
		pages: [
			{ slug: 'quickstart', title: 'Quickstart', file: 'quickstart.md' },
			{
				slug: 'participating-in-markets',
				title: 'Participating in Markets',
				file: 'participating-in-markets.md'
			},
			{ slug: 'fees-and-payouts', title: 'Fees and Payouts', file: 'fees-and-payouts.md' }
		]
	},
	{
		slug: 'liquidity',
		title: 'Liquidity Providers',
		description: 'Provide liquidity, earn fees, and understand LP risks and rewards.',
		pages: [
			{ slug: 'overview', title: 'Overview', file: 'lp-overview.md' },
			{ slug: 'getting-started', title: 'Getting Started', file: 'lp-getting-started.md' }
		]
	}
];

export const docsDefaultHref = '/docs/getting-started/overview';

export function buildDocHref(sectionSlug: string, pageSlug: string): string {
	return `/docs/${sectionSlug}/${pageSlug}`;
}

export function getSection(sectionSlug: string): DocSection | undefined {
	return docsNav.find((s) => s.slug === sectionSlug);
}

export function getDocPage(
	sectionSlug: string,
	pageSlug: string
): { section: DocSection; page: DocPage } | undefined {
	const section = getSection(sectionSlug);
	if (!section) return undefined;
	const page = section.pages.find((p) => p.slug === pageSlug);
	if (!page) return undefined;
	return { section, page };
}

export type AdjacentDoc = {
	sectionSlug: string;
	pageSlug: string;
	title: string;
	href: string;
};

export function getAdjacentPages(
	sectionSlug: string,
	pageSlug: string
): { prev: AdjacentDoc | null; next: AdjacentDoc | null } {
	const flat: AdjacentDoc[] = docsNav.flatMap((section) =>
		section.pages.map((page) => ({
			sectionSlug: section.slug,
			pageSlug: page.slug,
			title: page.title,
			href: buildDocHref(section.slug, page.slug)
		}))
	);
	const index = flat.findIndex((d) => d.sectionSlug === sectionSlug && d.pageSlug === pageSlug);
	if (index < 0) return { prev: null, next: null };
	return {
		prev: index > 0 ? flat[index - 1]! : null,
		next: index < flat.length - 1 ? flat[index + 1]! : null
	};
}

export const startHerePath: AdjacentDoc[] = [
	{
		sectionSlug: 'getting-started',
		pageSlug: 'overview',
		title: 'Overview',
		href: buildDocHref('getting-started', 'overview')
	},
	{
		sectionSlug: 'getting-started',
		pageSlug: 'bigmarket-101',
		title: 'BigMarket 101',
		href: buildDocHref('getting-started', 'bigmarket-101')
	},
	{
		sectionSlug: 'trading',
		pageSlug: 'quickstart',
		title: 'Quickstart',
		href: buildDocHref('trading', 'quickstart')
	}
];
