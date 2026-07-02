# Project Health Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Turn project health findings into actionable local Markdown maintenance tools.

**Architecture:** Keep data analysis in focused source modules, HTML rendering in `src/project-sidebar.mjs`, and side effects in `src/app.js`. The first implementation prioritizes safe operations: issue navigation, image asset inventory, and converting absolute image paths to relative paths when native file paths are available.

**Tech Stack:** Electron, browser ESM, plain JavaScript, existing source-level Node tests.

---

### Task 1: Asset Inventory Data And Rendering

**Files:**
- Modify: `src/project-health.mjs`
- Modify: `src/project-sidebar.mjs`
- Test: `test/project-health.test.mjs`
- Test: `test/project-sidebar.test.mjs`

- [x] **Step 1: Write failing tests**

Add assertions that `buildImageAssetInventory(entries, assets)` returns each image asset with `referenceCount`, `references`, and `unused`; add sidebar assertions for `data-asset-file-id`.

- [x] **Step 2: Run focused tests**

Run: `node test/project-health.test.mjs && node test/project-sidebar.test.mjs`

Expected: fail because `buildImageAssetInventory` and `buildProjectAssetsHtml` do not exist.

- [x] **Step 3: Implement data and HTML**

Add `buildImageAssetInventory` beside `buildProjectHealth`, and render compact asset cards in `buildProjectAssetsHtml`.

- [x] **Step 4: Verify focused tests pass**

Run: `node test/project-health.test.mjs && node test/project-sidebar.test.mjs`

Expected: pass.

### Task 2: Health Navigation And Absolute Image Fix

**Files:**
- Create: `src/project-fixes.mjs`
- Modify: `src/app.js`
- Modify: `src/project-sidebar.mjs`
- Modify: `index.html`
- Test: `test/project-fixes.test.mjs`
- Test: `test/app-source.test.mjs`

- [x] **Step 1: Write failing tests**

Add tests for replacing exact Markdown image hrefs, for `projectAssets` DOM hooks, for `fixAbsoluteImagePaths`, and for `data-health-file-id` buttons.

- [x] **Step 2: Run focused tests**

Run: `node test/project-fixes.test.mjs && node test/app-source.test.mjs`

Expected: fail because the module and UI hooks do not exist.

- [x] **Step 3: Implement navigation and repair**

Create `replaceMarkdownImageHref`; bind health and asset buttons to open the related file; add `fixAbsoluteImagePaths` that saves changed native files through `markdownNative.saveFile` and updates in-memory project entries.

- [x] **Step 4: Verify focused tests pass**

Run: `node test/project-fixes.test.mjs && node test/app-source.test.mjs`

Expected: pass.

### Task 3: Website And Documentation

**Files:**
- Modify: `README.md`
- Modify: `website/index.html`
- Modify: `website/styles.css`
- Test: `test/website-source.test.mjs`

- [x] **Step 1: Write failing tests**

Assert the website mentions project repair, asset references, and absolute path conversion.

- [x] **Step 2: Update copy and styles**

Add a workflow section that explains scan -> locate -> repair -> export.

- [x] **Step 3: Verify full suite**

Run: `pnpm test && pnpm run check && git diff --check`

Expected: all commands pass.
