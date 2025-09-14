#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DEPENDENCY_MAP = {
  'xlsx': { package: 'xlsx', version: '^0.18.5' },
  'date-fns': { package: 'date-fns', version: '^3.6.0' },
  'axios': { package: 'axios', version: '^1.6.7' },
  'lodash': { package: 'lodash', version: '^4.17.21' },
  'chart.js': { package: 'chart.js', version: '^4.4.1' },
  'react-hook-form': { package: 'react-hook-form', version: '^7.61.1' },
  'yup': { package: 'yup', version: '^1.4.0' },
  'framer-motion': { package: 'framer-motion', version: '^11.0.0' },
  'moment': { package: 'moment', version: '^2.29.4' },
  'marked': { package: 'marked', version: '^9.1.6' },
  'uuid': { package: 'uuid', version: '^9.0.1' },
  'clsx': { package: 'clsx', version: '^2.1.1' },
  'classnames': { package: 'classnames', version: '^2.5.1' },
  'react-router-dom': { package: 'react-router-dom', version: '^6.23.1' },
  '@tanstack/react-query': { package: '@tanstack/react-query', version: '^5.50.1' },
  'swr': { package: 'swr', version: '^2.2.0' },
  'formik': { package: 'formik', version: '^2.4.5' },
  'd3': { package: 'd3', version: '^7.9.0' },
  'recharts': { package: 'recharts', version: '^2.15.4' },
  'three': { package: 'three', version: '^0.163.0' },
  'react-table': { package: 'react-table', version: '^7.8.0' },
  'react-helmet': { package: 'react-helmet', version: '^6.1.0' },
  'react-bootstrap': { package: 'react-bootstrap', version: '^2.10.2' },
  'bootstrap': { package: 'bootstrap', version: '^5.3.3' },
  'antd': { package: 'antd', version: '^5.16.2' },
  '@chakra-ui/react': { package: '@chakra-ui/react', version: '^2.8.2' },
  'styled-components': { package: 'styled-components', version: '^6.1.8' },
  'tailwindcss': { package: 'tailwindcss', version: '^3.4.17', dev: true },
  'postcss': { package: 'postcss', version: '^8.5.6', dev: true },
  'autoprefixer': { package: 'autoprefixer', version: '^10.4.21', dev: true },
  'socket.io-client': { package: 'socket.io-client', version: '^4.7.5' },
  'graphql': { package: 'graphql', version: '^16.8.1' },
  '@apollo/client': { package: '@apollo/client', version: '^3.11.10' },
  'firebase': { package: 'firebase', version: '^10.12.3' },
  '@supabase/supabase-js': { package: '@supabase/supabase-js', version: '^2.45.0' },
  'msw': { package: 'msw', version: '^2.5.2', dev: true },
  'zod': { package: 'zod', version: '^3.25.76' },
  'jotai': { package: 'jotai', version: '^2.8.5' },
  'zustand': { package: 'zustand', version: '^4.5.2' },
  'immer': { package: 'immer', version: '^10.0.2' },
  'redux': { package: 'redux', version: '^4.2.1' },
  '@reduxjs/toolkit': { package: '@reduxjs/toolkit', version: '^2.2.6' },
  'react-redux': { package: 'react-redux', version: '^9.1.2' },
  'redux-thunk': { package: 'redux-thunk', version: '^2.5.2' },
  'redux-saga': { package: 'redux-saga', version: '^1.3.3' },
  'mobx': { package: 'mobx', version: '^6.12.1' },
  'mobx-react-lite': { package: 'mobx-react-lite', version: '^3.4.3' },
  'xml2js': { package: 'xml2js', version: '^0.6.2' },
  'csv-parse': { package: 'csv-parse', version: '^5.5.2' },
  'papaparse': { package: 'papaparse', version: '^5.4.1' },
  // Commonly used in usecase components
  'mammoth': { package: 'mammoth', version: '^1.10.0' },
  'lucide-react': { package: 'lucide-react', version: '^0.462.0' },
  'file-saver': { package: 'file-saver', version: '^2.0.5' },
  'js-cookie': { package: 'js-cookie', version: '^3.0.5' },
  'dayjs': { package: 'dayjs', version: '^1.11.10' },
  'luxon': { package: 'luxon', version: '^3.4.4' },
  'jquery': { package: 'jquery', version: '^3.7.1' },
  'primereact': { package: 'primereact', version: '^10.6.3' },
  'handlebars': { package: 'handlebars', version: '^4.7.8' },
  'nunjucks': { package: 'nunjucks', version: '^3.2.7' },
  'ejs': { package: 'ejs', version: '^3.1.10' },
  'pug': { package: 'pug', version: '^3.0.2' },
  'next': { package: 'next', version: '^14.2.4' },
  'next-auth': { package: 'next-auth', version: '^4.24.5' },
  'apollo-server': { package: 'apollo-server', version: '^3.13.0' },
  'express': { package: 'express', version: '^4.19.2' },
  'cors': { package: 'cors', version: '^2.8.5' },
  'dotenv': { package: 'dotenv', version: '^16.4.5' },
  'winston': { package: 'winston', version: '^3.11.0', dev: true },
  'pino': { package: 'pino', version: '^9.1.0', dev: true },
  'multer': { package: 'multer', version: '^1.4.5-lts.1' },
  'sharp': { package: 'sharp', version: '^0.33.2' },
  'bcryptjs': { package: 'bcryptjs', version: '^2.4.3' },
  'jsonwebtoken': { package: 'jsonwebtoken', version: '^9.0.2' },
  'jose': { package: 'jose', version: '^5.2.4' },
  'supertest': { package: 'supertest', version: '^6.3.4', dev: true },
  'jest': { package: 'jest', version: '^29.7.0', dev: true },
  'ts-jest': { package: 'ts-jest', version: '^29.1.1', dev: true },
  'vitest': { package: 'vitest', version: '^3.2.4', dev: true },
  'mocha': { package: 'mocha', version: '^10.4.0', dev: true },
  'chai': { package: 'chai', version: '^4.4.1', dev: true },
  'sinon': { package: 'sinon', version: '^17.0.1', dev: true },
  'playwright': { package: 'playwright', version: '^1.44.1', dev: true },
  'puppeteer': { package: 'puppeteer', version: '^22.7.1', dev: true },
  'eslint': { package: 'eslint', version: '^9.32.0', dev: true },
  'prettier': { package: 'prettier', version: '^3.3.3', dev: true },
  'typescript': { package: 'typescript', version: '^5.8.3', dev: true },
  'ts-node': { package: 'ts-node', version: '^10.9.2', dev: true },
  'nodemon': { package: 'nodemon', version: '^3.1.5', dev: true },
  'concurrently': { package: 'concurrently', version: '^8.2.2', dev: true },
  'cross-env': { package: 'cross-env', version: '^7.0.3', dev: true },
  'rimraf': { package: 'rimraf', version: '^5.0.5', dev: true },
  'glob': { package: 'glob', version: '^10.3.10', dev: true },
  'fs-extra': { package: 'fs-extra', version: '^11.2.0' },
  'ajv': { package: 'ajv', version: '^8.17.1' },
  'node-fetch': { package: 'node-fetch', version: '^3.3.2' },
  'graphql-tag': { package: 'graphql-tag', version: '^2.12.6' },
  'react-native': { package: 'react-native', version: '^0.74.4' },
  'expo': { package: 'expo', version: '^51.0.0' },
  '@react-native-async-storage/async-storage': { package: '@react-native-async-storage/async-storage', version: '^1.23.1' },
  '@react-navigation/native': { package: '@react-navigation/native', version: '^6.1.9' },
  'react-native-reanimated': { package: 'react-native-reanimated', version: '^3.10.1' },
  '@testing-library/react': { package: '@testing-library/react', version: '^16.3.0', dev: true },
  '@testing-library/jest-dom': { package: '@testing-library/jest-dom', version: '^6.6.4', dev: true },
  '@testing-library/user-event': { package: '@testing-library/user-event', version: '^14.6.1', dev: true },
  'bcrypt': { package: 'bcrypt', version: '^5.1.1' },
  'mysql2': { package: 'mysql2', version: '^3.10.1' },
  'pg': { package: 'pg', version: '^8.11.3' },
  'mongoose': { package: 'mongoose', version: '^8.5.1' },
  'sequelize': { package: 'sequelize', version: '^6.37.1' },
  'drizzle-orm': { package: 'drizzle-orm', version: '^0.32.2' },
  'typeorm': { package: 'typeorm', version: '^0.3.20' },
  'knex': { package: 'knex', version: '^2.5.1' },
  'mongodb': { package: 'mongodb', version: '^6.8.0' },
  'helmet': { package: 'helmet', version: '^7.1.0' },
  'cookie-parser': { package: 'cookie-parser', version: '^1.4.7' },
  'express-validator': { package: 'express-validator', version: '^7.2.0' },
  'validator': { package: 'validator', version: '^13.11.0' },
  'joi': { package: 'joi', version: '^17.12.0' },
  'class-validator': { package: 'class-validator', version: '^0.14.0' },
  'crypto-js': { package: 'crypto-js', version: '^4.2.0' },
  'nanoid': { package: 'nanoid', version: '^5.0.6' },
  '@mui/material': { package: '@mui/material', version: '^5.15.14' },
  '@mui/icons-material': { package: '@mui/icons-material', version: '^5.15.14' },
  '@emotion/react': { package: '@emotion/react', version: '^11.11.4' },
  '@emotion/styled': { package: '@emotion/styled', version: '^11.11.5' },
  'react-icons': { package: 'react-icons', version: '^5.2.1' },
  'react-slick': { package: 'react-slick', version: '^0.30.1' },
  'slick-carousel': { package: 'slick-carousel', version: '^1.8.1' },
  'leaflet': { package: 'leaflet', version: '^1.9.4' },
  'react-leaflet': { package: 'react-leaflet', version: '^4.2.1' },
  'victory': { package: 'victory', version: '^36.9.1' },
  '@visx/visx': { package: '@visx/visx', version: '^3.3.0' },
  'chartist': { package: 'chartist', version: '^1.3.0' },
  'plotly.js-dist': { package: 'plotly.js-dist', version: '^2.29.1' },
  'echarts': { package: 'echarts', version: '^5.5.0' },
  'highcharts': { package: 'highcharts', version: '^11.4.3' }
};

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'coverage']);

