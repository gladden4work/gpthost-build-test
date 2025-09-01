#!/usr/bin/env node

const https = require('https');
const http = require('http');
const url = require('url');

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};

for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const value = args[i + 1];
    argMap[key] = value;
  }
}

// Get required parameters
const projectId = argMap.project || process.env.PROJECT_ID;
const status = argMap.status || process.env.BUILD_STATUS || 'unknown';
const runId = argMap['run-id'] || process.env.GITHUB_RUN_ID;
const runUrl = argMap['run-url'] || process.env.GITHUB_RUN_URL;
const callbackUrl = process.env.CALLBACK_URL;
const callbackToken = process.env.CALLBACK_TOKEN;
const errorMessage = argMap.error || process.env.ERROR_MESSAGE || '';
const r2BuildPath = process.env.BUILD_PATH || '';
const r2BucketName = process.env.R2_BUCKET_NAME || '';
const buildTimestamp = process.env.BUILD_TIMESTAMP || new Date().toISOString();

if (!callbackUrl) {
  console.error('ERROR: CALLBACK_URL not provided');
  process.exit(1);
}

if (!callbackToken) {
  console.error('ERROR: CALLBACK_TOKEN not provided');
  process.exit(1);
}

if (!projectId) {
  console.error('ERROR: project_id not provided');
  process.exit(1);
}

// Parse the callback URL
const parsedUrl = url.parse(callbackUrl);
const isHttps = parsedUrl.protocol === 'https:';
const httpModule = isHttps ? https : http;

// Build the callback payload
const payload = {
  project_id: projectId,
  status: status === 'success' ? 'completed' : status,
  build_timestamp: buildTimestamp,
  workflow_run_id: runId,
  github_run_id: runId,
  github_run_url: runUrl
};

// Add error message if present
if (errorMessage) {
  payload.error_message = errorMessage;
}

// Add R2 storage information if available
if (r2BuildPath) {
  payload.r2_build_path = r2BuildPath;
  payload.r2_storage = {
    build_path: r2BuildPath,
    bucket_name: r2BucketName,
    build_timestamp: buildTimestamp
  };
  
  // Add public URL if available
  const publicUrlBase = process.env.PUBLIC_URL_BASE;
  if (publicUrlBase) {
    payload.r2_storage.public_url_base = publicUrlBase;
  }
}

const payloadStr = JSON.stringify(payload);

// Prepare request options
const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || (isHttps ? 443 : 80),
  path: parsedUrl.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payloadStr),
    'Authorization': `Bearer ${callbackToken}`
  }
};

console.log(`Sending callback to: ${callbackUrl}`);
console.log(`Status: ${status}`);
console.log(`Project ID: ${projectId}`);

// Make the request
const req = httpModule.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`Callback sent successfully (${res.statusCode})`);
      if (responseData) {
        console.log('Response:', responseData);
      }
    } else {
      console.error(`Callback failed with status ${res.statusCode}`);
      if (responseData) {
        console.error('Response:', responseData);
      }
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error sending callback:', error.message);
  process.exit(1);
});

// Send the request
req.write(payloadStr);
req.end();