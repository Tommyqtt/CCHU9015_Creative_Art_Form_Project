# Subscribed

A web-based 2D pixel-art interactive narrative game. A single player walks
one path through the life of **Alex**, a lonely 28-year-old who subscribes
to a cosplay creator's paid DMs and discovers — slowly, or not at all —
that the warmth on the other end is partly staffed. The piece dramatises
parasocial relationships, digital intimacy, and the transactional shape of
modern online connection.

Built as coursework for **HKU CCHU9015 — Sex and Intimacy in Modern Times**
(Creative Art Form Presentation). Played once through in class; polish and
atmosphere matter more than replayability.

---

## Run it

No install step. No build step. Two ways to play:

```bash
# 1. Direct in browser — opens via file://
open index.html

# 2. Or serve locally (recommended if your browser blocks ES modules on file://)
npx serve .
```

Targets latest Chrome, Safari, and Firefox. Desktop-first, usable down to
~375px viewport width.

## Controls

- **Click / Enter / Space** — advance dialogue, press the current button.
- **1 / 2 / 3** — pick the corresponding choice (available once the scene
  renderer lands in Slice C).
- **Esc** — pause (available once the pause overlay lands).

## Tech

- Pure HTML5 + CSS3 + vanilla JavaScript (ES6 modules).
- No frameworks, no bundlers, no TypeScript, no CSS preprocessors.
- Only external resource: **Press Start 2P** via Google Fonts.

See [`.cursorrules`](./.cursorrules) for the full non-negotiable rule set.

## Palette

```
--navy  #0f1020  deep background
--cyan  #6ee7ff  phone-glow, primary UI
--pink  #ff6fb5  creator / romance accent
--amber #ffb347  warning / money
--ghost #7a7f9a  muted, distant, silence
```

## Project layout

```
index.html           entry point
styles/
  reset.css          minimal reset
  main.css           palette + typography + shared primitives
  scene.css          title + scene layout
src/
  main.js            app entry, mounts screens
  story.js           STORY data (populated in Slice B)
  engine.js          scene state machine (fleshed out in Slice C)
  state.js           run-time game state
  ui/
    titleScreen.js   "SUBSCRIBED" title card
    sceneView.js     placeholder scene view
docs/
  story_spec.md      narrative source of truth
  TASKS.md           work ledger
  INTEGRATION_LOG.md merge log
  HANDOVER_NOTE.md   current-state snapshot
assets/              character sprites and (future) backgrounds
```

## Status

Slice A shipped — scaffold + title screen. The rest is planned in
[`docs/TASKS.md`](docs/TASKS.md).

## Credits

- **Story, code, visual direction:** coursework author, HKU 2026.
- **Typeface:** *Press Start 2P* by CodeMan38, served via Google Fonts.
- **Tree diagram + script sources:** `docs/story line tree diagram.png`,
  `docs/script.pptx`. Authored additions (e.g. ending epilogues, creator
  name "Mira") are flagged in `docs/story_spec.md`.

## License

Coursework submission. Not yet licensed for redistribution.
