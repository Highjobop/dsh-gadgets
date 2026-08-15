[English](README.en.md) | [**简体中文**](README.md)

# dsh-gadgets 🧰

> A collection of lightweight tweaks for DeepSeek Harness — no core changes, no big frameworks, just a few small features that make it nicer to use.

**Positioning: lightweight & simple.** Pure browser-side DOM driving (stable data attributes verified against the official source), zero core modification, no infinite loops, no React-tree pollution; the code is readable and uninstalling restores everything.

## What's inside

### 🎨 dsh-skin — Appearance (zh/en bilingual)
- 15 preset skins (Sea-salt White → Lavender Purple, each with light/dark palettes)
- One-click light / dark / follow-system switching
- Font size: Small / Medium (default) / Large / Extra-large — covers both token-driven text and officially hard-coded UI text (composer, bubbles, sidebar)
- 13 adjustable color roles (color picker + HEX input)
- Theme-driven UI controls: composer, chat bubbles, buttons, Chat/Trajectory tabs, "Deep diving" gradient, sidebar
- UI language follows the DSH language setting (zh/en)
- All choices persist in localStorage — survive restart

### 📦 dsh-tidy — Conversation tidy (zh/en bilingual)
- **Message folding**: a top-left button toggles "Compact / Full" — when compacted, each turn keeps only the final assistant reply
- **Nav rail**: short dashes on the right edge (one per question), hover for previews, click to jump, auto-highlight, auto-loads history
- **Total-token badge**: bottom-left, shows the session total token; turns warning color at ≥60% context usage, red at ≥80%
- **Per-feature toggles**: Settings → General → "Conversation Tidy" — fold / nav rail / badge can be switched independently
- Fold mode persists in localStorage, default full

### 🔔 dsh-task-alerts — Task alerts (zh/en bilingual)
- **Task done / error**: chime + popup when a whole run ends; manual stops stay silent
- **Approval / answer needed**: chime + popup, ⚠ mark on the tab title — always alerts
- **Sound & popup**: 6 tones, adjustable volume; browser Notification, falls back to in-page toasts when not authorized
- **Settings**: Settings → General → "Task alerts" — independent toggles for done / approval / answer / error, tones, volume, popup
- UI follows the DSH language setting (zh/en)

## Install

Requires [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (0.1.0-rc.6+).

### Recommended: one command via npm (aggregate package)

```bash
dsh plugin --profile web add dsh-gadgets
```

Restart dsh web after installing. To use only one of them:

```bash
dsh plugin --profile web add dsh-skin    # appearance
dsh plugin --profile web add dsh-tidy    # conversation tidy
dsh plugin --profile web add dsh-task-alerts  # task alerts
```

### Or install from GitHub (for development)

```bash
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-skin
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-task-alerts
```

Manual install: copy the directory to `~/.dsh/profiles/node_modules/`, add a line `- insert: [{ id: dsh-skin, name: dsh-skin }]` (or `dsh-tidy` / `dsh-task-alerts`) to `cordis.patch.yml`, then restart DSH.

## Layout

```
dsh-gadgets/
├── dsh-skin/     # appearance plugin (Settings → General → Appearance)
├── dsh-tidy/     # conversation tidy plugin (fold button + nav rail + total-token badge, toggleable)
├── dsh-task-alerts/   # task alerts plugin (done / approval / answer → chime + popup)
└── README.md
```

## Compatibility

- Color-token overrides rely on stable official data attributes and theme tokens — stable across versions
- Font/sidebar overrides depend on build-specific class hashes (`.uV2eYG_*`, `.gdEzaW_bubble`, `.pI_x6G_sidebarCol`) — if they silently stop working after a DSH update, update the class names against the new source (noted in the code)

## License

MIT
