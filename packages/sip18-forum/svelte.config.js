// packages/sip18-forum/svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { join } from 'path';

const config = {
  preprocess: vitePreprocess(),

  kit: {
    // Required so svelte-package finds your lib code
    files: {
      lib: join(process.cwd(), 'src/lib'),
    },
  },

  compilerOptions: {
    css: 'injected',
  },
};

export default config;
