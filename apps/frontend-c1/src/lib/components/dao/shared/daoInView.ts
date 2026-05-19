/** Optional scroll-reveal; content is never hidden (avoids blank sections if IO does not fire). */
export function daoInView(node: HTMLElement) {
	const reduced =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (reduced) {
		return {};
	}

	node.classList.add('transition-[transform,opacity]', 'duration-700', 'ease-out');

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.remove('translate-y-3', 'opacity-95');
					observer.unobserve(node);
				}
			}
		},
		{ threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
	);

	node.classList.add('translate-y-3', 'opacity-95');
	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
