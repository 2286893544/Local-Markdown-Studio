const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const distDir = path.join(__dirname, '..', 'dist');
const appName = 'Local Markdown Studio.app';
const zipName = 'Local Markdown Studio-macOS.zip';
const zipPath = path.join(distDir, zipName);

const appPath = findPackagedApp();

fs.rmSync(zipPath, { force: true });

const appParentDir = path.dirname(appPath);
const result = spawnSync('zip', ['-qry', zipName, appName], {
  cwd: appParentDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

const generatedZipPath = path.join(appParentDir, zipName);
if (generatedZipPath !== zipPath) {
  fs.renameSync(generatedZipPath, zipPath);
}
fs.rmSync(appPath, { recursive: true, force: true });
console.log(`Wrote macOS zip: ${zipPath}`);
console.log(`Removed macOS app bundle: ${appPath}`);

function findPackagedApp() {
  const preferredPath = path.join(distDir, appName);
  if (fs.existsSync(preferredPath)) return preferredPath;

  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir}. Run npm run package:mac first.`);
  }

  const candidates = fs.readdirSync(distDir)
    .filter((entryName) => /^Local Markdown Studio-darwin-/.test(entryName))
    .map((entryName) => path.join(distDir, entryName, appName))
    .filter((candidatePath) => fs.existsSync(candidatePath));

  if (candidates.length) return candidates[0];

  throw new Error(`macOS app not found in ${distDir}. Run npm run package:mac first.`);
}
