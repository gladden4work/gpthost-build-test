#!/usr/bin/env node
// Thin wrapper to support workflows expecting scaffold.js
// Delegates to scaffold.cjs (CommonJS) implementation from an ES module context
// Repo uses "type": "module" so require() is unavailable here.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  await import(join(__dirname, 'scaffold.cjs'));
} catch (err) {
  console.error('Failed to load scaffold.cjs from .github/scripts:', err);
  process.exit(1);
}
