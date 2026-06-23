/**
 * Redirect `@noble/hashes/_assert` for both ESM and CJS before AllBridge loads.
 * Must run via `node --import ./noble-hashes-register.mjs` (dev + prod).
 */
import Module from 'node:module';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shimDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib/shims');
const shimCjsPath = path.join(shimDir, 'noble-hashes-assert-default.cjs');
const shimEsmPath = pathToFileURL(path.join(shimDir, 'noble-hashes-assert-default.mjs')).href;

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
	if (request === '@noble/hashes/_assert') {
		return shimCjsPath;
	}
	return originalResolveFilename.call(this, request, parent, isMain, options);
};

register(
	`data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@noble/hashes/_assert') {
    return { url: '${shimEsmPath}', shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
`)}`,
	import.meta.url
);
