const fs = require('node:fs');
const path = require('node:path');

const packageDir = path.join(__dirname, '..', 'dist', 'Local Markdown Studio-win32-x64');
const localesDir = path.join(packageDir, 'locales');
const keptLocales = new Set(['en-US.pak', 'zh-CN.pak']);

if (!fs.existsSync(packageDir)) {
  throw new Error(`Windows package not found: ${packageDir}`);
}

if (fs.existsSync(localesDir)) {
  for (const fileName of fs.readdirSync(localesDir)) {
    if (!keptLocales.has(fileName)) {
      fs.rmSync(path.join(localesDir, fileName), { force: true });
    }
  }
}

console.log(`Pruned Windows package locales. Kept: ${[...keptLocales].join(', ')}`);
