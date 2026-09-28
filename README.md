# Morrow

[简体中文](README_CN.md)

Morrow is a dark reading theme for desktop Obsidian with a companion visual-controls plugin. A single Obsidian-like preview shows the sidebar, note body, properties, line numbers, and Mermaid. Select a style pack and adjust its options as a draft, then click **Apply** (the UI is in Chinese) to use it in your vault. **Undo** restores the previous applied configuration.

Morrow is an independent theme and does not load Cupertino's theme files. Floating Blue recreates the floating sidebar, grouped tools, and pill-shaped tabs with project-owned CSS. All five packs share this desktop shell while retaining their own colors and reading details.

Version 0.3.4 includes five dark packs: Quiet Night, Floating Blue, Graphite Minimal, Frosted Mist, and Cyan Focus. Their sidebar, body, properties, Mermaid, and control colors stay distinct. The customization panel opens by default so all controls are visible immediately. The preview shows the whole diagram at standard desktop sizes, with larger note text and colors closer to the applied theme. Line numbers, property visibility, Mermaid styling, width, and accent remain independent controls. Light packs are not yet available. Preview content is fictional; the plugin does not read or upload your notes. Existing V1 Quiet Night settings continue to work.

Frosted Mist uses frosted-glass surfaces on its sidebar, tabs, properties, and Mermaid cards while keeping the note background solid for legibility. Cyan Focus also uses a quieter cyan. Saved preset IDs and settings remain compatible.

## Install

On macOS, paste this command into Terminal. You do **not** need to find or type your vault path:

```bash
curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/morrow/main/scripts/install.sh | bash
```

An Obsidian vault is an ordinary local notes folder; **Git and GitHub are not required**. The installer reads Obsidian's registered vault paths and checks that the chosen folder contains `.obsidian`. It selects the sole valid vault, or the sole vault marked open while Obsidian is running. If several candidates remain, choose one by number; only if none is registered does it open a folder picker.

The installer downloads and verifies the v0.3.4 theme and plugin, backs up existing settings, and enables the theme, plugin, dark mode, line numbers, and visible properties. It disables only the old `cupertino-reading` and `cupertino-mermaid` snippets, preserving other snippets, settings, and saved plugin styles. **Restart Obsidian after installation.** Obsidian may still ask you to trust the vault when enabling community plugins for the first time. The backup location is printed in Terminal.

## Update

When you open Morrow, its companion plugin checks the latest complete GitHub Release. If a newer version exists, a banner offers **Copy update command**. Paste that command into a Mac terminal and run it, then restart Obsidian. The command is pinned to the detected release tag; the plugin never runs it. If clipboard access fails, the exact command appears for manual copying. The check sends a request to GitHub but does not send vault content; a network failure does not interrupt theme controls. The current sideloaded ZIP installation does not receive Obsidian's built-in update notifications. You can also rerun the installer command above at any time; it detects the vault again, verifies the release archives, creates a backup, and preserves saved plugin settings.

The same command also auto-detects the vault in an interactive SSH terminal. To target a different vault explicitly, pass its path:

```bash
curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/morrow/main/scripts/install.sh | bash -s -- "/path/to/your/vault"
```

Alternatively, download the matching theme and plugin ZIP files from [Releases](https://github.com/wangjs-jacky/morrow/releases). Unzip them into your vault:

```text
YOUR_VAULT/.obsidian/themes/Morrow/{manifest.json,theme.css}
YOUR_VAULT/.obsidian/plugins/morrow-controls/{manifest.json,main.js,styles.css}
```

For manual installation, select **Morrow** under **Settings → Appearance → Themes**, choose **Dark** as the base color scheme, enable **Show line numbers** and set **Properties in document** to **Visible** under **Settings → Editor**, then enable **Morrow Controls** under **Community plugins**. Open it from the palette ribbon icon or the command palette.

Option changes affect only the preview until Apply. Settings persist across restarts; Undo restores the previous pack and options. Reset restores the current pack's default draft without touching the applied appearance. The line-number and property switches only change visibility: they cannot generate line numbers or reveal native properties that Obsidian has disabled. The plugin checks these prerequisites and reports the required setting. It never changes Markdown, YAML, other themes, or Obsidian core configuration.

## Develop and verify

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run package:release
```

`npm run package:release` creates two installable ZIP files in `dist/`. The static demo in `demo/` uses the same UI and preset controller as the native plugin. `tests/e2e.ego.mjs` checks all five previews, complete Mermaid framing, draft changes, Apply, reload persistence, cross-pack Undo, and prerequisite failure. `node scripts/install-test-vault.mjs` creates an isolated native Obsidian test vault. The plugin interactions are covered by automated tests; native appearance should be checked in the isolated vault.

To rerun the interaction test, start `python3 -m http.server 4187` in the project root, then run `ego-browser nodejs < tests/e2e.ego.mjs` in another terminal. The demo URL is `http://127.0.0.1:4187/demo/`. The browser test covers shared interaction code; native rendering is checked separately in the isolated vault.

The editable [HTML interaction draft](design/prototype.html), [V1 product design](docs/superpowers/specs/2026-09-28-morrow-design.md), [V2 pack design](docs/superpowers/specs/2026-09-28-theme-packs-v2-design.md), and [inspiration and extension guide](docs/theme-inspiration.md) are preserved.

Desktop Obsidian 1.8.0 or newer is required. The Morrow installer has been checked against a temporary vault containing 17 other community plugins, including repeat installation and preservation of saved settings. Native appearance after restart has not been visually confirmed for this release. Mobile support and submission to Obsidian's community directories have not been verified. The theme CSS was written for this project and does not contain source code from the inspiration projects.

## License

MIT. See [LICENSE](LICENSE).
