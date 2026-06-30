# Local Markdown Studio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone static official website for Local Markdown Studio.

**Architecture:** Add `website/index.html` and `website/styles.css` without touching the Electron app shell. Use one generated bitmap product preview under `website/assets/` and add a source-level test for the website contract.

**Tech Stack:** Static HTML, CSS, existing Node test runner.

---

### Task 1: Website Contract Test

**Files:**
- Modify: `package.json`
- Create: `test/website-source.test.mjs`

- [x] Add `test/website-source.test.mjs` to assert the website title, download link, Apple Silicon support copy, quarantine command, preview asset, responsive CSS, and core section classes.
- [x] Add the website test to `npm test`.
- [x] Run `npm test` and confirm it fails before the website files exist.

### Task 2: Static Website

**Files:**
- Create: `website/index.html`
- Create: `website/styles.css`
- Create: `website/assets/app-preview.svg`
- Generate: `website/assets/app-preview.png`

- [x] Build the product-led landing page with hero, feature, local-first, install, and download sections.
- [x] Split download cards by Apple Silicon, Intel Mac, and source repository resources.
- [x] Add restrained reveal, floating, and hover animations with reduced-motion handling.
- [x] Revise the hero into a denser two-column layout for wide screens.
- [x] Replace the green theme with graphite, cobalt blue, cool gray, and amber accents.
- [x] Add responsive CSS for desktop and mobile.
- [x] Generate a bitmap app preview asset from the SVG source.

### Task 3: Verification

**Files:**
- Verify all touched files.

- [x] Run `npm test`.
- [x] Run `npm run check`.
- [x] Open or serve `website/index.html` for manual inspection.
- [x] Commit the completed website changes with a Chinese commit message.
