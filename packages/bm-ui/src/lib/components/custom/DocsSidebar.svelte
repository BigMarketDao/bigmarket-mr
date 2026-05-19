<script lang="ts">
	export type DocsSidebarSection = {
		slug: string;
		title: string;
		pages: Array<{ slug: string; title: string; href: string }>;
	};

	let {
		sections,
		currentSection,
		currentPage,
		onNavigate
	}: {
		sections: DocsSidebarSection[];
		currentSection: string | null;
		currentPage: string | null;
		onNavigate?: () => void;
	} = $props();
</script>

<nav aria-label="Documentation" class="flex flex-col">
	{#each sections as section, sectionIndex (section.slug)}
		<div
			class={sectionIndex > 0
				? 'mt-8 border-t border-border/70 pt-6'
				: ''}
		>
			<p
				class="mb-3 px-3 text-[11px] font-bold tracking-[0.14em] text-foreground uppercase"
			>
				{section.title}
			</p>
			<ul class="space-y-0.5">
				{#each section.pages as page (page.slug)}
					{@const isActive =
						currentSection === section.slug && currentPage === page.slug}
					<li>
						<a
							href={page.href}
							onclick={() => onNavigate?.()}
							class={`block rounded-md border-l-2 py-2 pr-3 pl-4 text-xs font-semibold tracking-wide uppercase transition-colors duration-200 ${
								isActive
									? 'border-primary bg-primary/20 text-foreground hover:bg-primary/25 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20'
									: 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/80 hover:text-foreground'
							}`}
							aria-current={isActive ? 'page' : undefined}
						>
							{page.title}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</nav>
