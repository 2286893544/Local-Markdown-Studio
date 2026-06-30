const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const distDir = path.join(__dirname, '..', 'dist');
const appName = 'Local Markdown Studio.app';
const volumeName = 'Local Markdown Studio';
const dmgName = 'Local Markdown Studio-macOS.dmg';
const dmgPath = path.join(distDir, dmgName);
const stagingDir = path.join(distDir, '.mac-dmg-staging');

if (process.platform !== 'darwin') {
  throw new Error('dmg:mac can only run on macOS.');
}

const appPath = findPackagedApp();
const stagedAppPath = path.join(stagingDir, appName);

fs.rmSync(dmgPath, { force: true });
fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });
verifyElectronFramework(appPath);
run('ditto', [appPath, stagedAppPath]);
verifyElectronFramework(stagedAppPath);
fs.symlinkSync('/Applications', path.join(stagingDir, 'Applications'));

const result = run('hdiutil', [
  'create',
  '-volname', volumeName,
  '-srcfolder', stagingDir,
  '-ov',
  '-format', 'UDZO',
  dmgPath,
], { exitOnFailure: false });

fs.rmSync(stagingDir, { recursive: true, force: true });

if (result.status !== 0) {
  process.exit(result.status || 1);
}

fs.rmSync(path.dirname(appPath), { recursive: true, force: true });
console.log(`Wrote macOS DMG: ${dmgPath}`);
console.log(`Removed macOS package directory: ${path.dirname(appPath)}`);

function findPackagedApp() {
  const preferredPath = path.join(distDir, `Local Markdown Studio-darwin-${process.arch}`, appName);
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

function verifyElectronFramework(appBundlePath) {
  const frameworkLink = path.join(
    appBundlePath,
    'Contents',
    'Frameworks',
    'Electron Framework.framework',
    'Electron Framework',
  );

  if (!fs.existsSync(frameworkLink)) {
    throw new Error(`Electron Framework is missing from app bundle: ${frameworkLink}`);
  }

  const linkStats = fs.lstatSync(frameworkLink);
  if (!linkStats.isSymbolicLink()) return;

  const linkTarget = fs.readlinkSync(frameworkLink);
  if (path.isAbsolute(linkTarget)) {
    throw new Error(`Electron Framework symlink must be relative, got: ${linkTarget}`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0 && options.exitOnFailure !== false) {
    process.exit(result.status || 1);
  }
  return result;
}
