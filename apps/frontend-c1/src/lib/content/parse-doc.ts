export type DocHeading = {
	id: string;
	title: string;
	level: number;
};

export type ParsedDoc = {
	title: string;
	subtitle: string;
	lede: string;
	excerpt: string;
	sections: DocHeading[];
	bodyMarkdown: string;
};

export function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

function truncate(text: string, max = 160): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= max) return normalized;
	return `${normalized.slice(0, max - 1).trim()}…`;
}

function extractParagraphs(block: string): string[] {
	return block
		.split(/\n\n+/)
		.map((p) => p.trim())
		.filter((p) => p.length > 0 && !p.startsWith('#') && !p.startsWith('---') && !p.startsWith('*'));
}

export function parseDoc(markdown: string): ParsedDoc {
	const [frontmatter, ...bodyParts] = markdown.split(/\n---\n/);
	const body = bodyParts.join('\n---\n').trim();

	const frontLines = (frontmatter ?? '').split('\n');
	const titleLine = frontLines.find((l) => l.startsWith('# '));
	const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : 'Documentation';

	const afterTitleLines = titleLine
		? frontLines.slice(frontLines.indexOf(titleLine) + 1)
		: frontLines;
	const subtitle = afterTitleLines
		.map((l) => l.trim())
		.filter((l) => l.length > 0)[0] ?? '';

	const ledeParagraphs = extractParagraphs(body);
	const lede = ledeParagraphs[0] ?? subtitle;
	const excerpt = truncate(lede || subtitle);

	const sections: DocHeading[] = [];
	for (const line of body.split('\n')) {
		const h2 = line.match(/^## (.+)$/);
		if (h2) {
			const sectionTitle = h2[1]!.trim();
			sections.push({ id: slugifyHeading(sectionTitle), title: sectionTitle, level: 2 });
		}
	}

	return {
		title,
		subtitle,
		lede,
		excerpt,
		sections,
		bodyMarkdown: body
	};
}
