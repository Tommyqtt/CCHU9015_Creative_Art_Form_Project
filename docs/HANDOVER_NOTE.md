# HANDOVER — "Subscribed"

> Single-file snapshot of current project state. **Overwritten at the end of every slice.** If you are resuming this project, read this first, then `docs/TASKS.md` and the latest block of `docs/INTEGRATION_LOG.md`.

**Last updated:** 2026-04-23, end of Slice C.

---

## Mode

**Single-agent.** One operator acts as planner, implementer, and integrator. Commits land directly on `main`.

## Current branch

`main`. Working tree clean after the Slice C commit. Last four code commits (most recent first):
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
  - `src/ui/sceneView.js` — renders `type==='scene'`. Toggles `.is-typing` on the text element (drives caret blink) and `.is-final-line` on the scene root when the last dialogue line starts (drives S4's glitch). Skips its own keys + clicks while a `.pause-overlay` is mounted.
  - `src/ui/endingView.js` — renders `type==='ending'`. Same `.is-typing` toggle, same pause-overlay skip.
  - `src/ui/devJumper.js` — bottom-right pixel panel with dropdown of all 16 ids + "Jump" button (unchanged since Slice B).
  - `src/ui/pauseOverlay.js` **(Slice C)** — modal pause panel: **Resume** + **Return to title** + Esc hint. Mounted into `document.body` by the engine, not by main.js. Backdrop click = resume; panel clicks don't bubble.
- **Docs:** `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md` (this file).
- **Assets:** `assets/alex_neutral.png`, `assets/alex_phone.png`, `assets/alex_anxious.png`, `assets/alex_defeated.png`. All referenced from `src/story.js` as Mira stand-ins (grep `TODO(slice-e)`).
- **README.md.**

## What works right now

- **Title screen.** Unchanged since Slice A. Enter or click Start enters S1.
- **Scene flow.** Dialogue types character-by-character at ~15ms/char (tuned from 30ms during Slice B follow-up). A cyan block caret blinks at the end of the active line; it disappears the moment you advance or choices appear. Clicking / Enter / Space while typing completes the line; another press advances. 1 / 2 / 3 pick choices by position.
- **Ending flow.** Narration types the same way; caret also blinks. When the last narration line finishes, takeaway + "Return to title" reveal and the button gets focus.
- **Return to title** closes any open pause overlay, resets `state`, and re-mounts the title.
- **Dev jumper.** Unchanged from Slice B; sits at `z-index: 1000`. Pause overlay sits at `z-index: 2000` so it stacks above.
- **Pause overlay (Slice C).** Press **Esc** while a scene or ending is mounted: a modal panel appears with **Resume** (focused by default, Enter activates) and **Return to title**. Esc again closes it. Backdrop click closes it. While the overlay is up, the scene / ending view ignores keyboard + click so the reader can't accidentally advance or pick a choice behind it. Esc on the title screen is a no-op.
- **Caret blink.** Cyan block caret, 900ms blink cadence, only while the current line is the "active" one. Respects reduced motion.
- **S4 glitch beat.** When the final S4 dialogue line starts ("Something feels off."), Mira's sprite flickers three times (~120ms per frame, hard-edged RGB offset using pink / cyan / amber drop-shadows). One-shot; doesn't re-fire without re-entering S4.
- **Per-scene palette leans.**
  - **S3** — pink chrome + pink choice-number colour ("warms from clinical cyan to softer pink").
  - **S4** — pink chrome, amber takeover on the final line.
  - **S5** — ghost-muted chrome + ghost text + 60% opacity sprite ("cool, sparse, efficient; reduced distance").
  - **S7** — amber chrome + amber choice number ("held breath").
  - **S9** — ghost-only ending chrome ("aftermath … navy and ghost only; no accent").
- **Pressed state.** `.btn:active` already shifts 2px down/right and drops its shadow (inherited into `.scene__choice`). `.scene__choice:active` additionally leans pink so the press reads on long labels.
- **Reduced motion.** Typewriter collapses to synchronous write (Slice B). Caret animation is removed (caret pinned visible). S4 glitch is removed. Palette leans stay — they're static colour, not motion.
- `npx serve .` and direct `file://` both continue to work.

## What's broken / blocked

- **No art.** Every `assets/bg_*.png` and `assets/mira*.png` 404s. Load-error handlers hide broken-image icons; scenes show the navy chrome with palette leans. Slice D ships the art.
- **S9 unreachable from S1.** User-approved consequence of the flowchart pick (S4.D3 → E5 instead of the spec's S9). Dev jumper still reaches it; reachability check expects exactly `[S9]` as the orphan set.
- **S9 takeaway is empty** by spec. Ending view hides the element when empty.
- **About modal** is still a `window.alert`. Backlog.
- **Pause overlay has no focus trap.** Tab from the Return-to-title button can still reach underlying buttons. Acceptable for a one-shot classroom piece; revisit only if the piece ever gets re-used.

## Unresolved architectural questions

- **ORCHESTRATION §3 contracts** remain un-re-introduced post-reset. Scene shape is pinned in the `src/story.js` header; the `ctx` contract (`onChoice` / `onReturnToTitle`) lives in `src/engine.js` and is echoed in the view modules. If a thin `docs/ORCHESTRATION.md` is wanted back, grep those two header blocks — they are the source of truth.
- **Where does engine state live?** Unchanged from Slice B: `src/state.js` owns history + visited set; engine writes via `recordVisit()`. The pause overlay is a pure UI concern and is **not** reflected in `state` — if save/resume is ever required, add a `state.paused: boolean` and have `engine.closePause()` keep it in sync.
- **Typewriter return type.** Still `Promise & { skip() }`. Not revisited in Slice C.
- **`isPauseOpen()` is a `querySelector` per-event.** Fine at this scale; if more overlays show up (About modal, etc.), wrap them in a shared `overlayStack` registry so views can ask once.

## Next planned slice

**Slice D — Background + character art.** See `docs/TASKS.md`.

1. Draw / source pixel backgrounds for all 9 scenes (`assets/bg_bedroom_night.png`, `bedroom_night_after`, `phone_browser`, `phone_dm`, `phone_dm_warm`, `phone_dm_cool`, `phone_dm_idle`, `phone_dm_late`, `phone_dm_bleary`).
2. Draw Mira sprite(s) — either one sprite + pose CSS filters (`idle` / `happy` / `sad` / `glitch`) or four separate PNGs. Swap off the Alex stand-ins in `src/story.js` (grep `TODO(slice-e)`).
3. Verify every scene loads without broken-image icons; verify the S5 "reduced opacity" beat still reads once Mira is the sprite.

Do NOT start Slice D in parallel with revisiting C unless the operator wants to context-switch. One slice at a time until it's stable.

## Follow-ups discovered during Slice C

- **Focus trap in pause overlay.** Not needed for presentation day; log for post-term polish.
- **Caret width on narrow viewports.** At 375px the caret block is ~8px wide against 11px font-size; watch during Slice E projector smoke. If it reads as a line-height nudge, switch `::after` to a `<span>` that's explicitly absolutely positioned.
- **Overlay stack registry.** If About modal lands, unify with pause overlay under `src/ui/overlayStack.js` so views only need one DOM query.
- **Palette-lean review after Slice D.** Once real art is in place, the S5 0.6 opacity and S9 ghost-only chrome need another visual pass. Lean values are cheap to tweak.
- **S4 glitch trigger** fires on the first character of the final line (`startLine(last)`). If the operator wants the glitch to land *on the reply's 2:17 AM beat* specifically (not at line start), split the final line into two and trigger on the second — but that would require splitting what `story_spec.md` authors as one narrator beat.

## Discipline reminders (self)

- Finish one slice end-to-end before starting the next.
- Resolve narrative ambiguities by consulting `docs/story_spec.md`, not by inventing patterns.
- Verbatim transcription means verbatim. Any paraphrase is a bug.
- Small, descriptive commits. `feat(slice-x):` / `fix(…):` / `chore(…):` / `docs(…):` prefixes.
- Never rewrite code you didn't just touch unless the slice requires it.
- Keyboard-first affordances are a hard requirement (`.cursorrules` §Accessibility); verify on every new screen.
