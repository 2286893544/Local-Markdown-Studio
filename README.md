# Local Markdown Studio

Local Markdown Studio 是一个本地优先的 Markdown 桌面阅读与编辑工具，基于 Electron 构建。它支持打开单个 Markdown 文件，也可以打开项目文件夹并扫描其中的 Markdown 文档。

## 功能

- 分屏、编辑、预览三种视图模式
- Markdown 实时预览
- 项目文件夹扫描与 Markdown 文件列表
- 可配置扫描扩展名、忽略目录与通用忽略规则
- 文档目录自动提取，支持层级折叠
- 点击目录项平滑跳转到编辑区和预览区对应位置
- 分屏模式下编辑区与预览区双向滚动同步
- 搜索高亮并自动跳转到匹配位置
- 深色/浅色主题切换
- Markdown 下载与 HTML 导出
- Mermaid flowchart 简易渲染、缩放与查看
- macOS / Windows 桌面打包脚本

## 环境要求

- Node.js 22 或更高版本
- npm

## 安装

```bash
npm install
```

## 本地运行

```bash
npm run app
```

## 测试与检查

```bash
npm test
npm run check
```

## 打包

macOS:

```bash
npm run package:mac
```

Windows x64:

```bash
npm run package:win
```

如需生成压缩包，可手动运行：

```bash
npm run zip:mac
npm run zip:win
```

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
