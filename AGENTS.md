# AGENTS.md

本文档用于约束后续 Agent 在本仓库中的协作方式、开发边界和验证要求。

## 项目概览

Local Markdown Studio 是一个基于 Electron 的本地 Markdown 桌面阅读与编辑工具，支持 Markdown 编辑、实时预览、项目扫描、目录跳转、HTML 导出和桌面端打包。

主要入口文件：

- `electron/main.cjs`：Electron 主进程，负责原生文件选择、文件关联入口、窗口生命周期、原生项目扫描。
- `electron/preload.cjs`：安全 IPC 桥，向前端暴露 `window.markdownNative`。
- `src/app.js`：前端应用状态、编辑器、预览、目录、搜索、滚动同步、项目 UI、原生文件加载。
- `src/markdown.mjs`：Markdown 渲染、标题提取、搜索高亮、文档统计、HTML 导出、简易 flowchart 渲染。
- `src/project.mjs`：浏览器侧项目文件归一化和目录扫描辅助逻辑。
- `styles.css`：应用样式。
- `scripts/`：打包、裁剪、压缩、DMG 生成脚本。
- `test/`：源码级回归测试。

## 常用命令

所有命令默认在仓库根目录执行：

```bash
npm install
npm run app
npm test
npm run check
npm run package:mac
npm run package:win
npm run dmg:mac
npm run zip:mac
npm run zip:win
```

代码改动完成前至少执行：

```bash
npm test
npm run check
```

如果改动涉及打包、安装、文件关联或发布产物，还需要执行对应平台的打包命令。例如：

```bash
npm run dmg:mac
npm run zip:win
```

## 仓库规则

- 不要提交 `node_modules/`、`dist/`、`*.log`、`.DS_Store`。
- 发布产物只保留在本地 `dist/` 下，`dist/` 已被 Git 忽略。
- 继续使用当前的纯 JavaScript / ESM 风格。除非用户明确要求，不要引入 TypeScript、构建器或前端框架。
- 改动保持聚焦，不要在修复单一问题时顺手重构无关的 Markdown 解析、Electron 生命周期或样式。
- 搜索优先使用 `rg`。
- 手动改文件使用 `apply_patch`。
- 如果工作区里有无关改动，必须保留，不要擅自回滚或覆盖。
- 所有 Git commit 信息必须使用中文，包括提交标题和提交正文。不要使用英文 commit message。

## 测试约定

当前测试是轻量源码级检查：

- `test/markdown.test.mjs`：Markdown 渲染、flowchart、HTML 导出、标题、搜索、统计。
- `test/project.test.mjs`：项目文件归一化和扫描规则。
- `test/app-source.test.mjs`：前端源码约束和 UI 行为钩子。
- `test/electron-source.test.mjs`：Electron 主进程、preload、打包脚本和平台能力约束。

新增行为时，优先补充或更新最贴近的测试。这些测试会检查源码字符串，用于锁住 IPC 名称、打包脚本、平台钩子等集成行为。

## Electron 文件打开流程

应用支持系统文件关联后，通过双击 `.md` / `.markdown` 文件打开文档。

关键流程：

1. `electron/main.cjs` 从 macOS `open-file`、Windows 命令行参数或 `second-instance` 事件接收文件路径。
2. 如果当前没有窗口，`ensureWindowForPendingFile()` 会创建窗口，并把路径暂存在 `pendingMarkdownFilePath`。
3. `electron/preload.cjs` 暴露 `consumePendingFile()`。
4. `src/app.js` 在绑定监听后调用 `consumePendingNativeFile()`，再通过 `loadNativeMarkdownFile(file)` 加载文件。

不要把这套流程改回“启动时直接发一次事件”。前端监听可能尚未注册，事件会丢失，导致页面继续显示上一次本地草稿。

macOS 窗口行为：

- 点击红色关闭按钮后，进程可以继续保留，这是 macOS 常见行为。
- 窗口 `closed` 时必须设置 `mainWindow = null`。
- 后续再次双击 Markdown 文件时，必须重新创建窗口并打开新文件。

## 打包规则

macOS：

- `npm run package:mac` 生成未压缩应用：
  `dist/Local Markdown Studio.app`
- `electron/mac-info.plist` 声明 `.md` / `.markdown` 文档类型。
- `npm run dmg:mac` 是推荐的 macOS 分发命令。它会生成：
  `dist/Local Markdown Studio-macOS.dmg`
- DMG 内包含 `Local Markdown Studio.app` 和 `Applications` 快捷入口，用户打开后把 app 拖入 Applications。
- `npm run dmg:mac` 执行完后会删除未压缩的 `dist/Local Markdown Studio.app`。
- `npm run zip:mac` 会生成：
  `dist/Local Markdown Studio-macOS.zip`
  并删除未压缩的 `dist/Local Markdown Studio.app`。
- zip 不会触发 macOS 安装引导；如果需要引导用户安装到“应用程序”，使用 DMG。

Windows：

- `npm run package:win` 生成未压缩应用：
  `dist/Local Markdown Studio-win32-x64`
- `scripts/prune-win-package.cjs` 会向打包目录写入 `register-md-association.cmd`。
- 注册脚本会在当前 Windows 用户下通过 `HKCU\Software\Classes` 注册 `.md` 和 `.markdown` 文件关联。
- `npm run zip:win` 会生成：
  `dist/Local Markdown Studio-win32-x64.zip`
  并删除未压缩的 Windows 打包目录。

## 需要保持的 UI 行为

- 原生应用菜单隐藏。
- Windows 标题栏颜色跟随主题变化。
- 搜索会高亮匹配项，并滚动到第一个匹配位置。
- 分屏模式下编辑区和预览区双向滚动同步。
- 目录支持层级折叠。
- 点击目录项时，编辑区和预览区都要平滑滚动到对应位置。
- 目录展开/收起只能重绘目录，不要重渲染预览区。
- 未打开项目时，项目面板应隐藏。

## Markdown 能力边界

当前 Markdown 渲染器保持轻量、本地化：

- Markdown 图片语法会渲染为图片。
- 不支持通用原始 HTML passthrough。
- 当前没有启用视频/音频播放器支持。
- flowchart 是内置的简易 Mermaid 风格渲染，只覆盖简单流程图。

不要在没有测试的情况下扩大 Markdown 语义。涉及 Markdown 行为时，需要补充 `test/markdown.test.mjs`。

## CodeGraph

<!-- CODEGRAPH_START -->
如果未来仓库根目录存在 `.codegraph/`，在定位代码前优先使用 CodeGraph，而不是直接 grep/find 或大范围读文件：

- MCP 工具可用时，优先使用 `codegraph_explore` 和 `codegraph_node`。
- Shell 兜底命令：`codegraph explore "<问题或符号>"`、`codegraph node <符号或文件>`。

如果没有 `.codegraph/`，跳过 CodeGraph，正常使用仓库搜索。
<!-- CODEGRAPH_END -->
