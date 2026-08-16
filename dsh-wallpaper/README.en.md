[**English**](README.en.md) | [简体中文](README.md)

# 🖼️ dsh-wallpaper

> A **semi-transparent wallpaper background** plugin for DeepSeek Harness — put an image behind the chat area, no core modifications, no React tree pollution, uninstall and everything reverts.

Pure client-side DOM driven. Settings → General → "Wallpaper Background" row: toggle, image, opacity, blur.

## Features

- **Enable toggle**: main chat background turns translucent, wallpaper shows through
- **Image**: paste an image URL, or pick a local file (auto-downscaled to ≤1200px JPEG dataURL to stay within localStorage quota)
- **Opacity**: 10%–100%, lower = more visible wallpaper
- **Blur**: 0–20px, blurring the background keeps text readable
- **Reset**: one click clears the wallpaper and restores defaults
- All settings persist in localStorage across restarts; compatible with dsh-skin (re-applies transparent token on theme change)

## How it works

- A fullscreen fixed layer `#dsw-wallpaper` (`z-index:-1`, `pointer-events:none`, blocks no interaction) sits at the bottom
- Three layers of transparency (all via **structural selectors / generic scanning**, no hashed class names):
  1. Override `--dsw-alias-bg-base` token to `transparent` (**on `body`** — the variable is defined on body; writing it on `html` has no effect)
  2. Inline-transparent the main frame `#root [data-slot="root"] > div` (its background is CSS-in-JS hardcoded white, not a variable)
  3. Scan the main column for opaque layers covering ≥30% of the viewport (e.g. pure-white root containers), clear them and mark each with a dataset flag (cleared only once per layer)
- Chat bubbles and the sidebar stay opaque for readability
- Wallpaper URL must be quoted `url("...")`: unquoted data: URLs are silently rejected by CSSOM validation (background-image goes missing)

## Install

Requires [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (0.1.0-rc.6+).

```bash
# From the dsh-gadgets community repo (available after this merge)
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-wallpaper
# Or from the author's personal repo (development)
dsh plugin --profile web add github:flyingpetals520/dsh-wallpaper
```

⚠️ Client plugins have no `dsh.bundle` field, so `dsh plugin add` only installs the dependency — **it does not auto-mount**. Manually append to `~/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- insert:
    - id: dsh-wallpaper
      name: dsh-wallpaper
```

Then restart `dsh web`.

### Install from GitHub (development)

```bash
dsh plugin --profile web add github:flyingpetals520/dsh-wallpaper
```

## Structure

```
dsh-wallpaper/
├── package.json     # dsh.client declaration
├── lib/index.js     # host half (empty activation stub)
├── lib/client.js    # browser half: settings row UI + wallpaper layer + token override
└── cordis.patch.yml # bundle composition patch
```

## Compatibility notes

- Chat transparency relies on the `--dsw-alias-bg-base` token (a stable DSH design token, not a class hash), so DSH upgrades generally won't break it
- If DSH changes its background token structure in the future, the override silently stops working (the wallpaper layer remains but is covered by an opaque background) — update per the new source
- When dsh-skin writes the same token: this plugin's `cordis.patch.yml` insert comes **after** skin's, and it re-applies on theme change, so it takes priority

## Development note

`file:` dependencies are **copied** into the profile's `node_modules` at install time; later source edits do not sync automatically.
During development, after editing run `cp -f lib/client.js ~/.dsh/profiles/web/node_modules/dsh-wallpaper/lib/client.js` and restart `dsh web` (browser refresh is enough).

## License

[MIT](LICENSE)
