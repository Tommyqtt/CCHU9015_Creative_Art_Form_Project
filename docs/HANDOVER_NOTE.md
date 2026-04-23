# HANDOVER — "Subscribed"

> Single-file snapshot of current project state. **Overwritten at the end of every slice.** If you are resuming this project, read this first, then `docs/TASKS.md` and the latest block of `docs/INTEGRATION_LOG.md`.

**Last updated:** 2026-04-23, end of Slice E (pixel-art asset integration).

---

## Mode

**Single-agent.** One operator acts as planner, implementer, and integrator. Commits land directly on `main`.

## Current branch

`main`. Working tree clean after the Slice E commit. Last seven code commits (most recent first):
- `feat(slice-e): integrate pixel art assets`
- `chore(assets): remove scratch PNGs`
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
  - `src/story.js` — full 16-entry `STORY` (S1–S9 + E1–E7), deep-frozen. **Slice E rewired every entry** off the Alex-stand-in sprites onto the real 14 pixel-art PNGs (plus 2 optional title-screen assets). Dev-flag-gated BFS at the module bottom logs reachability.
  - `src/engine.js` — `initEngine(el, hooks)`, `renderScene(id)`, `handleChoice(choice)`, `returnToTitle()`, `typewriter(el, text, speed = DEFAULT_TYPE_SPEED_MS /* 15 */)`. Owns the document-level Esc listener that toggles the pause overlay. **Slice E added** `runTransition(doSwap)` — 300ms fade-to-black via a shared `.scene-transition` overlay (150ms fade-out → DOM swap → 150ms fade-in), `transitionToken` cancellation for stale timers, reduced-motion short-circuit.
  - `src/ui/titleScreen.js` — "SUBSCRIBED" title card. **Slice E added** a `bg_title.png` painting underlay (0.32 opacity) and two decorative `icon_heart.png` corner sprites; both have `error` handlers that self-hide so a missing asset falls back to the Slice A navy layout. About is still a `window.alert`.
  - `src/ui/sceneView.js` — renders `type==='scene'`. bg + char placeholder tiles (hidden on `load`, retained on `error`). Toggles `.is-typing` + `.is-final-line`. 80ms press animation via `commitChoice(idx)` on both click and 1/2/3 paths. Skips its keys/clicks while `.pause-overlay` is up. Sprite positioning driven by `data-position` attribute — no JS change needed for Slice E.
  - `src/ui/endingView.js` — unchanged in Slice E (Slice C.2 rewrite still current). Single shared `bg_endings.png`, typed uppercased title, concatenated narration fade-in, Replay + View my path.
  - `src/ui/devJumper.js` — unchanged since Slice B.
  - `src/ui/pauseOverlay.js` — unchanged since Slice C.1.
- **Docs:** `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md` (this file).
- **Assets (all 16 on disk, referenced by name in `src/story.js` or `src/ui/titleScreen.js`):**
  - **Alex:** `alex_neutral.png`, `alex_phone.png`, `alex_anxious.png`, `alex_defeated.png`
  - **Mira (creator):** `creator_wave.png`, `creator_selfie.png`, `creator_kiss.png`
  - **Chatter (S7 reveal + unused):** `chatter_trio.png` (used), `chatter_single.png` (authored but unreferenced — see §notes)
  - **Backgrounds:** `bg_scene1_bedroom.png`, `bg_scene2_preview.png`, `bg_dm_chat.png`, `bg_scene7_split.png`, `bg_endings.png`
  - **Title decorations:** `bg_title.png`, `icon_heart.png`
- **README.md.**

## Which asset paints which scene

| Scene | Background           | Character sprite        | Position |
|-------|----------------------|-------------------------|----------|
| S1    | bg_scene1_bedroom    | alex_phone              | center   |
| S2    | bg_scene2_preview    | *(none)*                | —        |
| S3    | bg_dm_chat           | creator_wave            | right    |
| S4    | bg_dm_chat           | creator_kiss            | right    |
| S5    | bg_dm_chat           | creator_selfie          | right    |
| S6    | bg_dm_chat           | creator_wave            | right    |
| S7    | bg_scene7_split      | chatter_trio (overlay)  | right    |
| S8    | bg_dm_chat           | creator_selfie          | right    |
| S9    | bg_endings (shared)  | alex_defeated *(ignored by endingView)* | center |
| E1–E7 | bg_endings (shared)  | *(none)*                | —        |

