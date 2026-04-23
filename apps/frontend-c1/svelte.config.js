import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => {
			// enable for your app + workspace Svelte packages (must list every package that uses $props / runes)
			if (filename.includes('apps/frontend-c1')) return true;
			if (filename.includes('bm-ui')) return true;
			if (filename.includes('bm-common')) return true;
			if (filename.includes('bm-market-homepage')) return true;
			if (filename.includes('sip18-forum')) return true;

			// disable for everything else (node_modules etc)
			return false;
		}
		//runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: { adapter: adapter() }
};

export default config;
