import { marked } from 'marked';
import { slugifyHeading } from './parse-doc';
import { buildDocHref, docsNav } from './docs-nav';

type RenderContext = {
	sectionSlug: string;
	pageSlug: string;
};

const linkAliases: Record<string, string> = {
	'bigmarket 101': buildDocHref('getting-started', 'bigmarket-101'),
	overview: buildDocHref('getting-started', 'overview'),
	'your first prediction': buildDocHref('trading', 'quickstart'),
	'wallet setup guide in bigmarket 101': `${buildDocHref('getting-started', 'bigmarket-101')}#how-do-i-set-up-a-wallet`,
	'participating in markets': buildDocHref('trading', 'participating-in-markets'),
	'fees and payouts': buildDocHref('trading', 'fees-and-payouts'),
	resolution: buildDocHref('core-concepts', 'resolution'),
	'positions and tokens': buildDocHref('core-concepts', 'positions-and-tokens'),
	'prices and how they move': buildDocHref('core-concepts', 'prices-and-how-they-move'),
	'markets and events': buildDocHref('core-concepts', 'markets-and-events'),
	trading: buildDocHref('trading', 'quickstart'),
	'liquidity providers': '/docs/liquidity',
	'lp overview': buildDocHref('liquidity', 'overview'),
	'getting started as an lp': buildDocHref('liquidity', 'getting-started'),
	quickstart: buildDocHref('trading', 'quickstart')
};

for (const section of docsNav) {
	for (const page of section.pages) {
		linkAliases[page.title.toLowerCase()] = buildDocHref(section.slug, page.slug);
	}
}

function normalizeLinkLabel(label: string): string {
	return label
		.replace(/\s*→\s*$/, '')
		.replace(/^start with\s+/i, '')
		.trim()
		.toLowerCase();
}

function resolveInternalHref(label: string): string | undefined {
	const key = normalizeLinkLabel(label);
	return linkAliases[key];
}

export function resolveDocLinksInMarkdown(markdown: string): string {
	return markdown.replace(/\[([^\]]+)\]\(\s*\)/g, (_match, label: string) => {
		const href = resolveInternalHref(label);
		if (!href) return _match;
		return `[${label}](${href})`;
	});
}

function addHeadingIds(html: string): string {
	return html.replace(/<h([23])>([^<]+)<\/h\1>/g, (_match, depth: string, text: string) => {
		const id = slugifyHeading(text);
		return `<h${depth} id="${id}" class="group scroll-mt-24"><a href="#${id}" class="no-underline hover:underline">${text}</a></h${depth}>`;
	});
}

export function renderMarkdown(markdown: string, _ctx: RenderContext): string {
	const resolved = resolveDocLinksInMarkdown(markdown);
	const html = marked.parse(resolved, { async: false }) as string;
	return addHeadingIds(html);
}
