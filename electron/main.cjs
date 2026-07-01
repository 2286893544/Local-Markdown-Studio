const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const defaultMarkdownExtensions = ['.md'];
const defaultIgnoredDirectoryNames = ['node_modules'];
const isWindows = process.platform === 'win32';
const titleBarThemes = {
  light: {
    color: '#fffdf8',
    symbolColor: '#25231f',
    backgroundColor: '#f4f1eb',
  },
  dark: {
    color: '#22211f',
    symbolColor: '#f0ebe2',
    backgroundColor: '#191817',
  },
};

let mainWindow;
let pendingMarkdownFilePath = '';

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    title: 'Local Markdown Studio',
    backgroundColor: '#f4f1eb',
    autoHideMenuBar: true,
    titleBarStyle: isWindows ? 'hidden' : 'default',
    titleBarOverlay: isWindows ? getTitleBarOverlay('light') : false,
    icon: path.join(__dirname, '..', 'assets', 'app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.webContents.on('found-in-page', (_event, result) => {
    mainWindow?.webContents.send('native:found-in-page', result);
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
  configureApplicationMenu();
  registerNativeHandlers();
  createWindow();
  openMarkdownFileFromPath(findMarkdownArgument(process.argv));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', (_event, commandLine) => {
  const filePath = findMarkdownArgument(commandLine);
  if (filePath) openMarkdownFileFromPath(filePath);
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openMarkdownFileFromPath(filePath);
});

function configureApplicationMenu() {
  Menu.setApplicationMenu(null);
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
    return readMarkdownFile(filePath);
  });

  ipcMain.handle('native:open-recent-file', async (_event, filePath) => {
    if (!filePath) return null;
    return readMarkdownFile(filePath);
  });

  ipcMain.handle('native:open-project', async (_event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '打开 Markdown 项目',
      properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;

    return scanMarkdownProject(result.filePaths[0], options);
  });

  ipcMain.handle('native:open-recent-project', async (_event, directoryPath, options = {}) => {
    if (!directoryPath) return null;
    return scanMarkdownProject(directoryPath, options);
  });

  ipcMain.handle('native:rescan-project', async (_event, directoryPath, options = {}) => {
    if (!directoryPath) return null;
    return scanMarkdownProject(directoryPath, options);
  });

  ipcMain.handle('native:consume-pending-file', consumePendingMarkdownFile);

  ipcMain.handle('native:save-file', async (_event, filePath, content = '') => {
    if (!filePath) return null;
    await fs.writeFile(filePath, content, 'utf8');
    return readMarkdownFile(filePath);
  });

  ipcMain.handle('native:save-file-as', async (_event, suggestedName = '未命名文档.md', content = '') => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '另存为 Markdown',
      defaultPath: suggestedName,
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePath) return null;

    const filePath = result.filePath;
    await fs.writeFile(filePath, content, 'utf8');
    return readMarkdownFile(filePath);
  });

  ipcMain.handle('native:save-image-asset', async (_event, payload = {}) => {
    const documentPath = String(payload.documentPath || '');
    if (!documentPath) return null;

    const assetDirectory = path.join(path.dirname(documentPath), 'assets');
    await fs.mkdir(assetDirectory, { recursive: true });

    const fileName = await getAvailableAssetFileName(assetDirectory, sanitizeAssetFileName(payload.fileName || 'image.png'));
    const filePath = path.join(assetDirectory, fileName);
    await fs.writeFile(filePath, Buffer.from(payload.buffer || []));
    return {
      fileName,
      path: filePath,
      relativePath: normalizePath(path.relative(path.dirname(documentPath), filePath)),
    };
  });

  ipcMain.handle('native:create-project-file', async (_event, directoryPath, relativePath, content = '', options = {}) => {
    const targetPath = resolveProjectPath(directoryPath, relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    try {
      await fs.writeFile(targetPath, content, { encoding: 'utf8', flag: 'wx' });
    } catch (error) {
      if (error?.code === 'EEXIST') throw new Error('同名文档已存在');
      throw error;
    }
    return scanMarkdownProject(directoryPath, options);
  });

  ipcMain.handle('native:create-project-folder', async (_event, directoryPath, relativePath, options = {}) => {
    const targetPath = resolveProjectPath(directoryPath, relativePath);
    try {
      await fs.mkdir(targetPath, { recursive: true });
    } catch (error) {
      if (error?.code === 'EEXIST') throw new Error('同名文件已存在，无法创建文件夹');
      throw error;
    }
    return scanMarkdownProject(directoryPath, options);
  });

  ipcMain.handle('native:set-theme', (_event, theme) => {
    applyWindowTheme(theme);
    return true;
  });

  ipcMain.handle('native:find-in-page', (event, query, options = {}) => {
    const term = String(query || '').trim();
    if (!term) {
      event.sender.stopFindInPage('clearSelection');
      return 0;
    }

    return event.sender.findInPage(term, {
      forward: options.forward !== false,
      findNext: Boolean(options.findNext),
      matchCase: false,
    });
  });

  ipcMain.handle('native:stop-find-in-page', (event) => {
    event.sender.stopFindInPage('clearSelection');
    return true;
  });
}

