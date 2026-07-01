# Local Markdown Studio

Local Markdown Studio 是一个本地优先的 Markdown 桌面阅读与编辑工具，基于 Electron 构建。它支持打开单个 Markdown 文件，也可以打开项目文件夹并扫描其中的 Markdown 文档。

## 功能

- 分屏、编辑、预览三种视图模式
- Markdown 实时预览
- 项目文件夹扫描与 Markdown 文件列表
- 可配置扫描扩展名、忽略目录与通用忽略规则
- 最近打开文件 / 最近打开项目入口
- 当前文件保存、另存为和未保存变更提醒
- 粘贴或拖入图片时，原生桌面模式可自动复制到当前文档旁的 `assets/` 目录并插入相对路径
- 项目文档快速打开，支持按文件名或路径筛选
- 项目内全文搜索，支持从结果打开文档并跳到匹配项
- 当前文档反向链接和失效链接检查
- 文档目录自动提取，支持层级折叠
- 点击目录项平滑跳转到编辑区和预览区对应位置
- 滚动预览时自动高亮当前目录位置
- 分屏模式下编辑区与预览区双向滚动同步
- 搜索高亮并自动跳转到匹配位置
- Markdown 常用片段快捷插入，包括标题、加粗、链接、图片、代码块、表格和任务项
- 专注模式
- 深色/浅色主题切换
- Markdown 保存与 HTML 导出
- 项目内相对 Markdown 链接跳转
- Mermaid flowchart 简易渲染、缩放与查看
- 支持注册为系统 Markdown 打开程序，双击 `.md` / `.markdown` 可直接打开
- macOS / Windows 桌面打包脚本

## 环境要求

- Node.js 22 或更高版本
- pnpm 11.7.0

## 安装

```bash
pnpm install
```

## 本地运行

```bash
pnpm run app
```

## 测试与检查

```bash
pnpm test
pnpm run check
```

## 打包

macOS:

```bash
pnpm run package:mac
```

Windows x64:

```bash
pnpm run package:win
```

如需生成压缩包，可手动运行：

```bash
pnpm run zip:mac
pnpm run zip:win
```

macOS 推荐生成 DMG 分发包：

```bash
pnpm run dmg:mac
```

DMG 会包含 `Local Markdown Studio.app` 和 `Applications` 快捷入口，用户打开 DMG 后把 app 拖到 Applications 即可。

## 注册为系统默认打开程序

### Windows

先打包 Windows 版本：

```bash
pnpm run package:win
```

打包完成后，进入生成目录并双击运行：

```text
dist\Local Markdown Studio-win32-x64\register-md-association.cmd
```

这个脚本会把 `.md` 和 `.markdown` 注册到当前 Windows 用户的文件关联中，不需要管理员权限。注册后双击 Markdown 文件会使用 `Local Markdown Studio.exe` 打开。

如果 Windows 仍然使用旧应用打开 Markdown 文件，请在任意 `.md` 文件上右键，选择“打开方式” -> “选择其他应用” -> “Local Markdown Studio”，并勾选“始终使用此应用打开 .md 文件”。

### macOS

`.zip` 解压后双击 `.app` 会直接运行，macOS 不会自动询问是否添加到“应用程序”。需要安装引导时请使用 DMG：

```bash
pnpm run dmg:mac
```

生成后打开：

```text
dist/Local Markdown Studio-macOS.dmg
```

把 `Local Markdown Studio.app` 拖到 `Applications`。安装后在 `.md` 文件上右键选择“打开方式”即可看到 Local Markdown Studio。需要设为默认时，在文件“显示简介”里修改“打开方式”，然后选择“全部更改”。之后双击 `.md` / `.markdown` 文件会用 Local Markdown Studio 打开。

## 目录结构

```text
.
├── electron/              # Electron 主进程与 preload
├── src/                   # 前端应用逻辑、Markdown 渲染、项目扫描辅助逻辑
├── styles.css             # 应用样式
├── index.html             # 应用入口页面
├── scripts/               # 打包后裁剪脚本
├── test/                  # 源码级测试
├── docs/                  # 设计与实现计划文档
├── package.json
└── README.md
```

## Git 忽略规则

仓库不会上传以下本地生成内容：

- `node_modules/`
- `dist/`
- `*.log`
- `.DS_Store`

这些内容已写入 `.gitignore`。打包产物需要在本地通过打包命令重新生成。

## 说明

当前应用专注于本地 Markdown 阅读、编辑和导出。默认项目扫描只读取 `.md` 文件，可在应用内通过“扫描设置”增加 `.markdown`、`.txt` 或其他扩展名。
