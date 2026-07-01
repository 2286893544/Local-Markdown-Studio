const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const distDir = path.join(__dirname, '..', 'dist');
const packageName = 'Local Markdown Studio-win32-x64';
const packagePath = path.join(distDir, packageName);
const zipName = 'Local Markdown Studio-win32-x64.zip';
const zipPath = path.join(distDir, zipName);

if (!fs.existsSync(packagePath)) {
  throw new Error(`Windows package not found: ${packagePath}. Run pnpm run package:win first.`);
}

fs.rmSync(zipPath, { force: true });

const result = spawnSync('zip', ['-qr', zipName, packageName], {
  cwd: distDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

fs.rmSync(packagePath, { recursive: true, force: true });
console.log(`Wrote Windows zip: ${zipPath}`);
console.log(`Removed Windows package directory: ${packagePath}`);