## What works right now

- **Title screen.** `bg_title.png` painting at 0.32 opacity behind the copy, two `icon_heart.png` corner sprites. Enter or click Start triggers the 300ms fade-to-black transition, then lands S1.
- **Scene transitions.** 150ms fade-out → DOM swap → 150ms fade-in on every `renderScene` call (title→S1, choice→next, dev-jumper→any). Reduced-motion collapses to an instant cut. Stale transitions (e.g. dev-jumper spam) are cancelled by `transitionToken`.
- **Scene flow.** Every S1–S8 + S9 renders with its authored pixel art: full-bleed bg, bottom-anchored character sprite at 65vh desktop / 50vh mobile. S3/S4/S5/S6/S7/S8 sprites sit at right (15% from edge); S1/S9 sprites center with `translateX(-50%)`. Speaker-coloured dialogue box, ~15ms/char typewriter, click/Enter/Space to skip or advance, 1/2/3 to pick a choice, 80ms visible press (invert + scale 0.95) before the next scene.
- **Ending flow.** Every E1–E7 + S9 renders the shared `bg_endings.png` card, typewritten uppercased title at 32px with caret, narration paragraph fades in, takeaway (when authored) fades in next, Replay + View my path work.
- **Phone-glow ambient.** S1 and S2 backgrounds oscillate `filter: brightness(0.95 ↔ 1.0)` over 2s. Stops on scene unmount; reduced-motion freezes it.
- **Return to title.** Closes pause overlay, resets state, fades to title.
- **Dev jumper.** Unchanged. z-index 1000; transition overlay (3000) covers it during fades, pause overlay (2000) covers it when open.
- **Pause overlay (Esc).** Works over scene and ending views. Backdrop click resumes; panel clicks don't. No-op on the title.
- **Caret blink.** Cyan block caret on dialogue text and ending title. Reduced motion pins it visible.
- **S4 glitch beat.** On S4's final line the `creator_kiss` sprite flickers three times with hard-edged RGB offsets. (Sprite is right-positioned so the glitch `transform: translate(...)` has no base transform to collide with.)
- **Per-scene palette leans.** S3 pink · S4 pink→amber on final · S5 ghost + 0.6 opacity sprite · S7 amber · S9 ghost ending. Driven entirely by `[data-scene-id=...]` CSS rules.
- **Reduced motion.** Typewriter synchronous; caret, S4 glitch, `.is-pressed` scale, `.is-revealed` fade-ins, phone-glow, and scene transitions all stripped. Static palette leans retained.
- `npx serve .` and direct `file://` both continue to work.

## What's broken / blocked

- **S9 unreachable from S1** (flowchart pick S4.D3 → E5). Dev jumper reaches it. S9's STORY `character` field (`alex_defeated`) is authored for completeness but ignored by `endingView` — if future beats want a sprite on S9 specifically, either re-route a choice to S9 as a `scene` type (not `ending`), or add a conditional-character branch in `endingView`.
- **S9 takeaway is empty** — ending view hides the element.
- **Ending ignores per-ending `scene.background`**. Every ending uses `ENDING_BG = 'assets/bg_endings.png'` in `src/ui/endingView.js`. Slice E updated `story.js` so every E* entry has `background: 'assets/bg_endings.png'` — data now agrees with view.
- **`chatter_single.png` is authored but unused** by the live story graph. Kept in `/assets/` for possible future re-spec. Slice F can `git rm` it if it stays dead.
- **About modal** still a `window.alert`. Backlog.
- **Pause overlay has no focus trap**; acceptable for the classroom one-shot.

## Unresolved architectural questions

