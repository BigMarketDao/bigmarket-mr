import { docsNav } from './docs-nav';
import { parseDoc, type ParsedDoc } from './parse-doc';
import { renderMarkdown } from './render-markdown';

const docModules = import.meta.glob('/src/content/docs/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const fileToRaw = new Map<string, string>();
for (const [path, raw] of Object.entries(docModules)) {
	const name = path.split('/').pop() ?? '';
	fileToRaw.set(name, raw);
}

export type LoadedDoc = ParsedDoc & {
	html: string;
	file: string;
	sectionSlug: string;
	pageSlug: string;
};

export function getRawDocByFile(file: string): string | undefined {
	return fileToRaw.get(file);
}

export function loadDocByFile(
	file: string,
	sectionSlug: string,
	pageSlug: string
): LoadedDoc | undefined {
	const raw = getRawDocByFile(file);
	if (!raw) return undefined;
	const parsed = parseDoc(raw);
	const html = renderMarkdown(parsed.bodyMarkdown, { sectionSlug, pageSlug });
	return {
		...parsed,
		html,
		file,
		sectionSlug,
		pageSlug
	};
}

export function loadDoc(sectionSlug: string, pageSlug: string): LoadedDoc | undefined {
	const section = docsNav.find((s) => s.slug === sectionSlug);
	const page = section?.pages.find((p) => p.slug === pageSlug);
	if (!section || !page) return undefined;
	return loadDocByFile(page.file, sectionSlug, pageSlug);
}

export function loadAllDocsInSection(sectionSlug: string): LoadedDoc[] {
	const section = docsNav.find((s) => s.slug === sectionSlug);
	if (!section) return [];
	return section.pages
		.map((page) => loadDocByFile(page.file, sectionSlug, page.slug))
		.filter((d): d is LoadedDoc => d !== undefined);
}

export function loadAllDocs(): LoadedDoc[] {
	return docsNav.flatMap((section) => loadAllDocsInSection(section.slug));
}
