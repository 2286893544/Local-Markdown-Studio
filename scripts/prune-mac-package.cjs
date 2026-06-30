const fs = require('node:fs');
const path = require('node:path');

const appPath = path.join(__dirname, '..', 'dist', 'Local Markdown Studio.app');
const keptLocaleDirectories = new Set(['en.lproj', 'zh_CN.lproj']);

if (!fs.existsSync(appPath)) {
  throw new Error(`macOS app not found: ${appPath}`);
}

for (const localeDir of findLocaleDirectories(appPath)) {
  const name = path.basename(localeDir);
  if (!keptLocaleDirectories.has(name)) {
    fs.rmSync(localeDir, { recursive: true, force: true });
  }
}

console.log(`Pruned macOS package locales. Kept: ${[...keptLocaleDirectories].join(', ')}`);

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
