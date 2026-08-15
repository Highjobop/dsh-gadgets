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
- **Message folding**: a button at the top-left of the conversation toggles "Compact / Full" — when compacted, each turn keeps only the final assistant reply; thoughts, tool calls and intermediate outputs are hidden
- **Nav rail**: short dashes on the right edge (one per question), preview text is read lazily on hover, click jumps, active position auto-highlights, scrollable
- **Auto-load history**: button-driven — loads while a "Load earlier" button is present in the visible conversation (ready-only clicks, max 8 pages per round, stops when content stops growing, resumes after cooldown until fully loaded); no jank, dashes grow live
- **Total-token badge**: bottom-left rounded rectangle, shows the session total token only (input + output), left-aligned with the fold button, bottom-aligned with the stats line; **context-pressure warning**: ≥60% turns the send-button color, ≥80% turns red with a "context nearly full" notice (same occupancy basis as the official context ring: `projectedTokens ÷ contextWindow`)
- Fold mode persists in localStorage, default full

### 🔔 dsh-notify — Task alerts (zh/en bilingual)
- **Task done**: when a session's whole run ends (including approval waits and subagents), plays a chime + pops a notification — **alerts in the foreground too** by default (optional "only when the page is not in the foreground" mode); **manual stops stay silent**, errors and blocked runs get their own alerts
- **Approval / answer needed**: on pending approval, plan review or an `ask_user` question, plays a chime + pops a notification, and tags the tab title with a ⚠ mark — always alerts, never missed (waits ~2.5 s so quick auto-decisions don't disturb)
- **Sound**: Web Audio synthesized **tone library**, zero audio assets — 6 tones (Ding / Chime / Triple / Deep / Soft / Beep), one row per event = toggle + tone + preview, volume slider (**default 50 %**, remembers the last value); **Popup**: in-page top-right toast always shows (click jumps to the session) + system Notification as an extra channel when authorized
- **Settings**: Settings → General → "Task alerts" (a second-level entry alongside Language / Appearance / Agent presets, UI switches with the DSH language) — independent toggles for done / approval / answer / error, tones, volume, popup, test buttons; persisted in localStorage
- **Bilingual**: UI and notification texts follow the DSH language setting (zh/en)
- Signals come from the official client `sessions` list snapshot + `session.history` end reasons (same source as the official sidebar), browser-side only, zero core changes

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
dsh plugin --profile web add dsh-notify  # task alerts
```

### Or install from GitHub (for development)

```bash
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-skin
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-notify
```

Manual install: copy the directory to `~/.dsh/profiles/node_modules/`, add a line `- insert: [{ id: dsh-skin, name: dsh-skin }]` (or `dsh-tidy` / `dsh-notify`) to `cordis.patch.yml`, then restart DSH.

## Layout

```
dsh-gadgets/
├── dsh-skin/     # appearance plugin (Settings → General → Appearance)
├── dsh-tidy/     # conversation tidy plugin (fold button + nav rail, always on)
├── dsh-notify/   # task alerts plugin (done / approval / answer → chime + popup)
└── README.md
```

## Compatibility

- Color-token overrides rely on stable official data attributes and theme tokens — stable across versions
- Font/sidebar overrides depend on build-specific class hashes (`.uV2eYG_*`, `.gdEzaW_bubble`, `.pI_x6G_sidebarCol`) — if they silently stop working after a DSH update, update the class names against the new source (noted in the code)

## License

MIT
