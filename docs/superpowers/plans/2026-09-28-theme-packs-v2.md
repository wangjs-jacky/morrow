# Reading Studio V2 Implementation Plan

**Goal:** Make five distinct dark packs selectable within the existing native theme and one-preview plugin, while preserving V1 settings and one-click Apply/Undo.

**Spec:** `docs/superpowers/specs/2026-09-28-theme-packs-v2-design.md`

**Boundary:** No third-party theme CSS or images are copied; no Obsidian core config is written; all work occurs in the V2 worktree and an isolated native test vault.

## Task 1 — Preset registry and state

- [ ] Add `src/presets.ts` with five IDs, labels, descriptions, and per-pack default options.
- [ ] Extend `StudioSettings.preset`, `selectPreset`, and current-pack Reset; keep persisted schema `version:1` and V1 data compatible.
- [ ] Test old saves, invalid IDs, draft-only selection, cross-pack apply/reload/undo, and reset.

## Task 2 — Native appearance inheritance

- [ ] Add/remove only namespaced `reading-studio-preset-*` classes in `src/appearance.ts`.
- [ ] Add CSS variables and distinct component treatments for the five packs in `theme/theme.css`, preserving V1 dark reading behavior and visibility toggles.
- [ ] Test class isolation and mapping; inspect real Obsidian properties, line numbers, sidebar, and Mermaid in an isolated vault.

## Task 3 — One-preview selector

- [ ] Render five live preset buttons from registry and update the single preview before Apply.
- [ ] Move preview colors/surfaces to per-pack tokens; keep controls visible and readable at desktop viewport sizes.
- [ ] Extend UI tests for selection, Apply/Undo, current-pack Reset, and distinctive preview surface tokens.

## Task 4 — Delivery

- [ ] Update demo/Ego E2E to switch among packs and verify reload, Undo, and blocked prerequisites.
- [ ] Add inspiration/license notes and extension guide; update English/Chinese README and screenshots.
- [ ] Bump theme, plugin, and package version to 0.2.0; build and verify both ZIPs.
- [ ] Run unit/type/build/package/real Obsidian/browser checks, review diff, publish repository update and release, verify CI and remote assets.
