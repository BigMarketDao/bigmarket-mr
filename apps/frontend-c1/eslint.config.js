import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	},
	{
		// These components link to routes not yet registered in the SvelteKit router
		// (e.g. /dao/proposals/..., /dispute/...) so resolve() cannot be used.
		// They use base-prefixed strings instead.
		files: [
			'**/lib/components/template/Footer.svelte',
			'**/lib/components/dao/disputes/Dispute.svelte',
			'**/lib/components/dao/disputes/DisputeGridItem.svelte',
			'**/lib/components/dao/proposals/dao-voting/VotingResults.svelte',
			'**/lib/components/dao/proposals/dao-voting/DaoConcluded.svelte',
			'**/lib/components/dao/proposals/dao-voting/ballot-box/DaoVotingActiveNew.svelte',
			'**/lib/components/dao/proposals/ProposalGridItem.svelte',
			'**/lib/components/dao/construction/ConstructDao.svelte'
		],
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