function loadOverrides() {
  const overridePath = process.env.DETECT_DEPS_OVERRIDE || 'dependency-overrides.json';
  if (fs.existsSync(overridePath)) {
    try {
      return JSON.parse(fs.readFileSync(overridePath, 'utf8'));
    } catch (err) {
      console.warn('Failed to parse overrides:', err.message);
    }
  }
  return {};
}

function getRegistryVersion(spec) {
  if (process.env.DETECT_DEPS_REGISTRY_MOCK) {
    try {
      const mock = JSON.parse(process.env.DETECT_DEPS_REGISTRY_MOCK);
      if (mock[spec]) return mock[spec];
    } catch {
      /* ignore */
    }
  }
  try {
    const res = execSync(`curl -s https://registry.npmjs.org/${spec}`, { encoding: 'utf8' });
    const data = JSON.parse(res);
    return data['dist-tags'] && data['dist-tags'].latest ? data['dist-tags'].latest : null;
  } catch {
    return null;
  }
}

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(res));
    } else if (/\.(js|ts|jsx|tsx)$/.test(entry.name)) {
      files.push(res);
    }
  }
  return files;
}

function normalizeSpecifier(spec) {
  if (!spec || spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('..')) return null;
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0];
}

function extractDeps(content) {
  const specs = new Set();
  const regexes = [
    /import\s+[^'";]+?from\s+['"]([^'";]+)['"]/g,
    /require\(\s*['"]([^'";]+)['"]\s*\)/g,
    /export\s+[^'";]+?from\s+['"]([^'";]+)['"]/g,
    /import\(\s*['"]([^'";]+)['"]\s*\)/g
  ];
  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(content))) {
      const norm = normalizeSpecifier(match[1]);
      if (norm) specs.add(norm);
    }
  }
  return specs;
}

