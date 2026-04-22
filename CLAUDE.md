# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**"Subscribed"** — a web-based 2D pixel-art interactive narrative game for HKU CCHU9015 (Sex and Intimacy in Modern Times). Dramatises parasocial relationships, digital intimacy, and transactional online connection. Played once through in class; polish and atmosphere matter more than replayability. Tone is melancholic and critical, not preachy.

Story branches through scenes **S1–S9** with endings **E1–E7**, authored in `docs/` (`story line tree diagram.png`, `script.pptx`).

## Running

```bash
# Open directly in browser (must work):
open index.html

# Or via local server:
npx serve .
```

No build step. No install step. Zero dependencies beyond Google Fonts CDN.

## Tech constraints (non-negotiable)

- Pure HTML5 + CSS3 + vanilla JS (ES6 modules). No frameworks, no bundlers, no TypeScript, no preprocessors.
- Only external resource allowed: Google Fonts ("Press Start 2P") via `<link>`.
- Must work via `file://` and via `npx serve`. Targets latest Chrome/Safari/Firefox, desktop-first, usable ≥375px.

## Architecture

```
/index.html
/src/
  main.js     — entry point, wires DOM to engine
  engine.js   — scene state machine, choice handling, typewriter effect
  story.js    — ALL narrative data (single source of truth, keyed by scene ID)
  ui.js       — DOM rendering helpers; no story strings live here
/styles/
  main.css    — pixel-art theme, CSS custom properties, layout
/assets/
  bg/         — background images
  chars/      — character sprites + poses
  sfx/        — optional audio (.wav/.ogg only)
```

Do not introduce new top-level folders without asking first.

## Story data contract

All narrative content lives in `src/story.js` as a single exported object. Never hardcode dialogue, labels, or scene strings in render logic.

```js
{
  id: "S1",
  title: "...",
  background: "assets/bg/bedroom_night.png",
  character: "assets/chars/mira.png",  // or null
  characterPose: "idle",               // idle | happy | sad | glitch | ...
  dialogue: [
    { speaker: "Mira", text: "Hey you. Thanks for subscribing." }
  ],
  choices: [
    { label: "Tip $5",     next: "S2" },
    { label: "Just watch", next: "S3" }
  ]
}
```

Endings (`E1`–`E7`): same shape, `choices: []`, plus `ending: true` and a short `epilogue` string.

## Rendering rules

- Render from scene objects; never from string literals. E.g. `<button data-next="S2">`.
- All scene transitions go through a single `goToScene(id)` function that validates the ID.
- DOM/side-effect code lives in `ui.js`; story flow logic lives in `engine.js`.
- No `innerHTML` with user-derived strings — use `textContent` for dialogue, `<template>` elements for structural HTML.
- No inline event handlers in HTML; wire all listeners in JS.

## Visual style

CSS custom properties — use these, no ad-hoc hex values:

```css
--navy:  #0f1020;  /* deep background */
--cyan:  #6ee7ff;  /* phone-glow, primary UI */
--pink:  #ff6fb5;  /* creator / romance accent */
--amber: #ffb347;  /* warning / money */
--ghost: #7a7f9a;  /* muted text, disabled */
```

- `image-rendering: pixelated` on every `<img>` and canvas.
- `font-family: "Press Start 2P", monospace` everywhere.
- No gradients. No blurry shadows. Depth via hard-edged pixel offsets only (`box-shadow: 4px 4px 0 var(--ghost)`).
- Borders: solid, 2–4px, `border-radius: 0`.
- Button pressed state: shifts 2px down/right, loses bottom-right shadow.

## Dialogue / typewriter

- Typewriter effect at ~30ms per character.
- Click or Enter/Space while typing: complete current line instantly; second press advances.
- `@media (prefers-reduced-motion: reduce)`: print full lines immediately, no animation.

## Accessibility

- Keyboard: **1/2/3** select choices, **Enter/Space** advance dialogue, **Esc** opens pause overlay.
- Visible focus ring on all interactive elements (cyan, hard-edged).
- Every `<img>` has meaningful `alt`; decorative images use `alt=""` + `aria-hidden="true"`.
- Never use colour as the sole signal. Contrast meets WCAG AA against `--navy`.

## Code style

- `const` by default, `let` only when reassigning, never `var`. Strict equality (`===`).
- `for...of` and array methods over index loops.
- ES modules only (`import`/`export`). No `require`, no IIFE globals.
- Only global allowed: `window.__subscribed` debug hook, guarded by a `DEBUG` flag.
- Filenames: `kebab-case.js` / `kebab-case.css`. Functions/variables: `camelCase`. Scene IDs: `S1`, `E1`.
- JSDoc on non-obvious functions (purpose, params, returns). Skip on trivial one-liners.

## When adding features

1. Explain the change in relation to the theme (parasocial intimacy, transactional connection) and/or style rules first.
2. When touching a file, output the **full file** after changes so it can be copy-pasted directly.
3. If a change creates more than one new file, list filenames + one-line purpose each, then **stop and wait for confirmation** before generating contents.

## Out of scope — do not add

- Build tooling, TypeScript, linters-as-dependencies, npm scripts beyond `"start": "npx serve"`.
- Networked features, save-to-cloud, leaderboards, auth.
- Heavy audio/video (tiny `.wav`/`.ogg` SFX are fine).
- Anything that breaks `file://` open-and-play.