async function openMarkdownFileFromPath(filePath) {
  if (!filePath) return;
  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingMarkdownFilePath = filePath;
    ensureWindowForPendingFile();
    return;
  }
  if (mainWindow.webContents.isLoadingMainFrame()) {
    pendingMarkdownFilePath = filePath;
    return;
  }

  try {
    const file = await readMarkdownFile(filePath);
    mainWindow.webContents.send('native:file-opened', file);
  } catch (error) {
    console.error(`Failed to open Markdown file: ${filePath}`, error);
  }
}

async function readMarkdownFile(filePath) {
  return {
    name: path.basename(filePath),
    path: filePath,
    content: await fs.readFile(filePath, 'utf8'),
  };
}

async function consumePendingMarkdownFile() {
  const filePath = pendingMarkdownFilePath;
  pendingMarkdownFilePath = '';
  return filePath ? readMarkdownFile(filePath) : null;
}

function ensureWindowForPendingFile() {
  if (app.isReady()) createWindow();
}

function applyWindowTheme(theme) {
  if (!mainWindow) return;

  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  const colors = titleBarThemes[normalizedTheme];
  mainWindow.setBackgroundColor(colors.backgroundColor);
  if (isWindows) {
    mainWindow.setTitleBarOverlay(getTitleBarOverlay(normalizedTheme));
  }
}

function getTitleBarOverlay(theme) {
  const colors = titleBarThemes[theme === 'dark' ? 'dark' : 'light'];
  return {
    color: colors.color,
    symbolColor: colors.symbolColor,
    height: 70,
  };
}

async function getAvailableAssetFileName(assetDirectory, fileName) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension) || 'image';
  let candidate = `${baseName}${extension || '.png'}`;
  let index = 1;

  while (await pathExists(path.join(assetDirectory, candidate))) {
    candidate = `${baseName}-${index}${extension || '.png'}`;
    index += 1;
  }

  return candidate;
}

function sanitizeAssetFileName(fileName = 'image.png') {
  return String(fileName || 'image.png')
    .replace(/[\\/:\0]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+/, '') || 'image.png';
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function scanMarkdownProject(directoryPath, options = {}) {
  const rootName = path.basename(directoryPath);
  const entries = [];
  const assets = [];
  const counters = { visited: 0, markdown: 0 };
  await collectProjectEntries(directoryPath, directoryPath, entries, assets, counters, options);
  entries.sort(compareProjectEntries);
  assets.sort(compareProjectEntries);

  return {
    type: 'native-directory',
    name: rootName,
    path: directoryPath,
    visited: counters.visited,
    entries,
    assets,
  };
}

async function collectProjectEntries(rootPath, currentPath, entries, assets, counters, options) {
  const children = await fs.readdir(currentPath, { withFileTypes: true });

  for (const child of children) {
    if (child.isDirectory() && isIgnoredDirectoryName(child.name, options)) continue;

    const absolutePath = path.join(currentPath, child.name);
    const relativePath = normalizePath(path.relative(rootPath, absolutePath));
    counters.visited += 1;

    if (child.isDirectory()) {
      await collectProjectEntries(rootPath, absolutePath, entries, assets, counters, options);
      continue;
    }

    if (!child.isFile()) continue;

    if (isImageProjectAsset(relativePath)) {
      assets.push({
        id: relativePath,
        name: child.name,
        path: relativePath,
        absolutePath,
      });
    }

    if (!isMarkdownProjectFile(relativePath, options)) continue;

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

function resolveProjectPath(directoryPath, relativePath) {
  const rawRootPath = String(directoryPath || '');
  if (!rawRootPath) throw new Error('Invalid project path');
  const rootPath = path.resolve(rawRootPath);
  const normalizedRelativePath = normalizeCreatableProjectPath(relativePath);
  if (!rootPath || !normalizedRelativePath) {
    throw new Error('Invalid project path');
  }
  const targetPath = path.resolve(rootPath, normalizedRelativePath);
  if (targetPath !== rootPath && !targetPath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error('Project path escapes root');
  }
  return targetPath;
}

function normalizeCreatableProjectPath(relativePath = '') {
  const rawPath = String(relativePath || '').trim().replace(/\\/g, '/');
  if (rawPath.startsWith('/') || /^[a-z]:\//i.test(rawPath)) return '';
  const normalized = normalizePath(rawPath).replace(/\/+$/g, '');
  if (!normalized || normalized.split('/').some((part) => !part || part === '.' || part === '..')) return '';
  return normalized;
}

function isMarkdownProjectFile(filePath, options = {}) {
  const lowerPath = normalizePath(filePath).toLowerCase();
  return getMarkdownExtensions(options).some((extension) => lowerPath.endsWith(extension));
}

function isImageProjectAsset(filePath) {
  return /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i.test(normalizePath(filePath));
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

function findMarkdownArgument(args = []) {
  return args.find((arg) => {
    if (!arg || String(arg).startsWith('-')) return false;
    return /\.(md|markdown)$/i.test(String(arg));
  }) || '';
}
