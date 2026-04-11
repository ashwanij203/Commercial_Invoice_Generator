/**
 * Build script: builds the React frontend and copies it into desktop/renderer/
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..', 'frontend');
const rendererDir = path.join(__dirname, 'renderer');

console.log('🔨 Building React frontend...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

// Clean renderer directory
if (fs.existsSync(rendererDir)) {
  fs.rmSync(rendererDir, { recursive: true });
}

// Copy dist to renderer
const distDir = path.join(frontendDir, 'dist');
fs.cpSync(distDir, rendererDir, { recursive: true });

console.log('✅ Frontend built and copied to desktop/renderer/');
