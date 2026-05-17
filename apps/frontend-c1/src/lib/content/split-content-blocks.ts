import { renderMarkdown } from './render-markdown';

export type DocContentBlock =
	| { type: 'html'; value: string }
	| { type: 'mermaid'; chart: string; caption?: string };

type RenderContext = {
	sectionSlug: string;
	pageSlug: string;
};

const MERMAID_FENCE_RE = /```mermaid\n([\s\S]*?)```/g;
const CAPTION_RE = /^\s*\n?\*Diagram:\s*([^*]+)\*\s*/;

export function splitBodyIntoBlocks(
	bodyMarkdown: string,
	ctx: RenderContext
): DocContentBlock[] {
	const blocks: DocContentBlock[] = [];
	let lastIndex = 0;

	for (const match of bodyMarkdown.matchAll(MERMAID_FENCE_RE)) {
		const index = match.index ?? 0;
		const before = bodyMarkdown.slice(lastIndex, index).trim();
		if (before) {
			blocks.push({ type: 'html', value: renderMarkdown(before, ctx) });
		}

		const chart = match[1]?.trim() ?? '';
		let afterIndex = index + match[0].length;
		let caption: string | undefined;

		const afterFence = bodyMarkdown.slice(afterIndex);
		const captionMatch = afterFence.match(CAPTION_RE);
		if (captionMatch) {
			caption = captionMatch[1]?.trim();
			afterIndex += captionMatch[0].length;
		}

		if (chart) {
			blocks.push({ type: 'mermaid', chart, caption });
		}

		lastIndex = afterIndex;
	}

	const rest = bodyMarkdown.slice(lastIndex).trim();
	if (rest) {
		blocks.push({ type: 'html', value: renderMarkdown(rest, ctx) });
	}

	if (blocks.length === 0 && bodyMarkdown.trim()) {
		blocks.push({ type: 'html', value: renderMarkdown(bodyMarkdown, ctx) });
	}

	return blocks;
}
