const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const defaultMarkdownExtensions = ['.md'];
const defaultIgnoredDirectoryNames = ['node_modules'];

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    title: 'Local Markdown Studio',
    backgroundColor: '#f4f1eb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
  configureApplicationMenu();
  registerNativeHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function configureApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '关闭窗口', role: 'close', accelerator: 'CmdOrCtrl+W' },
        { type: 'separator' },
        { label: '退出', role: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo', accelerator: 'CmdOrCtrl+Z' },
        { label: '重做', role: 'redo', accelerator: 'Shift+CmdOrCtrl+Z' },
        { type: 'separator' },
        { label: '剪切', role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { label: '复制', role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { label: '粘贴', role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { label: '全选', role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { label: '实际大小', role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { label: '放大', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { label: '缩小', role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize', accelerator: 'CmdOrCtrl+M' },
        { label: '关闭', role: 'close' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerNativeHandlers() {
  ipcMain.handle('native:open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '打开 Markdown 文件',
      properties: ['openFile'],
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePaths[0]) return null;

    const filePath = result.filePaths[0];
    return {
      name: path.basename(filePath),
      path: filePath,
      content: await fs.readFile(filePath, 'utf8'),
    };
  });

  ipcMain.handle('native:open-project', async (_event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '打开 Markdown 项目',
      properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;

    return scanMarkdownProject(result.filePaths[0], options);
  });

  ipcMain.handle('native:rescan-project', async (_event, directoryPath, options = {}) => {
    if (!directoryPath) return null;
    return scanMarkdownProject(directoryPath, options);
  });
}

async function scanMarkdownProject(directoryPath, options = {}) {
  const rootName = path.basename(directoryPath);
  const entries = [];
  const counters = { visited: 0, markdown: 0 };
  await collectProjectEntries(directoryPath, directoryPath, entries, counters, options);
  entries.sort(compareProjectEntries);

  return {
    type: 'native-directory',
    name: rootName,
    path: directoryPath,
    visited: counters.visited,
    entries,
  };
}

async function collectProjectEntries(rootPath, currentPath, entries, counters, options) {
  const children = await fs.readdir(currentPath, { withFileTypes: true });

  for (const child of children) {
    if (child.isDirectory() && isIgnoredDirectoryName(child.name, options)) continue;

    const absolutePath = path.join(currentPath, child.name);
    const relativePath = normalizePath(path.relative(rootPath, absolutePath));
    counters.visited += 1;

    if (child.isDirectory()) {
      await collectProjectEntries(rootPath, absolutePath, entries, counters, options);
      continue;
    }

    if (!child.isFile() || !isMarkdownProjectFile(relativePath, options)) continue;

    counters.markdown += 1;
    entries.push({
      id: relativePath,
      name: child.name,
      path: relativePath,
      absolutePath,
      content: await fs.readFile(absolutePath, 'utf8'),
    });
  }
}

function isMarkdownProjectFile(filePath, options = {}) {
  const lowerPath = normalizePath(filePath).toLowerCase();
  return getMarkdownExtensions(options).some((extension) => lowerPath.endsWith(extension));
}

function isIgnoredDirectoryName(name, options = {}) {
  const directoryName = String(name).toLowerCase();
  if (getIgnoredDirectoryPatterns(options).some((pattern) => matchesDirectoryPattern(directoryName, pattern))) return true;
  if (getIgnoreDotDirectories(options) && directoryName.startsWith('.')) return true;
  return new Set(getIgnoredDirectoryNames(options)).has(directoryName);
}

function getMarkdownExtensions(options = {}) {
  const extensions = options.markdownExtensions ?? defaultMarkdownExtensions;
  return extensions.map((extension) => String(extension).toLowerCase());
}

function getIgnoredDirectoryNames(options = {}) {
  const ignoredDirectoryNames = options.ignoredDirectoryNames ?? defaultIgnoredDirectoryNames;
  return ignoredDirectoryNames.map((name) => String(name).toLowerCase());
}

function getIgnoredDirectoryPatterns(options = {}) {
  return (options.ignoredDirectoryPatterns ?? [])
    .map((pattern) => String(pattern).trim().toLowerCase())
    .filter(Boolean);
}

function matchesDirectoryPattern(directoryName, pattern) {
  if (pattern === '.*') return directoryName.startsWith('.');
  if (!pattern.includes('*')) return directoryName === pattern;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(directoryName);
}

function getIgnoreDotDirectories(options = {}) {
  return options.ignoreDotDirectories !== false;
}

function compareProjectEntries(left, right) {
  const leftScore = getPriorityScore(left.path);
  const rightScore = getPriorityScore(right.path);
  if (leftScore !== rightScore) return leftScore - rightScore;
  return left.path.localeCompare(right.path, 'zh-CN', { sensitivity: 'base' });
}

function getPriorityScore(filePath) {
  return /^readme(?:\.(md|markdown|txt))?$/i.test(filePath) ? 0 : 1;
}

function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
}
