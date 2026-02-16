#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Framework versions constants for easier maintenance
const FRAMEWORK_VERSIONS = {
  react: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    vite: '^5.0.0',
    '@vitejs/plugin-react': '^4.3.0'
  },
  vue: {
    vue: '^3.5.0',
    vite: '^5.0.0',
    '@vitejs/plugin-vue': '^5.1.0'
  },
  svelte: {
    svelte: '^4.2.0',  // Using stable Svelte 4 instead of Svelte 5
    vite: '^5.0.0',
    '@sveltejs/vite-plugin-svelte': '^3.0.0'  // Compatible with Svelte 4
  }
};

// Get framework from environment variable
const framework = process.env.FRAMEWORK || '';
const projectPath = process.cwd();

console.log(`Scaffolding for framework: ${framework || 'auto-detect'}`);
console.log(`Project path: ${projectPath}`);

// Helper function to write file if it doesn't exist
function writeFileIfNotExists(filePath, content) {
  const fullPath = path.join(projectPath, filePath);
  if (!fs.existsSync(fullPath)) {
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Created: ${filePath}`);
    return true;
  }
  console.log(`Already exists: ${filePath}`);
  return false;
}

// Helper to check if a file exists with any of the given extensions
function fileExistsWithExtensions(basePath, extensions) {
  for (const ext of extensions) {
    if (fs.existsSync(path.join(projectPath, `${basePath}${ext}`))) {
      return true;
    }
  }
  return false;
}

// Helper function to recursively read directory (compatible with older Node.js)
function readDirRecursive(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      readDirRecursive(filePath, fileList);
    } else {
      fileList.push(path.relative(dir, filePath));
    }
  }
  
  return fileList;
}

// Detect framework from existing files
function detectFramework() {
  console.log('Starting framework detection...');
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  // Check package.json for framework dependencies
  if (fs.existsSync(packageJsonPath)) {
    console.log('Checking package.json for framework dependencies...');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    if (allDeps.react || allDeps['react-dom']) {
      console.log('Detected React in package.json');
      return 'react';
    }
    if (allDeps.vue) {
      console.log('Detected Vue in package.json');
      return 'vue';
    }
    if (allDeps.svelte) {
      console.log('Detected Svelte in package.json');
      return 'svelte';
    }
  }
  
  // Check for framework-specific files
  console.log('Checking for framework-specific App files...');
  if (fileExistsWithExtensions('src/App', ['.jsx', '.tsx'])) {
    console.log('Found React App component');
    return 'react';
  }
  if (fileExistsWithExtensions('src/App', ['.vue'])) {
    console.log('Found Vue App component');
    return 'vue';
  }
  if (fileExistsWithExtensions('src/App', ['.svelte'])) {
    console.log('Found Svelte App component');
    return 'svelte';
  }
  
  // Check for any JSX/Vue/Svelte files
  const srcDir = path.join(projectPath, 'src');
  if (fs.existsSync(srcDir)) {
    console.log('Scanning src directory for framework files...');
    const files = readDirRecursive(srcDir);
    for (const file of files) {
      if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        console.log(`Found React file: ${file}`);
        return 'react';
      }
      if (file.endsWith('.vue')) {
        console.log(`Found Vue file: ${file}`);
        return 'vue';
      }
      if (file.endsWith('.svelte')) {
        console.log(`Found Svelte file: ${file}`);
        return 'svelte';
      }
    }
  }

  // If we have a plain index.html and no framework markers, treat it as static HTML.
  // This avoids forcing React scaffolding for v1e HTML rewrites.
  if (fs.existsSync(path.join(projectPath, 'index.html'))) {
    console.log('Found index.html without framework markers; treating as static HTML');
    return 'html';
  }

  console.log('No framework detected');
  return null;
}

// Determine which framework to use
let targetFramework = framework;
if (!targetFramework || targetFramework === 'auto') {
  targetFramework = detectFramework();
  if (!targetFramework) {
    console.log('No framework detected, defaulting to React');
    targetFramework = 'react';
  } else {
    console.log(`Auto-detected framework: ${targetFramework}`);
  }
}

// Scaffold based on framework
switch (targetFramework) {
  case 'react':
    scaffoldReact();
    break;
  case 'vue':
    scaffoldVue();
    break;
  case 'svelte':
    scaffoldSvelte();
    break;
  case 'html':
    scaffoldHtml();
    break;
  default:
    console.error(`Unknown framework: ${targetFramework}`);
    process.exit(1);
}

function scaffoldReact() {
  console.log('Scaffolding React application...');
  
  // Create package.json if it doesn't exist
  writeFileIfNotExists('package.json', JSON.stringify({
    "private": true,
    "scripts": {
      "build": "vite build",
      "dev": "vite",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": FRAMEWORK_VERSIONS.react.react,
      "react-dom": FRAMEWORK_VERSIONS.react['react-dom']
    },
    "devDependencies": {
      "vite": FRAMEWORK_VERSIONS.react.vite,
      "@vitejs/plugin-react": FRAMEWORK_VERSIONS.react['@vitejs/plugin-react']
    }
  }, null, 2));
  
  // Create ESM vite.config.mjs with base './' for subpath deployment
  writeFileIfNotExists('vite.config.mjs', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
`);
  
  // Create index.html
  writeFileIfNotExists('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`);
  
  // Create src/main.jsx
  const mainJsxExists = fileExistsWithExtensions('src/main', ['.jsx', '.js', '.tsx', '.ts']);
  if (!mainJsxExists) {
    writeFileIfNotExists('src/main.jsx', `import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
`);
  }
  
  // Create src/App.jsx if no App component exists
  const appExists = fileExistsWithExtensions('src/App', ['.jsx', '.js', '.tsx', '.ts']);
  if (!appExists) {
    writeFileIfNotExists('src/App.jsx', `export default function App() {
  return (
    <div>
      <h1>Hello from React</h1>
      <p>Your app is ready!</p>
    </div>
  )
}
`);
  }
}

function scaffoldVue() {
  console.log('Scaffolding Vue application...');
  
  // Create package.json if it doesn't exist
  writeFileIfNotExists('package.json', JSON.stringify({
    "private": true,
    "scripts": {
      "build": "vite build",
      "dev": "vite",
      "preview": "vite preview"
    },
    "dependencies": {
      "vue": FRAMEWORK_VERSIONS.vue.vue
    },
    "devDependencies": {
      "vite": FRAMEWORK_VERSIONS.vue.vite,
      "@vitejs/plugin-vue": FRAMEWORK_VERSIONS.vue['@vitejs/plugin-vue']
    }
  }, null, 2));
  
  // Create ESM vite.config.mjs with base './' for subpath deployment
  writeFileIfNotExists('vite.config.mjs', `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
`);
  
  // Create index.html
  writeFileIfNotExists('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`);
  
  // Create src/main.js
  const mainJsExists = fileExistsWithExtensions('src/main', ['.js', '.ts']);
  if (!mainJsExists) {
    writeFileIfNotExists('src/main.js', `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
`);
  }
  
  // Create src/App.vue if it doesn't exist
  if (!fs.existsSync(path.join(projectPath, 'src/App.vue'))) {
    writeFileIfNotExists('src/App.vue', `<template>
  <div>
    <h1>Hello from Vue</h1>
    <p>Your app is ready!</p>
  </div>
</template>

<script setup>
// Vue 3 Composition API with script setup
</script>

<style scoped>
h1 {
  color: #42b883;
}
</style>
`);
  }
}

function scaffoldSvelte() {
  console.log('Scaffolding Svelte application...');
  
  // Create package.json if it doesn't exist
  writeFileIfNotExists('package.json', JSON.stringify({
    "private": true,
    "type": "module",
    "scripts": {
      "build": "vite build",
      "dev": "vite",
      "preview": "vite preview"
    },
    "dependencies": {
      "svelte": FRAMEWORK_VERSIONS.svelte.svelte
    },
    "devDependencies": {
      "vite": FRAMEWORK_VERSIONS.svelte.vite,
      "@sveltejs/vite-plugin-svelte": FRAMEWORK_VERSIONS.svelte['@sveltejs/vite-plugin-svelte']
    }
  }, null, 2));
  
  // Create ESM vite.config.mjs with base './' for subpath deployment
  writeFileIfNotExists('vite.config.mjs', `import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
`);
  
  // Create index.html
  writeFileIfNotExists('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Svelte App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`);
  
  // Create src/main.js
  const mainJsExists = fileExistsWithExtensions('src/main', ['.js', '.ts']);
  if (!mainJsExists) {
    writeFileIfNotExists('src/main.js', `import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')
})

export default app
`);
  }
  
  // Create src/App.svelte if it doesn't exist
  if (!fs.existsSync(path.join(projectPath, 'src/App.svelte'))) {
    writeFileIfNotExists('src/App.svelte', `<script>
  // Svelte component logic here
</script>

<div>
  <h1>Hello from Svelte</h1>
  <p>Your app is ready!</p>
</div>

<style>
  h1 {
    color: #ff3e00;
  }
</style>
`);
  }
}

function scaffoldHtml() {
  console.log('Static HTML project detected. Skipping framework scaffolding.');

  // Keep behavior safe if index.html is unexpectedly missing.
  writeFileIfNotExists('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GPTHost Static Site</title>
</head>
<body>
  <main>GPTHost static HTML project</main>
</body>
</html>
`);
}

console.log('Scaffolding complete!');
