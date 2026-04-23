# HANDOVER — "Subscribed"

> Single-file snapshot of current project state. **Overwritten at the end of every slice.** If you are resuming this project, read this first, then `docs/TASKS.md` and the latest block of `docs/INTEGRATION_LOG.md`.

**Last updated:** 2026-04-23, end of Slice F (audio + transitions + Scene 7 drama).

---

## Mode

**Single-agent.** One operator acts as planner, implementer, and integrator. Commits land directly on `main`.

## Current branch

`main`. Working tree clean after the Slice F commit. Last nine code commits (most recent first):
- `feat(slice-f): audio + transitions + scene 7 drama`
- `fix(slice-e): stop stage from being pushed up by typing dialogue`
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
- **Source (12 modules):**
  - `src/main.js` — boots on `DOMContentLoaded`, owns the title lifecycle, installs the engine lazily on first start. **Slice F added** `bootSessionChrome()` (audio toggle + progress dots), `bootContentNote()` (first-launch modal), and `body.dataset.screen` flipping (`'title'` / `'story'`); also dispatches a `state:reset` CustomEvent after reset so progress dots clear between playthroughs.
  - `src/state.js` — `state = { currentSceneId, history, visitedScenes: Set }`. Helpers: `reset()`, `recordVisit()`, deprecated `enterScene()`.
  - `src/story.js` — full 16-entry `STORY` (S1–S9 + E1–E7), deep-frozen. Unchanged since Slice E.
  - `src/engine.js` — `initEngine`, `renderScene`, `handleChoice`, `returnToTitle`, `typewriter`. **Slice F additions:** imports `playBlip` + `playTransition`; typewriter fires `playBlip()` every 3rd character; `runTransition` fires `playTransition()` at start of fade-out; `renderScene` adds `.is-s7-entry` to the freshly-mounted S7 `.scene` for 1000ms so dev-jumper re-entries retrigger CSS keyframes; dispatches `scene:rendered` CustomEvent after every mount (`detail: { id, type }`).
  - `src/audio.js` **(new in F)** — single AudioContext lazily built on first `play*` call. `playBlip()` = 800 Hz sine · 15 ms, `playChoiceSound()` = 500 Hz square · 30 ms, `playTransition()` = 1200 Hz band-passed decaying white-noise burst · 200 ms. Mute persists in localStorage (`audio:muted`); `onMuteChange` pub/sub lets UI re-subscribe. Document-level pointer/key/touch listener resumes a suspended context on user gesture. Tolerant of missing Web Audio and private-mode localStorage.
  - `src/ui/titleScreen.js` — unchanged since Slice E (bg_title painting + icon_heart corners).
  - `src/ui/sceneView.js` — **Slice F addition:** imports `playChoiceSound`; `commitChoice` fires it alongside `.is-pressed` at input time.
  - `src/ui/endingView.js` — unchanged since Slice C.2.
  - `src/ui/devJumper.js` — unchanged since Slice B.
  - `src/ui/pauseOverlay.js` — unchanged since Slice C.1.
  - `src/ui/audioToggle.js` **(new in F)** — top-right mute button. Reflects and toggles `audio.js` state; `aria-pressed` + `aria-label` announce the action, not the state.
  - `src/ui/progressDots.js` **(new in F)** — fixed top-centre row of 9 hollow circles (S1…S9). Listens to document-level `scene:rendered` + `state:reset` events, toggles `.is-visited` + `.is-current` per dot. Hidden on `body[data-screen="title"]`.
  - `src/ui/contentNote.js` **(new in F)** — one-shot first-launch modal. Shows if `localStorage.getItem('content-note:seen') !== 'true'`. Dismiss via Begin button or Esc; sets the flag on dismiss. No backdrop dismiss (consent gate).
- **Docs:** `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md` (this file).
- **Assets (16 on disk, referenced by name in `src/story.js` or `src/ui/titleScreen.js`):**
  - **Alex:** `alex_neutral.png`, `alex_phone.png`, `alex_anxious.png`, `alex_defeated.png`
  - **Mira (creator):** `creator_wave.png`, `creator_selfie.png`, `creator_kiss.png`
  - **Chatter:** `chatter_trio.png` (used on S7), `chatter_single.png` (authored but unreferenced)
  - **Backgrounds:** `bg_scene1_bedroom.png`, `bg_scene2_preview.png`, `bg_dm_chat.png`, `bg_scene7_split.png`, `bg_endings.png`
  - **Title decorations:** `bg_title.png`, `icon_heart.png`

