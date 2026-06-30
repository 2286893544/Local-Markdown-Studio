# AGENTS.md

This file gives coding agents the local rules for working in this repository.

## Project Overview

Local Markdown Studio is an Electron desktop app for local-first Markdown reading, editing, previewing, and exporting.

Main entry points:

- `electron/main.cjs`: Electron main process, native file dialogs, file association entry handling, window lifecycle, project scanning on native builds.
- `electron/preload.cjs`: Safe IPC bridge exposed as `window.markdownNative`.
- `src/app.js`: Browser-side application state, editor/preview rendering, outline, search, scroll sync, project UI, native file loading.
- `src/markdown.mjs`: Markdown parser/renderer, headings, search highlight, document stats, HTML export, simple flowchart rendering.
- `src/project.mjs`: Browser-side project file normalization and directory scanning helpers.
- `styles.css`: Full app styling.
- `scripts/`: Packaging, pruning, archive, and DMG helper scripts.
- `test/`: Source-level regression tests.

## Commands

Use these commands from the repository root:

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

Validation before finishing a code change:

```bash
npm test
npm run check
```

For packaging changes, also run the relevant packaging command. For example:

```bash
npm run dmg:mac
npm run zip:win
```

## Repository Rules

- Do not commit `node_modules/`, `dist/`, `*.log`, or `.DS_Store`.
- Keep release artifacts local under `dist/`; they are ignored by Git.
- Use the existing plain JavaScript / ESM style. Do not introduce TypeScript, bundlers, or framework dependencies unless explicitly requested.
- Keep changes scoped. Do not refactor unrelated Markdown parsing, Electron lifecycle, or styling while fixing a focused bug.
- Prefer `rg` for searching.
- Use `apply_patch` for manual edits.
- If a working tree contains unrelated changes, preserve them.

## Testing Pattern

Tests are lightweight source-level checks:

- `test/markdown.test.mjs`: Markdown renderer, flowchart renderer, export HTML, headings, search, stats.
- `test/project.test.mjs`: project file normalization and scan rules.
- `test/app-source.test.mjs`: browser app source invariants and UI behavior hooks.
- `test/electron-source.test.mjs`: Electron main/preload/package script invariants.

When adding a behavior, add or update the closest test first when practical. These tests intentionally inspect source strings for integration behavior such as IPC names, packaging scripts, and platform hooks.

## Electron File Opening

The app supports opening Markdown documents by double-clicking `.md` / `.markdown` files after system association.

Important flow:

1. `electron/main.cjs` receives file paths from macOS `open-file`, Windows command-line args, or second-instance events.
2. If no window exists, `ensureWindowForPendingFile()` creates one and stores the path in `pendingMarkdownFilePath`.
3. `electron/preload.cjs` exposes `consumePendingFile()`.
4. `src/app.js` calls `consumePendingNativeFile()` after binding listeners, then loads the returned file via `loadNativeMarkdownFile(file)`.

Do not replace this with a fire-and-forget event during startup. The pull-based pending-file flow avoids losing the file-open event before the renderer has registered listeners.

macOS window behavior:

- Closing the window should keep the process alive.
- `mainWindow` must be set to `null` on `closed`.
- A later double-clicked Markdown file must recreate the window and open that file.

## Packaging Rules

macOS:

- `npm run package:mac` creates the unpacked app under `dist/Local Markdown Studio-darwin-<arch>/Local Markdown Studio.app`.
- `electron/mac-info.plist` declares `.md` / `.markdown` document types.
- `npm run dmg:mac` is the preferred macOS distribution command. It creates `dist/Local Markdown Studio-macOS.dmg`, includes the app plus an `Applications` symlink, and removes the unpacked app directory afterward.
- `npm run zip:mac` creates `dist/Local Markdown Studio-macOS.zip` and removes the unpacked app directory afterward. A zip does not provide a macOS install prompt; use DMG when installation guidance matters.

Windows:

- `npm run package:win` creates the unpacked Windows app under `dist/Local Markdown Studio-win32-x64`.
- `scripts/prune-win-package.cjs` writes `register-md-association.cmd` into the packaged folder.
- The registration script registers `.md` and `.markdown` for the current Windows user under `HKCU\Software\Classes`.
- `npm run zip:win` creates `dist/Local Markdown Studio-win32-x64.zip` and removes the unpacked Windows package directory afterward.

## UI Behavior To Preserve

- The native application menu is hidden.
- Windows titlebar overlay follows the theme.
- Search highlights matches and scrolls to the first match.
- Split mode scroll sync is bidirectional.
- Outline entries are hierarchical, collapsible, and clicking an entry scrolls both editor and preview smoothly.
- Outline collapse should redraw only the outline, not rerender the preview.
- The project panel is hidden when no project is open.

## Markdown Scope

The renderer is intentionally small and local:

- Markdown image syntax renders images.
- Raw HTML passthrough is not a general feature.
- Video/audio support is not currently enabled.
- Flowchart support is a limited built-in renderer for simple Mermaid-style flowcharts.

Do not broaden Markdown semantics without tests in `test/markdown.test.mjs`.

## CodeGraph

<!-- CODEGRAPH_START -->
If a future checkout has a `.codegraph/` directory at the repository root, use CodeGraph before grep/find or broad file reading when locating code:

- MCP tools when available: `codegraph_explore` and `codegraph_node`.
- Shell fallback: `codegraph explore "<question or symbols>"` and `codegraph node <symbol-or-file>`.

If `.codegraph/` is absent, skip CodeGraph and use normal repository search.
<!-- CODEGRAPH_END -->
