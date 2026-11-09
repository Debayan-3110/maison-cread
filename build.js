#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function resolveFrontendDir() {
  const candidates = [
    path.resolve(process.cwd(), 'frontend'),
    path.resolve(process.cwd(), '..', 'frontend'),
    path.resolve(__dirname, 'frontend'),
    path.resolve(__dirname, '..', 'frontend')
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  return null;
}

const frontendDir = resolveFrontendDir();

if (!frontendDir) {
  console.log('[build.js] No frontend package.json found. Skipping frontend build.');
  process.exit(0);
}

console.log(`[build.js] Building frontend from directory: ${frontendDir}`);

try {
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  console.log('[build.js] Frontend build completed successfully.');
} catch (err) {
  console.error('[build.js] Error during frontend build:', err.message);
  process.exit(1);
}

