# Local Markdown Studio Website Design

## Goal

Create a static official website for Local Markdown Studio that can be opened locally and later hosted as a simple marketing/download page.

## Scope

- Add a standalone `website/` directory.
- Keep the Electron application files unchanged.
- Present the product as a focused local-first macOS Markdown tool.
- Include a download entry for the existing DMG path.
- Split download resources by Mac chip family so Apple Silicon and Intel Mac users do not choose the wrong package.
- Explain Apple Silicon compatibility and the current unsigned Gatekeeper workaround.
- Add light entrance and hover motion while respecting `prefers-reduced-motion`.

## Design

The page is a single-page Mac app website with a product-name hero, a generated product preview image, concise workflow benefits, installation steps, and a final download section. The visual tone is restrained and product-led: light background, thin borders, compact cards, real app interface preview, and no decorative landing-page clutter.

The download section presents three resource cards: Apple Silicon DMG for M1-M4 Macs, Intel x64 DMG for Intel Macs, and the GitHub source repository. The page uses small reveal, floating, and hover animations to make the site feel polished without changing the core reading flow.

## Verification

Add a source-level website test that checks for the page title, DMG download links, Apple Silicon M1-M4 copy, Intel Mac copy, quarantine command, local-first positioning, app preview asset, animation keyframes, reduced-motion handling, responsive stylesheet rules, and the absence of negative letter spacing.
