[English](README.en.md) | [**简体中文**](README.md)

# dsh-gadgets 🧰

> A collection of lightweight tweaks for DeepSeek Harness — no core changes, no big frameworks, just a few small features that make it nicer to use.

**Positioning: lightweight & simple.** Pure browser-side DOM driving (stable data attributes verified against the official source), zero core modification, no infinite loops, no React-tree pollution; the code is readable and uninstalling restores everything.

## What's inside

### 🎨 dsh-skin — Appearance
- 15 preset skins (Sea-salt White → Lavender Purple, each with light/dark palettes)
- One-click light / dark / follow-system switching
- Font size: Small / Medium (default) / Large / Extra-large — covers both token-driven text and officially hard-coded UI text (composer, bubbles, sidebar)
- 13 adjustable color roles (color picker + HEX input)
- Theme-driven UI controls: composer, chat bubbles, buttons, Chat/Trajectory tabs, "Deep diving" gradient, sidebar
- All choices persist in localStorage — survive restart

### 📦 dsh-tidy — Conversation tidy
- **Message folding**: a button at the top-left of the conversation toggles "Folded / Expanded" — when folded, each turn keeps only the final assistant reply; thoughts, tool calls and intermediate outputs are hidden
- **Nav rail**: short dashes on the right edge (one per question), hover shows the first few words, click jumps, active position auto-highlights, scrollable
- **Auto-load history**: automatically clicks "Load earlier" until done (max 20 clicks / 100 nav nodes)
- Fold mode persists in localStorage, default expanded

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
```

### Or install from GitHub (for development)

```bash
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-skin
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
```

Manual install: copy the directory to `~/.dsh/profiles/node_modules/`, add a line `- insert: [{ id: dsh-skin, name: dsh-skin }]` (or `dsh-tidy`) to `cordis.patch.yml`, then restart DSH.

## Layout

```
dsh-gadgets/
├── dsh-skin/     # appearance plugin (Settings → General → Appearance)
├── dsh-tidy/     # conversation tidy plugin (fold button + nav rail, always on)
└── README.md
```

## Compatibility

- Color-token overrides rely on stable official data attributes and theme tokens — stable across versions
- Font/sidebar overrides depend on build-specific class hashes (`.uV2eYG_*`, `.gdEzaW_bubble`, `.pI_x6G_sidebarCol`) — if they silently stop working after a DSH update, update the class names against the new source (noted in the code)

## License

MIT
