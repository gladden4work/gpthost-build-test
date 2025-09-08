/**
 * ensure-relative-base.mjs
 *
 * Purpose: Force Vite configs (vite.config.{ts,js,mjs,cjs}) to use base: './'
 * so built assets resolve correctly when served from a subpath like /sites/{id}/.
 *
 * Behavior:
 * - If a base property exists, it is replaced with './'.
 * - Otherwise, if defineConfig({ ... }) is found, inserts base: './' as the
 *   first property inside that object literal.
 * - Idempotent: running multiple times keeps base: './'.
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const CANDIDATES = [
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.cjs',
];

async function patchFile(path) {
  let content = await fs.readFile(path, 'utf8');

  // Normalize line endings to simplify regex ops
  const original = content;

  // 1) Replace existing base: '...'
  content = content.replace(/base\s*:\s*(["'])[^"']*\1/g, "base: './'");

  // 2) If no base present after replacement, insert into defineConfig({...})
  if (!/base\s*:/.test(content)) {
    // Try to find defineConfig({ ... }) and insert base right after the first '{'
    content = content.replace(
      /(defineConfig\s*\(\s*\{)(\s*)/,
      (_m, p1, p2) => `${p1}\n  base: './',${p2}`
    );
  }

  if (content !== original) {
    await fs.writeFile(path, content);
    console.log(`Patched: ${path}`);
    return true;
  } else {
    console.log(`No change: ${path}`);
    return false;
  }
}

async function main() {
  let patchedAny = false;
  for (const file of CANDIDATES) {
    try {
      await fs.access(file);
    } catch {
      continue;
    }
    const changed = await patchFile(file);
    patchedAny = patchedAny || changed;
  }
  if (!patchedAny) {
    console.log('No Vite config found to patch. Skipping.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