## What works right now

- **First-launch content note.** On a fresh load (clean localStorage), an amber-framed pixel modal overlays the title with the content-note copy and a Begin button. Dismiss sets the flag; subsequent loads go straight to the title.
- **Title screen.** `bg_title.png` painting at 0.32 opacity, two `icon_heart.png` corner sprites, "SUBSCRIBED" logo. Enter / click Start triggers 300ms fade-to-black (with whoosh) into S1.
- **Session chrome.** Top-right **AUDIO ON / AUDIO OFF** button toggles mute (persists across reloads). Top-centre **9-dot progress row** lights cyan as scenes are visited; the current scene has a pink outline. Both hidden on the title (the dots via `body[data-screen="title"]`).
- **Scene transitions.** 150ms fade-out (+ `playTransition()` whoosh) → DOM swap → 150ms fade-in. Reduced-motion collapses to an instant cut and skips the whoosh. Stale transitions cancelled via `transitionToken`.
- **Scene flow.** Every S1–S8 + S9 renders authored pixel art at 65vh desktop / 50vh mobile. Speaker-coloured dialogue box, ~15ms/char typewriter with **blips every 3rd character** (muteable), click/Enter/Space to skip or advance, 1/2/3 for choices, 80ms press animation (+ `playChoiceSound()`).
- **Ending flow.** Every E1–E7 + S9 renders shared `bg_endings.png` card, typewritten uppercased title at 32px with caret, narration fades in, takeaway if authored fades in next, Replay + View my path.
- **Scene 7 entry drama.** Jumping or walking into S7 plays: 400ms shake on the `.scene` element, 200ms hue-rotate + invert glitch-strobe on the same element, 1s decaying red/cyan chromatic aberration on `.scene__bg`. Class auto-removes at 1000ms so dev-jumper re-entries re-fire.
- **Phone-glow ambient.** S1 / S2 backgrounds oscillate `filter: brightness(0.95 ↔ 1.0)` over 2s. Reduced-motion freezes it.
- **Return to title.** Closes pause overlay, resets state, dispatches `state:reset` (clears progress dots), flips body `data-screen`, fades to title.
- **Dev jumper.** Unchanged. z-index 1000; pause (2000), transition (3000), content note (2500) layer above as appropriate.
- **Pause overlay (Esc).** Works over scene + ending views. Backdrop resumes; panel clicks don't. No-op on title and on content note.
- **Caret blink.** Cyan block caret on dialogue + ending title.
- **S4 glitch beat.** On S4's final line, `creator_kiss` sprite flickers three times with hard-edged RGB offsets.
- **Per-scene palette leans.** S3 pink · S4 pink→amber · S5 ghost + 0.6 opacity · S7 amber · S9 ghost ending.
- **Reduced motion.** Typewriter synchronous (no per-char blips), caret static, S4 glitch off, `.is-revealed` snaps, phone-glow off, transitions off, S7 entry stripped, dot transitions off, audio-toggle press transform off. Static palette leans retained. **Audio cues still fire** — user uses the mute toggle for silence (see "Sound is not motion" in INTEGRATION_LOG).
- `npx serve .` and direct `file://` both continue to work.

## What's broken / blocked

- **S9 unreachable from S1** (flowchart pick S4.D3 → E5). Dev jumper reaches it. Its dot only fills via dev path.
- **S9 takeaway is empty** — hidden by endingView.
- **Ending ignores per-ending `scene.background`** — shared `bg_endings.png` by design.
- **`chatter_single.png` is authored but unused.** Kept in `/assets/` for possible future re-spec.
- **About modal** still a `window.alert`. Backlog.
- **Pause overlay has no focus trap.** Acceptable for classroom one-shot.
- **No pause cue.** Esc opens/closes pause silently. Noted in INTEGRATION_LOG tech debt.
- **No keyboard shortcut for mute.** Click-only. Backlog.

