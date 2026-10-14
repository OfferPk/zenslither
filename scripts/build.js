/**
 * Build script for ZenSlither
 * Copies web assets from src/ to www/
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const wwwDir = path.join(__dirname, '../www');

if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

const files = [
  'index.html',
  'styles.css',
  'app.js',
  'audio.js',
  'slither-engine.js',
  'levels.js',
  'manifest.json',
  'sw.js',
  'icon.svg'
];

const rootDir = path.join(__dirname, '..');

for (const file of files) {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(wwwDir, file);
  const rootPath = path.join(rootDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    fs.copyFileSync(srcPath, rootPath);
    console.log(`Copied ${file} -> www/ & root`);
  } else {
    console.warn(`Warning: ${file} not found in src/`);
  }
}

console.log('Build completed successfully!');
