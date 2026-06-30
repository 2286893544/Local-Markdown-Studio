# Local Markdown Studio Design

## Goal

Build a polished, local-first Markdown app for personal use, inspired by Typora's quiet writing experience while keeping implementation dependency-free and easy to open from disk.

## Product Scope

The app runs as a static browser app from `index.html`. It supports opening or dragging in `.md` files, opening a project folder and automatically listing Markdown documents inside it, switching project documents from the page, editing Markdown, previewing rendered output, navigating headings, searching text, switching layout modes, toggling theme, tracking document stats, restoring the last draft, and exporting rendered HTML.

The first version does not include cloud sync, accounts, collaborative editing, native filesystem write-back, plugin systems, or packaged desktop installers.

## Architecture

The app is split into focused files:

- `src/markdown.mjs`: pure Markdown parsing, heading extraction, search highlighting, stats, and export helpers.
- `src/project.mjs`: project Markdown file filtering, sorting, and directory-handle traversal.
- `src/app.js`: browser state, file input, project input, drag/drop, editor events, preview updates, navigation, theme, and local storage.
- `styles.css`: all layout, typography, responsive behavior, and theme tokens.
- `index.html`: app shell and controls.

Markdown rendering is intentionally local and safe: user text is escaped before inline formatting is applied. Supported syntax covers headings, paragraphs, bold, italic, inline code, fenced code blocks, Mermaid-style `flowchart`/`graph` blocks rendered as local SVG diagrams, blockquotes, ordered/unordered/task lists, links, images, horizontal rules, and simple pipe tables.

## UX

The default view uses a three-pane writing tool layout: left project/outline sidebar, center editor, right preview. A compact toolbar exposes single-file open, project open, mode switching, theme, search, sample loading, draft clearing, and export. Opening a project shows a global loading overlay with the current loading stage and a determinate progress bar while the app scans Markdown files, builds the project list, and opens the first document. Preview mode expands the rendered document for reading; split mode is the normal working layout; editor mode focuses on source editing.

Visual style is restrained: dense enough for daily work, strong typography, clear active states, no marketing hero, no decorative blobs, no nested cards.

## Testing

Core Markdown behavior is covered by a small Node-based test file using built-in `assert`. Browser UI is verified by loading the local app and checking that primary controls and rendered sample content appear.

## Constraints

The current directory is not a Git repository, so this design cannot be committed locally. The project must avoid package installation and network dependencies.