## Unresolved architectural questions

- **Transition overlay scope.** `.scene-transition` still covers the full viewport. Any future always-visible HUD needs `z-index > 3000` or the overlay selector scoped to `#app`.
- **S4 glitch vs centered sprites.** Unchanged from Slice E — S4 is right-positioned so safe today.
- **Phone-glow runs continuously** during pause overlay — atmosphere continues through pause. One-line fix if we want it to stop.
- **AudioContext on iOS/Safari.** `ctx.resume()` is wired into pointer/key/touch. Not yet smoked on iOS Safari specifically; if the first whoosh is silent on that platform, wire an explicit resume call into the content-note dismiss path.
- **Progress dots include S9.** Given S9 is orphaned, the 9th dot only lights via dev jumper. Acceptable for now; trim to 8 dots if S9 stays orphaned long-term.
- **`scene:rendered` event has no unsubscribe convention documented.** `progressDots.unmount()` cleans up its listener, but any future subscriber must also remove its listener on teardown. Lightweight convention — document in a future slice if more subscribers land.

## Next planned slice

**Slice G — Classroom build polish** (renamed from the old Slice E, then Slice F; see `docs/TASKS.md`).

1. Self-host Press Start 2P under `assets/fonts/` with `@font-face` in `main.css` so `file://` without network reads pixel-art.
2. Manual smoke at the projector's resolution the class uses (confirm before presentation day).
3. Reduced-motion end-to-end verification (typewriter, caret, S4 glitch, `.is-pressed`, `.is-revealed`, phone-glow, transitions, S7 drama, audio optional via mute toggle).
4. Audio levels on the classroom projector's output — re-check blip / choice / whoosh peaks.
5. README §"Running on presentation day" with operator runbook (including content-note reset: `localStorage.removeItem('content-note:seen')`).

Do NOT start Slice G in parallel with re-touching F. One slice at a time.

## Follow-ups discovered during Slice F

- **Pause cue.** Opening / closing the pause overlay is silent. A subtle tick matching the choice cue's affordance would match audio language. Deferred.
- **Keyboard mute shortcut (M).** Low-cost addition once Slice G's keybinding audit is done.
- **Ambient music bed.** Optional looping layer, muteable via the same toggle. Backlog.
- **Reset content note during demo.** The runbook should include `localStorage.removeItem('content-note:seen')` to re-trigger the modal for each demo run.
- **iOS Safari AudioContext smoke.** Not yet verified; if broken, add explicit `ctx.resume()` on content-note Begin.

## Follow-ups still open from earlier slices

- **Focus trap in pause overlay** — logged from C.1.
- **Caret width on narrow viewports** — C.1 follow-up; verify at projector font size in Slice G.
- **Overlay stack registry** — if About modal lands, unify pause + content note + About under one registry.
- **Choice press 80ms cancellation** — `choiceLocked` blocks duplicates but the scheduled `onChoice` can't be cancelled.
- **Narration pacing** — Slice C.2's single-paragraph fade-in is current design.
- **`chatter_single.png`** — drop or keep? Defer.
- **`bg_title.png` opacity (0.32)** — tune at presentation resolution.
- **Ambient pause.** Nothing pauses `phone-glow` or audio when pause overlay is up.
- **Palette lean re-review** — eyeball S5 0.6 and S9 ghost-only at projector.
- **Sprite overflow on ultra-narrow** (<360px).
- **Per-ending backgrounds** — one-line flip in `endingView.js` if wanted.
- **`scripts/validate-story.mjs`** — standalone CI/pre-commit validator still absent.

## Discipline reminders (self)

- Finish one slice end-to-end before starting the next.
- Resolve narrative ambiguities by consulting `docs/story_spec.md`, not by inventing patterns.
- Verbatim transcription means verbatim. Any paraphrase is a bug.
- Small, descriptive commits. `feat(slice-x):` / `fix(…):` / `chore(…):` / `docs(…):` prefixes.
- Never rewrite code you didn't just touch unless the slice requires it.
- Keyboard-first affordances are a hard requirement (`.cursorrules` §Accessibility); verify on every new screen.
- Sound is not motion. Reduced-motion strips animations; mute toggle strips audio. Treat them as orthogonal axes.
