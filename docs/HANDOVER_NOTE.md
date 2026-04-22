# HANDOVER — "Subscribed"

> Single-file snapshot of current project state. **Overwritten at the end of every slice.** If you are resuming this project, read this first, then `docs/TASKS.md` and the latest block of `docs/INTEGRATION_LOG.md`.

**Last updated:** 2026-04-23, end of Slice C (both C.1 polish + C.2 render pipeline).

---

## Mode

**Single-agent.** One operator acts as planner, implementer, and integrator. Commits land directly on `main`.

## Current branch

`main`. Working tree clean after the Slice C.2 commit. Last five code commits (most recent first):
- `feat(slice-c): scene and ending rendering with choices`
- `feat(slice-c): visual polish + pause overlay`
- `chore(slice-b): tune typewriter default to 15ms`
- `feat(slice-b): story data + engine with dev jumper`
- `feat(slice-a): scaffold + title screen`

## What exists on `main`

- **Rules & specs:** `.cursorrules`, `CLAUDE.md`, `docs/story_spec.md`, `docs/story line tree diagram.png`, `docs/script.pptx`.
- **Entry + CSS:** `index.html`, `styles/reset.css`, `styles/main.css`, `styles/scene.css`.
- **Source:**
  - `src/main.js` — boots on `DOMContentLoaded`, owns the title lifecycle, installs the engine lazily on first start, mounts the dev jumper when `localStorage.getItem('dev')==='true'`.
  - `src/state.js` — `state = { currentSceneId, history, visitedScenes: Set }`. Helpers: `reset()`, `recordVisit()`, deprecated `enterScene()`.
  - `src/story.js` — full 16-entry `STORY` (S1–S9 + E1–E7), deep-frozen. Dev-flag-gated BFS at the module bottom logs reachability.
  - `src/engine.js` — `initEngine(el, hooks)`, `renderScene(id)`, `handleChoice(choice)`, `returnToTitle()`, `typewriter(el, text, speed = DEFAULT_TYPE_SPEED_MS /* 15 */)`. Owns the document-level Esc listener that toggles the pause overlay (installed in `initEngine`, guarded against double-install).
  - `src/ui/titleScreen.js` — "SUBSCRIBED" title card (unchanged since Slice A; About is still a `window.alert`).
  - `src/ui/sceneView.js` — renders `type==='scene'`. Adds bg + char placeholder tiles behind the `<img>`s (hidden on `load`, retained on `error`). Toggles `.is-typing` on the text element (drives caret blink) and `.is-final-line` on the scene root when the last dialogue line starts (drives S4's glitch). 80ms choice press animation routes both click and 1/2/3 key paths through `commitChoice(idx)`. Skips its own keys + clicks while a `.pause-overlay` is mounted.
  - `src/ui/endingView.js` — **rewritten in Slice C.2.** Renders `type==='ending'`. Single shared `assets/bg_endings.png` background behind every ending (with a placeholder tile). Uppercased title typed letter-by-letter with a blinking caret. Concatenated narration paragraph fades in after the title completes (staggered with the takeaway and actions). **Replay** calls `onReturnToTitle`; **View my path** toggles a scrollable `state.history` list with titles pulled from STORY. Close button returns focus to the View-my-path button. Pause overlay still works over the top.
  - `src/ui/devJumper.js` — bottom-right pixel panel with dropdown of all 16 ids + "Jump" button (unchanged since Slice B).
  - `src/ui/pauseOverlay.js` (Slice C.1) — modal pause panel: **Resume** + **Return to title** + Esc hint. Engine mounts it into `document.body`. Backdrop click = resume; panel clicks don't bubble.
- **Docs:** `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md` (this file).
- **Assets:** `assets/alex_neutral.png`, `assets/alex_phone.png`, `assets/alex_anxious.png`, `assets/alex_defeated.png`. All referenced from `src/story.js` as Mira stand-ins (grep `TODO(slice-e)`). **Every other asset still 404s** and shows its placeholder tile; this is expected until Slice D.
- **README.md.**

## What works right now

- **Title screen.** Unchanged since Slice A. Enter or click Start enters S1.
- **Scene flow.** Every S1–S8 + S9 renders: bg placeholder tile (labelled with the asset path — the real image will drop in during Slice D), char placeholder badge behind the Alex-stand-in sprite, speaker-coloured dialogue box, ~15ms/char typewriter with a cyan block caret, click / Enter / Space to skip or advance, 1 / 2 / 3 to pick a choice, 80ms visible press animation (invert + scale 0.95) before the engine hands you the next scene. Reduced motion collapses both the typewriter and the 80ms press delay.
- **Ending flow.** Every E1–E7 + S9 renders: single shared `bg_endings.png` placeholder tile, title typed out in uppercase at 32px with caret + hard-edged pink-on-navy shadow, narration paragraph fades in and nudges up after the title completes, takeaway (when authored) fades in next, actions row fades in last. **Replay** clears state and returns to the title. **View my path** opens a scrollable list: `[01 · S1 · The Scroll, 02 · S3 · The Hook Lands, …]` built from `state.history` with display titles looked up from STORY.
- **Return to title.** Closes pause overlay, resets state, re-mounts the title.
- **Dev jumper.** Unchanged. z-index 1000. Pause overlay sits at z-index 2000 and covers it when open (by design).
- **Pause overlay (Esc).** Works over both scene and ending views. Backdrop click resumes; panel clicks don't. No-op on the title.
- **Caret blink.** Cyan block caret on both dialogue text and ending title, 900ms / steps(2) cadence. Reduced motion pins it visible.
- **S4 glitch beat.** When S4's final dialogue line starts, Mira's sprite (currently the Alex stand-in, placeholder tile when it 404s) flickers three times with hard-edged RGB offsets. One-shot.
- **Per-scene palette leans.** S3 pink · S4 pink→amber on final line · S5 ghost + 0.6 opacity sprite · S7 amber · S9 ghost ending. All driven by `[data-scene-id=...]` CSS rules.
- **Pressed state on non-choice buttons.** `.btn:active` still does the 2px translate (title, ending Replay + View my path, pause overlay buttons, dev-jumper Jump). Scene choice buttons override to the scale-0.95 invert.
- **Reduced motion.** Typewriter synchronous; caret, S4 glitch, `.is-pressed` transform, and `.is-revealed` fade-ins all stripped; static palette leans retained.
- `npx serve .` and direct `file://` both continue to work.

## What's broken / blocked

- **No art.** Every `assets/bg_*.png`, every `assets/mira*.png`, and `assets/bg_endings.png` 404s. Placeholder tiles render with the asset path as a label so the operator can see which file is missing. Slice D ships the art; placeholders vanish on image `load`.
- **S9 unreachable from S1** (flowchart pick S4.D3 → E5). Dev jumper reaches it.
- **S9 takeaway is empty** — ending view hides the element.
- **Ending ignores per-ending `scene.background`**. Every ending uses the single `ENDING_BG = 'assets/bg_endings.png'` constant in `src/ui/endingView.js`. If per-ending ending art ever lands, change it to `scene.background || ENDING_BG`.
- **About modal** still a `window.alert`. Backlog.
- **Pause overlay has no focus trap**; acceptable for the classroom one-shot.

## Unresolved architectural questions

- **ORCHESTRATION §3 contracts.** Unchanged since Slice B: scene/ending shapes pinned at `src/story.js` header; `ctx` contract (`onChoice` / `onReturnToTitle`) at `src/engine.js` header + echoed in the view modules.
- **Engine state.** Still in `src/state.js`. Slice C.2 added `endingView` as a consumer of `state.history` (read-only).
- **Typewriter return shape.** Still `Promise & { skip() }`. Fine.
- **`isPauseOpen()` remains a `querySelector`-per-event.** If a second overlay type arrives (About modal, etc.), consolidate into `src/ui/overlayStack.js`.
- **Placeholder tile coupling to asset paths.** Placeholder text is pulled straight from `scene.background` / `scene.character.sprite`. If Slice D renames any asset, the placeholder label updates automatically — no separate list.

## Next planned slice

**Slice D — Background + character art.** See `docs/TASKS.md`.

1. Draw / source pixel backgrounds: `bg_bedroom_night`, `bedroom_night_after`, `phone_browser`, `phone_dm`, `phone_dm_warm`, `phone_dm_cool`, `phone_dm_idle`, `phone_dm_late`, `phone_dm_bleary`, **and the new `bg_endings.png`**.
2. Draw Mira sprite(s). Swap off the `assets/alex_*.png` stand-ins in `src/story.js` (grep `TODO(slice-e)`).
3. Verify every scene's placeholder is gone (placeholders hide on `load`); verify the S5 0.6-opacity lean reads well once Mira is the sprite; verify S4 glitch looks right on the real sprite.

Do NOT start Slice D in parallel with re-touching C. One slice at a time until it's stable.

## Follow-ups discovered during Slice C

- **Focus trap in pause overlay** — logged from C.1; still deferred.
- **Caret width on narrow viewports** — Slice C.1 follow-up; still relevant after C.2.
- **Overlay stack registry** — if About modal lands, unify `pause-overlay` + About under one registry so views only need one DOM query.
- **Choice press 80ms cancellation** — `choiceLocked` blocks duplicates but the scheduled `onChoice` can't be cancelled mid-animation. Not a problem today (single-agent, single-player) but flag if input queueing becomes a feature.
- **`ending__path-list` max height (`192px`) fits ~10 entries.** Plenty for this story (longest run ~8 entries). Revisit if a future feature lets the player re-enter scenes during a run.
- **Per-ending art switch** — if Slice D or E wants per-ending backgrounds, flip `ENDING_BG` to `scene.background || ENDING_BG` in `src/ui/endingView.js` — one-line change.
- **Narration pacing** — Slice C.2 collapsed multi-line narration into one fading paragraph. If the operator misses the per-line advance cadence for a specific ending (e.g. E3 which has three beats), we can opt into a typed-narration mode per-ending via a STORY flag; defer until requested.
- **Palette lean after Slice D art lands** — the S5 0.6 opacity and S9 ghost-only chrome may need a second visual pass once there's real art behind them.

## Discipline reminders (self)

- Finish one slice end-to-end before starting the next.
- Resolve narrative ambiguities by consulting `docs/story_spec.md`, not by inventing patterns.
- Verbatim transcription means verbatim. Any paraphrase is a bug.
- Small, descriptive commits. `feat(slice-x):` / `fix(…):` / `chore(…):` / `docs(…):` prefixes.
- Never rewrite code you didn't just touch unless the slice requires it.
- Keyboard-first affordances are a hard requirement (`.cursorrules` §Accessibility); verify on every new screen.
