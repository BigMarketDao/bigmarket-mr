# sv

## Board 1

Board for Market 2 community discussion

## About BigMarket Community Boards

If you're seeing this, you've probably already done this step. Congrats!

Write **messages** in markdown - eg use code blocks

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

and lists

- item 1
- item 2
- item 3

---

## Board 2

Board for Market 1 community discussion

## Creating a project

How to bet on a market

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Replies

### Reply 1

I like the way you are thinking

### Reply 2

Let's go

### Reply to Reply 2

Ok I'm ready

## Library Mode

```
npm install -D svelte-package
```

Update package.json:

```json
Copy
Edit
"svelte": "./src/lib/index.ts",
"exports": {
  ".": {
    "import": "./src/lib/index.ts"
  }
},
"scripts": {
  "build": "svelte-package"
}
```

Add a svelte.config.js

```json
import { vitePreprocess } from 'svelte/compiler';
import { sveltekit } from '@sveltejs/kit/vite';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: undefined // use static if needed later
  },
  package: {
    dir: 'package',
    emitTypes: true,
    files: ['src/lib'],
    exports: (filepath) => filepath.startsWith('src/lib')
  }
};

export default config;
```

```
npm run build
npm publish
```

See package/ folder with the library.