- **Transition overlay scope.** `.scene-transition` covers the full viewport including anything outside `#app`. Any future HUD that should survive transitions needs `z-index > 3000`, or the overlay selector must be scoped to `#app`.
- **S4 glitch vs centered sprites.** `@keyframes s4-glitch` sets `transform: translate(...)` on a full track, which would overwrite `translateX(-50%)` on a center-positioned sprite. S4 is right-positioned so the conflict doesn't land today. If S4 ever re-centers, either merge the centering into each keyframe or switch centering strategy (e.g. `margin: 0 auto` on a known sprite width).
- **Phone-glow runs continuously** while S1/S2 are mounted. No explicit teardown; the animation dies with the `<img>` on `unmount`. If a future slice wants ambient to pause behind the pause overlay, add `animation-play-state: paused` on `.pause-overlay ~ .scene[...]` or similar.
- **`isPauseOpen()` remains a `querySelector`-per-event.** Still fine. If an About modal or other overlay type lands, consolidate into `src/ui/overlayStack.js`.
- **Placeholder tile coupling to asset paths.** Still driven directly off `scene.background` / `scene.character.sprite`. Labels auto-update on rename.

## Next planned slice

**Slice F — Classroom build polish** (renamed from the old Slice E; see `docs/TASKS.md`).

1. Self-host Press Start 2P under `assets/fonts/` with a `@font-face` in `main.css` so `file://` without network reads pixel-art.
2. Manual smoke at the projector's resolution the class uses (confirm before presentation day).
3. Reduced-motion end-to-end verification (typewriter, caret, S4 glitch, choice press, `.is-revealed`, phone-glow, scene transitions).
4. README §"Running on presentation day" with the operator runbook.

Do NOT start Slice F in parallel with re-touching E. One slice at a time.

## Follow-ups discovered during Slice E

- **`chatter_single.png` decision** — keep for a possible future S6 re-spec, or drop. Defer until Slice F or a content iteration.
- **`bg_title.png` opacity (0.32)** — tune once the final art is judged against the logo at presentation resolution.
- **Ambient pause** — nothing pauses `phone-glow` when the pause overlay is up. Not a bug, but the "piece is paused" illusion is slightly weakened. One-line CSS fix when wanted.
- **Audible transition cue** — Slice F could consider a 200ms UI tick on scene change for one-handed classroom play. No audio infrastructure exists yet.
- **Palette lean re-review** — S5 0.6 opacity and S9 ghost-only chrome now sit on real art. Eyeball at the projector.
- **Sprite overflow on ultra-narrow** (<360px). The 50vh mobile cap was eyeballed; verify at 375px min per `.cursorrules`.
- **Per-ending backgrounds** — one-line flip in `endingView.js` if the design ever wants them (`scene.background || ENDING_BG`).
- **`scripts/validate-story.mjs`** — standalone CI/pre-commit validator still absent. The runtime dev-flag BFS in `story.js` covers the reachability invariant; a node-runnable script would also assert asset paths and BG/char/position wiring. Mild pain today, pre-commit hygiene tomorrow.

## Follow-ups still open from earlier slices

- **Focus trap in pause overlay** — logged from C.1; still deferred.
- **Caret width on narrow viewports** — C.1 follow-up; re-verify once projector font size is set in Slice F.
- **Overlay stack registry** — if About modal lands, unify `pause-overlay` + About under one registry.
- **Choice press 80ms cancellation** — `choiceLocked` blocks duplicates but the scheduled `onChoice` can't be cancelled mid-animation. Not a problem today.
- **Narration pacing** — Slice C.2's single-paragraph fade-in is the current design. Flag if an operator misses per-line advance.

## Discipline reminders (self)

- Finish one slice end-to-end before starting the next.
- Resolve narrative ambiguities by consulting `docs/story_spec.md`, not by inventing patterns.
- Verbatim transcription means verbatim. Any paraphrase is a bug.
- Small, descriptive commits. `feat(slice-x):` / `fix(…):` / `chore(…):` / `docs(…):` prefixes.
- Never rewrite code you didn't just touch unless the slice requires it.
- Keyboard-first affordances are a hard requirement (`.cursorrules` §Accessibility); verify on every new screen.
