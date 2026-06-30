import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const main = await readFile(new URL('../electron/main.cjs', import.meta.url), 'utf8');
const preload = await readFile(new URL('../electron/preload.cjs', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const manifest = await readFile(new URL('../package.json', import.meta.url), 'utf8');

assert.match(main, /new BrowserWindow/);
assert.match(main, /\{\s*app,\s*BrowserWindow,\s*dialog,\s*ipcMain,\s*Menu\s*\}/);
assert.match(main, /Menu\.setApplicationMenu\(null\)/);
assert.match(main, /titleBarStyle:\s*isWindows\s*\?\s*'hidden'\s*:\s*'default'/);
assert.match(main, /titleBarOverlay:\s*isWindows\s*\?\s*getTitleBarOverlay\('light'\)\s*:\s*false/);
assert.match(main, /ipcMain\.handle\('native:set-theme'/);
assert.match(main, /setTitleBarOverlay/);
assert.match(main, /setBackgroundColor/);
assert.doesNotMatch(main, /label:\s*'文件'/);
assert.doesNotMatch(main, /label:\s*'编辑'/);
assert.doesNotMatch(main, /label:\s*'视图'/);
assert.doesNotMatch(main, /label:\s*'窗口'/);
assert.doesNotMatch(main, /label:\s*'帮助'/);
assert.doesNotMatch(main, /label:\s*'使用说明'/);
assert.match(main, /preload:\s*path\.join\(__dirname,\s*'preload\.cjs'\)/);
assert.match(main, /ipcMain\.handle\('native:open-file'/);
assert.match(main, /ipcMain\.handle\('native:open-project'/);
assert.match(main, /ipcMain\.handle\('native:rescan-project'/);
assert.match(main, /scanMarkdownProject/);
assert.match(main, /ignoredDirectoryNames/);
assert.match(main, /defaultMarkdownExtensions = \['\.md'\]/);
assert.match(main, /defaultIgnoredDirectoryNames = \['node_modules'\]/);
assert.match(main, /ignoreDotDirectories/);
assert.match(main, /ignoredDirectoryPatterns/);

assert.match(preload, /contextBridge\.exposeInMainWorld\('markdownNative'/);
assert.match(preload, /openFile/);
assert.match(preload, /openProject/);
assert.match(preload, /rescanProject/);
assert.match(preload, /setTheme/);

assert.match(app, /window\.markdownNative/);
assert.match(app, /openNativeFile/);
assert.match(app, /openNativeProject/);
assert.match(app, /rescanNativeProject/);
assert.match(app, /syncNativeTheme/);
assert.match(app, /markdownNative\?\.setTheme\?\.\(state\.theme\)/);
assert.match(app, /entry\.content/);

const packageJson = JSON.parse(manifest);
assert.equal(packageJson.main, 'electron/main.cjs');
assert.equal(packageJson.scripts.app, 'electron .');
assert.match(packageJson.scripts['package:mac'], /--platform=darwin/);
assert.match(packageJson.scripts['package:mac'], /scripts\/prune-mac-package\.cjs/);
assert.match(packageJson.scripts['package:win'], /--platform=win32/);
assert.match(packageJson.scripts['package:win'], /--arch=x64/);
assert.match(packageJson.scripts['package:win'], /scripts\/prune-win-package\.cjs/);
assert.match(packageJson.scripts['zip:mac'], /Local Markdown Studio-macOS\.zip/);
assert.match(packageJson.scripts['zip:win'], /Local Markdown Studio-win32-x64\.zip/);
assert.ok(packageJson.devDependencies.electron);

console.log('electron source tests passed');
