/**
 * Copies only public frontend files into dist/ for static hosting (DigitalOcean, etc.).
 * Run after scripts/inject-api-url.js so api-base-url.js is included.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

const files = [
  'index.html',
  'dashboard.html',
  'styles.css',
  'script.js',
  'dashboard.css',
  'dashboard.js',
  'firebase-config.js',
  'razorpay-config.js',
  'youtube-config.js',
  'api-base-url.js'
];

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(dist);
fs.mkdirSync(dist, { recursive: true });

for (const f of files) {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) {
    console.error('Missing file:', f);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(dist, f));
}

copyDir(path.join(root, 'assets'), path.join(dist, 'assets'));
console.log('Static site copied to dist/');