function mergeDependencies(specs) {
  const pkgPath = path.resolve('package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('No package.json found, skipping');
    return { added: [], unknown: [] };
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};
  const overrides = loadOverrides();
  const added = [];
  const installPkgs = [];
  const unknown = [];
  for (const spec of specs) {
    let info = overrides[spec] || DEPENDENCY_MAP[spec];
    if (!info) {
      const version = getRegistryVersion(spec);
      if (version && process.env.DETECT_DEPS_ALLOW_UNSAFE === '1') {
        info = { package: spec, version: `^${version}` };
      } else {
        unknown.push(spec);
        continue;
      }
    }
    if (info.ignore) continue;
    const target = info.dev ? 'devDependencies' : 'dependencies';
    if (!pkg[target][info.package]) {
      pkg[target][info.package] = info.version;
      added.push(`${info.package}@${info.version}`);
      installPkgs.push(`${info.package}@${info.version}`);
    }
  }
  if (added.length) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('Added dependencies:', added.join(', '));
    if (process.env.DETECT_DEPS_INSTALL !== '0') {
      try {
        execSync(`npm install ${installPkgs.join(' ')}`, { stdio: 'inherit' });
      } catch (err) {
        console.error('npm install failed:', err.message);
      }
    }
  }
  if (unknown.length) {
    console.warn('Unknown dependencies:', unknown.join(', '));
  }
  return { added, unknown };
}

function main() {
  const target = process.argv[2] || 'src';
  const start = Date.now();
  const files = collectFiles(target);
  const specs = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const dep of extractDeps(content)) {
      specs.add(dep);
    }
  }
  const { added, unknown } = mergeDependencies(specs);
  const duration = Date.now() - start;
  const metrics = {
    filesScanned: files.length,
    dependenciesDetected: specs.size,
    dependenciesAdded: added.length,
    unknownDependencies: unknown.length,
    durationMs: duration
  };
  console.log(
    `Dependency detection scanned ${metrics.filesScanned} files, ` +
      `${metrics.dependenciesDetected} deps, added ${metrics.dependenciesAdded}, ` +
      `${metrics.unknownDependencies} unknown in ${metrics.durationMs}ms`
  );
  if (process.env.DETECT_DEPS_METRICS) {
    try {
      fs.writeFileSync(
        process.env.DETECT_DEPS_METRICS,
        JSON.stringify(metrics, null, 2) + '\n'
      );
    } catch (err) {
      console.warn('Failed to write metrics:', err.message);
    }
  }
}

main();
