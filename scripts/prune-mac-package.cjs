const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, '..', 'dist');
const appName = 'Local Markdown Studio.app';
const packageDir = path.join(distDir, `Local Markdown Studio-darwin-${process.arch}`);
const packagedAppPath = path.join(packageDir, appName);
const finalAppPath = path.join(distDir, appName);
const keptLocaleDirectories = new Set(['en.lproj', 'zh_CN.lproj']);

if (!fs.existsSync(packagedAppPath)) {
  throw new Error(`macOS app not found: ${packagedAppPath}`);
}

for (const localeDir of findLocaleDirectories(packagedAppPath)) {
  const name = path.basename(localeDir);
  if (!keptLocaleDirectories.has(name)) {
    fs.rmSync(localeDir, { recursive: true, force: true });
  }
}

removePackageSiblings(packageDir, appName);
moveAppToDistRoot(packagedAppPath, finalAppPath);
fs.rmSync(path.join(distDir, '.DS_Store'), { force: true });

console.log(`Pruned macOS package locales. Kept: ${[...keptLocaleDirectories].join(', ')}`);
console.log(`Removed macOS package metadata outside app bundle.`);
console.log(`Prepared macOS app: ${finalAppPath}`);

function moveAppToDistRoot(sourcePath, targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.renameSync(sourcePath, targetPath);
  fs.rmSync(packageDir, { recursive: true, force: true });
}

function removePackageSiblings(rootPath, keptEntryName) {
  for (const entry of fs.readdirSync(rootPath)) {
    if (entry === keptEntryName) continue;
    fs.rmSync(path.join(rootPath, entry), { recursive: true, force: true });
  }
}

function findLocaleDirectories(rootPath) {
  const result = [];
  const stack = [rootPath];

  while (stack.length) {
    const currentPath = stack.pop();
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const absolutePath = path.join(currentPath, entry.name);
      if (!entry.isDirectory()) continue;

      if (entry.name.endsWith('.lproj')) {
        result.push(absolutePath);
        continue;
      }

      stack.push(absolutePath);
    }
  }

  return result;
}
