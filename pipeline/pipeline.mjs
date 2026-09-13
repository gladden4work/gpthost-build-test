import { mkdir, readFile, writeFile, readdir, lstat, cp, rm, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

function sourceEntries(files) {
  if (!files || Array.isArray(files) || typeof files !== 'object' || Object.keys(files).length === 0) throw new Error('BUILD_SOURCE_REQUIRED');
  const entries = Object.entries(files);
  const names = new Set(entries.map(([name]) => name));
  for (const [name, content] of entries) {
    const parts = name.split('/');
    if (typeof content !== 'string' || !name || name.includes('\\') || name.includes('\0') || parts.some(part => !part || part === '.' || part === '..' || part === '.git')) throw new Error('BUILD_SOURCE_PATH_INVALID');
    if (parts.slice(0, -1).some((_, i) => names.has(parts.slice(0, i + 1).join('/')))) throw new Error('BUILD_SOURCE_PATH_COLLISION');
  }
  return entries;
}

export async function materializeSource(files, directory) {
  const entries = sourceEntries(files);
  await mkdir(directory, { recursive: false });
  for (const [name, content] of entries) {
    const destination = path.join(directory, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, { flag: 'wx' });
  }
}

async function regularFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await regularFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error('BUILD_FILE_TYPE_UNSUPPORTED');
  }
  return files;
}

export async function buildProject(directory, framework) {
  const cwd = await realpath(directory);
  const initialFiles = await regularFiles(cwd);
  await rm(path.join(cwd, 'dist'), { recursive: true, force: true });
  if (initialFiles.includes('package.json')) {
    const pkg = JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8'));
    if (typeof pkg.scripts?.build !== 'string' || !pkg.scripts.build.trim()) throw new Error('BUILD_SCRIPT_REQUIRED');
    const options = { cwd, stdio: 'inherit', timeout: 600_000 };
    execFileSync('npm', [initialFiles.includes('package-lock.json') ? 'ci' : 'install', '--no-audit', '--no-fund'], options);
    execFileSync('npm', ['run', 'build'], options);
  } else {
    if (framework !== 'html' || !initialFiles.includes('index.html')) throw new Error('PREPARED_PROJECT_REQUIRED');
    await mkdir(path.join(cwd, 'dist'));
    for (const file of initialFiles) {
      // Dotfiles are build inputs, never static public artifacts.
      if (file.split('/').some(part => part.startsWith('.'))) continue;
      const target = path.join(cwd, 'dist', file);
      await mkdir(path.dirname(target), { recursive: true });
      await cp(path.join(cwd, file), target);
    }
  }
  const output = path.join(cwd, 'dist');
  if (!(await lstat(output)).isDirectory()) throw new Error('BUILD_OUTPUT_REQUIRED');
  const files = await regularFiles(output);
  if (!files.includes('index.html') || !(await readFile(path.join(output, 'index.html'))).length) throw new Error('BUILD_INDEX_REQUIRED');
  return output;
}

export function validateCallbackUrl(value, origin) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password || url.search || url.hash ||
      !/^\/api\/v2\/(github|v1e)\/build-callback\/dispatch\/[^/]+$/.test(url.pathname)) throw new Error('BUILD_CALLBACK_URL_INVALID');
  return url.toString();
}

export async function deliverBuild(input, fetchImpl = fetch) {
  const callback = validateCallbackUrl(input.callbackUrl, input.callbackOrigin);
  if (!input.token) throw new Error('CALLBACK_AUTH_NOT_CONFIGURED');
  const success = input.status === 'success';
  const headers = { Authorization: `Bearer ${input.token}`, 'Content-Type': success ? 'application/tar+gzip' : 'application/json',
    'X-Project-ID': input.projectId, 'X-GitHub-Run-ID': input.runId, 'X-GitHub-Run-URL': input.runUrl ?? '', 'X-Correlation-ID': input.correlationId ?? '' };
  const body = success ? await readFile(input.archive) : JSON.stringify({ project_id: input.projectId, github_run_id: input.runId, status: 'failure', error: 'Project build failed' });
  const response = await fetchImpl(success ? `${callback}/upload` : callback, { method: 'POST', headers, body, redirect: 'error', signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`BUILD_DELIVERY_REJECTED_HTTP_${response.status}`);
  const result = await response.json();
  if (result.success !== true || !result.data || result.data.ignored || result.data.project_id !== input.projectId ||
      (success && typeof result.data.r2_path !== 'string')) throw new Error('BUILD_DELIVERY_NOT_ACCEPTED');
  return result.data;
}

async function main(command) {
  const env = process.env;
  if (command === 'prepare') {
    validateCallbackUrl(env.CALLBACK_URL, env.CALLBACK_ORIGIN);
    let files;
    if (env.SOURCE_FILES_URL) {
      const source = new URL(env.SOURCE_FILES_URL);
      if (source.origin !== env.CALLBACK_ORIGIN || source.username || source.password || source.search || source.hash ||
          source.pathname !== `/api/v2/github/source-files/${encodeURIComponent(env.PROJECT_ID)}/${encodeURIComponent(env.CORRELATION_ID)}`) throw new Error('BUILD_SOURCE_URL_INVALID');
      if (!env.CALLBACK_TOKEN) throw new Error('CALLBACK_AUTH_NOT_CONFIGURED');
      const response = await fetch(source, { headers: { Authorization: `Bearer ${env.CALLBACK_TOKEN}` }, redirect: 'error', signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`BUILD_SOURCE_HTTP_${response.status}`);
      files = await response.json();
    } else files = JSON.parse(env.SOURCE_FILES);
    sourceEntries(files);
    await writeFile(env.SOURCE_JSON, JSON.stringify(files));
  } else if (command === 'build') {
    const files = JSON.parse(await readFile(env.SOURCE_JSON, 'utf8'));
    await materializeSource(files, env.PROJECT_DIRECTORY);
    const output = await buildProject(env.PROJECT_DIRECTORY, env.FRAMEWORK);
    if (!/^[a-zA-Z0-9_-]+$/.test(env.PROJECT_ID)) throw new Error('BUILD_PROJECT_ID_INVALID');
    const artifactDirectory = path.join(env.ARTIFACT_DIRECTORY, env.PROJECT_ID);
    await cp(output, artifactDirectory, { recursive: true });
    execFileSync('tar', ['--format=ustar', '-czf', env.BUILD_ARCHIVE, '-C', env.ARTIFACT_DIRECTORY, env.PROJECT_ID], { stdio: 'inherit', timeout: 60_000 });
  } else if (command === 'deliver') {
    const result = await deliverBuild({ callbackUrl: env.CALLBACK_URL, callbackOrigin: env.CALLBACK_ORIGIN, token: env.CALLBACK_TOKEN,
      projectId: env.PROJECT_ID, runId: env.RUN_ID, runUrl: env.RUN_URL, correlationId: env.CORRELATION_ID, status: env.BUILD_RESULT, archive: env.BUILD_ARCHIVE });
    console.log(JSON.stringify({ project_id: env.PROJECT_ID, run_id: env.RUN_ID, delivery: 'accepted', ...(result.r2_path ? { r2_path: result.r2_path } : {}) }));
  } else throw new Error('UNKNOWN_PIPELINE_COMMAND');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
}
