import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const TARGET_EXTENSIONS = new Set(['.html', '.js', '.css']);

async function rewriteRootPaths(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteRootPaths(fullPath);
    } else if (TARGET_EXTENSIONS.has(extname(entry.name))) {
      let content = await fs.readFile(fullPath, 'utf8');
      content = content
        .replace(/href="\//g, 'href="./')
        .replace(/src="\//g, 'src="./')
        .replace(/url\(\//g, 'url(./');
      await fs.writeFile(fullPath, content);
    }
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node rewrite-root-paths.mjs <dir>');
    process.exit(1);
  }
  rewriteRootPaths(target);
}

export default rewriteRootPaths;
