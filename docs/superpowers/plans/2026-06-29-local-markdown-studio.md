# Local Markdown Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Markdown reading and editing app that opens directly from `index.html`.

**Architecture:** Keep Markdown logic pure and testable in `src/markdown.mjs`, with browser interaction isolated in `src/app.js`. The UI is a static app shell styled through `styles.css`, so it works without dependency installation or a dev server.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node built-in test assertions.

---

### Task 1: Markdown Core

**Files:**
- Create: `test/markdown.test.mjs`
- Create: `src/markdown.mjs`
- Create: `test/project.test.mjs`
- Create: `src/project.mjs`

- [ ] **Step 1: Write failing tests**

Cover headings, inline formatting, task lists, tables, heading extraction, search highlighting, stats, and export HTML.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node test/markdown.test.mjs`

Expected: failure because `src/markdown.mjs` does not exist yet.

- [ ] **Step 3: Implement Markdown core**

Create pure exported functions:

- `renderMarkdown(markdown)`
- `extractHeadings(markdown)`
- `highlightSearch(html, query)`
- `getDocumentStats(markdown)`
- `buildExportHtml(title, renderedHtml)`

Create project helper functions:

- `isMarkdownProjectFile(path)`
- `normalizeProjectFiles(files)`
- `collectMarkdownEntriesFromDirectoryHandle(directoryHandle)`

- [ ] **Step 4: Run tests to verify they pass**

Run: `node test/markdown.test.mjs`

Expected: all tests pass.

### Task 2: Static App Shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/app.js`

- [ ] **Step 1: Build semantic app shell**

Add toolbar, left project/outline panel, editor panel, preview panel, status bar, hidden file input, hidden project directory input, and drag overlay.

- [ ] **Step 2: Wire app interactions**

Initialize sample content, render preview, update project file list, update outline, handle file input, handle project folder input, handle drag/drop, switch Markdown files inside an opened project, search, mode switching, theme, local draft save, draft clear, and HTML export.

- [ ] **Step 3: Style responsive UI**

Use CSS variables, light/dark themes, stable pane dimensions, accessible buttons, clear focus states, and mobile layout rules.

### Task 3: Verification

**Files:**
- Existing: `test/markdown.test.mjs`
- Existing: `index.html`

- [ ] **Step 1: Run Markdown unit tests**

Run: `node test/markdown.test.mjs`

Expected: all tests pass.

Run: `node test/project.test.mjs`

Expected: all tests pass.

- [ ] **Step 2: Run local static server**

Run: `python3 -m http.server 4173`

Expected: app is available at `http://127.0.0.1:4173/index.html`.

- [ ] **Step 3: Browser smoke check**

Open the page and verify the app renders with editor, preview, outline, toolbar controls, and sample Markdown output.

### Notes

No git commit step is included because `/Users/xujiahang/Documents/Typora` is not a Git repository.
