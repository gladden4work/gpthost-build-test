#!/usr/bin/env node

/**
 * Ensure Vite configs use relative base paths for subpath deployment
 * This prevents blank pages when deployed under /sites/{project_id}/
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Enforcing relative base path for Vite...');

// Find vite config files
const configPatterns = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.mts'];
let configFile = null;

for (const pattern of configPatterns) {
  if (fs.existsSync(pattern)) {
    configFile = pattern;
    break;
  }
}

if (!configFile) {
  console.log('⚠️ No vite config found, creating vite.config.js with base: "./"');
  
  // Create a minimal vite config with relative base
  const newConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});
`;
  
  fs.writeFileSync('vite.config.js', newConfig);
  console.log('✅ Created vite.config.js with relative base');
} else {
  console.log(`📝 Found ${configFile}, checking base configuration...`);
  
  let content = fs.readFileSync(configFile, 'utf-8');
  const originalContent = content;
  
  // Check if base is already set
  const basePattern = /base\s*:\s*['"`]([^'"`]+)['"`]/;
  const match = content.match(basePattern);
  
  if (match) {
    const currentBase = match[1];
    if (currentBase === '/' || currentBase.startsWith('/')) {
      console.log(`⚠️ Found absolute base: "${currentBase}", updating to relative...`);
      content = content.replace(basePattern, "base: './'");
      fs.writeFileSync(configFile, content);
      console.log('✅ Updated base to "./"');
    } else {
      console.log(`✅ Base is already relative: "${currentBase}"`);
    }
  } else {
    // No base found, need to add it
    console.log('⚠️ No base configuration found, adding base: "./"');
    
    // Try to add base to defineConfig
    const defineConfigPattern = /defineConfig\s*\(\s*\{/;
    if (defineConfigPattern.test(content)) {
      content = content.replace(defineConfigPattern, "defineConfig({\n  base: './',");
      fs.writeFileSync(configFile, content);
      console.log('✅ Added base: "./" to config');
    } else {
      console.log('⚠️ Could not automatically add base, please configure manually');
    }
  }
}

// Also check and fix index.html if it exists
if (fs.existsSync('index.html')) {
  console.log('📝 Checking index.html for absolute paths...');
  let html = fs.readFileSync('index.html', 'utf-8');
  const originalHtml = html;
  
  // Fix script src paths
  html = html.replace(/src="\/(?!\/)/g, 'src="./');
  // Fix link href paths  
  html = html.replace(/href="\/(?!\/)/g, 'href="./');
  
  if (html !== originalHtml) {
    fs.writeFileSync('index.html', html);
    console.log('✅ Fixed absolute paths in index.html');
  } else {
    console.log('✅ index.html paths are already relative');
  }
}

console.log('✨ Base path enforcement complete');