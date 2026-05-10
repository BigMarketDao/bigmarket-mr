import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stacksConnectSsrStubPath = path.resolve(
	__dirname,
	'src/lib/server/stacks-connect-ssr-stub.ts'
);

/** @see apps/frontend-c1/src/lib/server/stacks-connect-ssr-stub.ts */
function stacksConnectSsrStub(): Plugin {
	return {
		name: 'stacks-connect-ssr-stub',
		enforce: 'pre',
		resolveId(id, _importer, opts) {
			if (id !== '@stacks/connect') return undefined;

			const envName = this.environment?.name;
			const consumer = (this.environment as { config?: { consumer?: string } })?.config?.consumer;

			const stubHere = envName === 'ssr' || consumer === 'server' || opts?.ssr === true;

			// Browser / client builds must stay on real Stacks Connect (+ Reown/AppKit).
			if (!stubHere || envName === 'client' || opts?.ssr === false) {
				return undefined;
			}

			return stacksConnectSsrStubPath;
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), stacksConnectSsrStub(), sveltekit()],
	// SSR @stacks/connect stubbing: stacksConnectSsrStub() (Vite's EnvironmentResolveOptions typing
	// does not include `alias`, so per-environment aliases are not used here.)
	// Workspace TS packages: bundle for SSR so Node does not resolve bare/extensionless paths in source.
	server: {
		watch: {
			usePolling: true,
			interval: 100
		}
	},
	ssr: {
		noExternal: [
			'bits-ui',
			'@bigmarket/bm-config',
			'@bigmarket/bm-design',
			'@bigmarket/sdk',
			'@bigmarket/bm-utilities',
			// Bundled into SSR chunks — adapter-node output must not bare-import this at runtime (deploy often has no node_modules beside server/).
			'prismjs'
		]
	},
	optimizeDeps: {
		exclude: ['@bigmarket/bm-ui']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
