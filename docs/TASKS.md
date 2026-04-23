# TASKS — "Subscribed"

> Single-agent project. One operator. Commits land directly on `main`.
>
> **Status vocabulary:** `TODO` · `IN-PROGRESS` · `BLOCKED` · `DONE` · `REJECTED`
> Slices are thin vertical features (~30–60 min). One slice at a time; never start a second until the first is stable.

---

## SLICE A — Project scaffold and title screen

- **status:** DONE (2026-04-22)
- **commit:** see `docs/INTEGRATION_LOG.md` first entry
- **files touched:** `index.html`, `styles/reset.css`, `styles/main.css`, `styles/scene.css`, `src/main.js`, `src/story.js`, `src/engine.js`, `src/state.js`, `src/ui/titleScreen.js`, `src/ui/sceneView.js`, `README.md`, `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

**Goal.** Opening `index.html` shows a pixel-styled "SUBSCRIBED" title screen with working Start + About buttons. Start (click or Enter) swaps to a placeholder scene view.

---

## SLICE B — Story data + engine with dev jumper

- **status:** DONE (2026-04-22)
- **commit:** see `docs/INTEGRATION_LOG.md` (second entry)
- **files touched:** `src/story.js`, `src/state.js`, `src/engine.js`, `src/main.js`, `src/ui/sceneView.js`, `src/ui/endingView.js` (new), `src/ui/devJumper.js` (new), `styles/scene.css`, `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

**Goal.** Every scene S1–S9 and ending E1–E7 is reachable via the engine. Starting from the title screen reaches any ending by walking a branch. A dev-mode jumper (enabled via `localStorage.setItem('dev','true')`) can teleport to any scene id directly.

**Acceptance (all met).**
- [x] `Object.keys(STORY)` = 16, matching `[S1..S9, E1..E7]`.
- [x] Every `choice.next` resolves to a STORY key; no dangling pointers.
- [x] BFS from `S1` reaches 15/16 scenes. **S9 is a known orphan** under the user's flowchart pick (S4.D3 → E5); it remains defined and reachable via the dev jumper. The runtime BFS at the bottom of `src/story.js` only fires under the `dev` flag and logs `"[story] reachable from S1: 15/16 · orphans: S9"` as expected.
- [x] Title → Start → S1 → click through a branch reaches an ending, which shows narration + takeaway + "Return to title".
- [x] Dev jumper (bottom-right) lists every id; "Jump" calls `renderScene(id)` even from the title screen (main.js unmounts title first).
- [x] `state.history` records every scene entered (preserves re-visits); `state.visitedScenes` dedupes.
- [x] `typewriter()` respects `prefers-reduced-motion` (synchronous write) and returns a Promise with a `.skip()` method that jumps to the final text.
- [x] 1 / 2 / 3 keys pick the matching choice; Enter / Space / click advances dialogue; clicking a choice button fires `onChoice`.
- [x] No console errors on boot; only the dev-flag-gated `[story] reachable …` info log fires when the flag is enabled.
- [x] `node --check` passes on every JS module; class-name cross-check (JS emits → CSS rules) clean.
- [x] Verbatim spot-check across S1, S4, S7, E1, E5, S9 matches `docs/story_spec.md` byte-for-byte.

---

## SLICE C — Scene and ending rendering with choices

- **status:** DONE (2026-04-23)
- **commits:** see `docs/INTEGRATION_LOG.md` (third + fourth entries — C.1 "visual polish + pause overlay", C.2 "scene and ending rendering with choices")
- **files touched:** `src/engine.js`, `src/ui/sceneView.js`, `src/ui/endingView.js` **(rewritten in C.2)**, `src/ui/pauseOverlay.js` **(new in C.1)**, `styles/scene.css`, `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

**Goal.** Every scene S1–S8 renders a background layer, character sprite, speaker-coloured dialogue box, typewriter text, and clickable + keyboard-navigable choice buttons. Every ending E1–E7 + S9 renders a shared `bg_endings.png` background, a typewritten title, a fade-in narration paragraph, and **Replay** + **View my path** actions. Missing assets render as labelled placeholder tiles so Slice C can ship before Slice D/E deliver art. Slice C also ships the atmosphere beats for C.1: caret blink, S4 glitch, palette leans, Esc pause overlay.

**Acceptance (all met).**
- [x] **Scene rendering.** Background, character sprite, dialogue box, speaker tag (colour driven by `data-speaker`), typewriter at 15ms/char. Click / Enter / Space: skip current line or advance; at end of dialogue, choice buttons fade in.
- [x] **Choice buttons.** Pixel-styled 2px border, hover inverts to navy-on-cyan with a pink shadow, `:active` / `.is-pressed` scales to 0.95 + inverts. Prefixed with `1.` / `2.` / `3.`. Clicks and 1 / 2 / 3 keypresses both route through `commitChoice(idx)` which applies `.is-pressed` for 80ms before calling `engine.handleChoice(choice)`. Under reduced motion the 80ms delay collapses to 0.
- [x] **Keyboard.** Scene: 1 / 2 / 3 on choices, Enter / Space on dialogue. Ending: Enter / Space skips the title typewriter; Tab navigates Replay ↔ View my path. Esc anywhere in a mounted scene/ending opens the pause overlay.
- [x] **Typewriter respects `prefers-reduced-motion`.** Synchronous write at JS layer (from Slice B); caret animation stripped at CSS layer (from Slice C.1); fade-in reveals stripped (from Slice C.2); choice-press delay collapses to 0ms (from Slice C.2).
- [x] **Ending rendering.** Single `assets/bg_endings.png` behind every ending (placeholder tile until Slice D draws the art). Title typed letter-by-letter (`scene.title.toUpperCase()`) with a caret on the title element. Narration concatenated into one paragraph, fades in + nudges up after the title finishes. Takeaway (when authored) fades in next. **Replay** (resets state + returns to title) and **View my path** (opens a scrollable `state.history` list with `STORY`-sourced titles) both working. Close button on the path panel returns focus to "View my path".
- [x] **Placeholder handling.** Every `<img>` has a sibling placeholder `<div>` showing the missing asset path. On `load` the placeholder gets `.is-hidden`; on `error` the img gets `.is-hidden` and the placeholder stays visible. Applies to scene bg / scene char / ending bg.
- [x] **Visual polish (C.1).** Caret blink on active dialogue + ending title. S4 sprite glitch on `.is-final-line`. Palette leans for S3 pink / S4 pink→amber / S5 ghost+0.6 opacity / S7 amber / S9 ghost. Pause overlay (Esc) with Resume + Return to title.

Note: Slice C was originally titled "wire engine, scene renderer, typewriter, keybindings" (now all closed in Slice B). C.1 shipped visual polish + pause; C.2 expanded the render pipeline with placeholder handling, the 80ms press animation, and the final-screen ending rewrite with path viewer.

---

## SLICE D — Background + character art (asset authoring)

- **status:** DONE (2026-04-23) — folded into Slice E. All 16 PNGs (9 characters, 5 backgrounds, 2 optional) were authored before Slice E wired them, so there is no separate commit; the assets land in the same `feat(slice-e)` commit as the integration code.
- **files landed:** `assets/alex_anxious.png`, `alex_defeated.png`, `creator_kiss.png`, `creator_selfie.png`, `creator_wave.png`, `chatter_single.png`, `chatter_trio.png`, `bg_dm_chat.png`, `bg_endings.png`, `bg_scene1_bedroom.png`, `bg_scene2_preview.png`, `bg_scene7_split.png`, `bg_title.png`, `icon_heart.png` (new); `alex_neutral.png`, `alex_phone.png` (replaced with final-quality versions).
- Note: the original Slice D scope expected four Mira-specific poses. The final cast separates Mira's appearances into three creator sprites (`wave` / `selfie` / `kiss`) plus a `chatter_trio` overlay for the S7 reveal, which reads truer to the "inbox staffed in shifts" beat than a single performer in four moods.

---

## SLICE E — Integrate all pixel-art assets

- **status:** DONE (2026-04-23)
- **commit:** see `docs/INTEGRATION_LOG.md` (most recent entry)
- **files touched:** `src/story.js`, `src/engine.js`, `src/ui/titleScreen.js`, `styles/scene.css`, `assets/*.png` (see Slice D above), `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

**Goal.** Every scene and ending renders its authored pixel-art background + character sprite. Character sprites are placed according to a `left | center | right` position token; sprite height is 65vh on desktop, 50vh on narrow viewports. The title screen gains `bg_title.png` + two decorative `icon_heart.png` corner sprites. A 300ms fade-to-black wraps every `renderScene` DOM swap. S1 and S2 backgrounds get a subtle 2s phone-glow oscillation.

**Acceptance (all met).**
- [x] **STORY wiring.** `story.js` updated for S1 (`bg_scene1_bedroom` + `alex_phone` center), S2 (`bg_scene2_preview`, no character), S3/S6 (`bg_dm_chat` + `creator_wave` right), S4 (`bg_dm_chat` + `creator_kiss` right), S5/S8 (`bg_dm_chat` + `creator_selfie` right), S7 (`bg_scene7_split` + `chatter_trio` right overlay), S9 (`bg_dm_chat` + `alex_defeated` center). E1–E7 all use `bg_endings.png` (shared ending card; `endingView` ignores per-ending backgrounds by design).
- [x] **Character positioning.** `sceneView.js` already emits `data-position` on the sprite `<img>`; new CSS rules anchor left at 15%, right at 15%, center via `left: 50%` + `translateX(-50%)`. Sprite height `65vh` desktop, `50vh` mobile; `max-height` clamps inside the stage so the sprite never overlaps the dialogue box.
- [x] **Title screen.** `titleScreen.js` mounts `.title__bg` (`bg_title.png`, 0.32 opacity overlay) and two `.title__heart` corner sprites. Both have `error` handlers that hide the `<img>` on 404; the title card falls back to the Slice A navy layout unchanged.
- [x] **Scene transitions.** `engine.js` adds `runTransition(doSwap)`: a single `.scene-transition` `<div>` fades in (150ms) → DOM swap → fades out (150ms) = 300ms total. `transitionToken` cancels stale transitions if a new `renderScene` fires during an in-flight fade. Under `prefers-reduced-motion: reduce`, `runTransition` short-circuits to a synchronous swap (no fade).
- [x] **S1 / S2 phone-glow.** `@keyframes phone-glow` oscillates `filter: brightness(0.95 → 1.0)` over 2s, alternating. Scoped to `.scene[data-scene-id="S1"] .scene__bg` and `S2`. Reduced-motion strips the animation.
- [x] **Placeholder fallback still works.** Slice C.2's load/error-driven placeholder system is untouched. Any future missing asset still renders as a labelled navy tile instead of a broken-image icon.
- [x] **No regressions.** `node --check` on all 9 JS files: OK. Reachability invariant: 15/16 from S1 with S9 as the single expected orphan. Story asset-wiring validator (node eval) confirms all 17 assertions (9 BG + 8 char + 8 position).

---

## SLICE F — Audio feedback, transitions, and the Scene 7 glitch moment

- **status:** DONE (2026-04-23)
- **commit:** see `docs/INTEGRATION_LOG.md` (most recent entry)
- **files touched:** `src/audio.js` (new), `src/ui/audioToggle.js` (new), `src/ui/progressDots.js` (new), `src/ui/contentNote.js` (new), `src/engine.js`, `src/ui/sceneView.js`, `src/main.js`, `styles/scene.css`, `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

**Goal.** The piece gains a sonic pulse (typewriter blips, choice clicks, transition whooshes), the S7 "illusion shatters" beat reads emotionally (shake + glitch-strobe + chromatic aberration), a 9-dot progress row at the top of the viewport shows walked ground without spoiling what's ahead, and a first-launch content-note modal sets context once before letting the reader into the title screen.

**Acceptance (all met).**
- [x] **`src/audio.js`.** Single AudioContext lazily built on first `play*` call. `playBlip()` = 800 Hz sine · 15 ms attack/decay. `playChoiceSound()` = 500 Hz square · 30 ms. `playTransition()` = band-passed (1200 Hz, Q 0.7) decaying white-noise burst · 200 ms. Mute state persists in `localStorage` under `audio:muted`; `onMuteChange` lets UI resubscribe. Document-level pointer/key/touch listener resumes the context on first user gesture. Missing `AudioContext`, private-mode `localStorage`, and mid-render `ctx` failures all no-op silently.
- [x] **Typewriter blip.** `engine.typewriter` fires `playBlip()` on every 3rd character so long lines have a perceptible cadence without each letter clicking. No blips under `prefers-reduced-motion` (the typewriter writes synchronously, so the `i % 3 === 0` branch never hits).
- [x] **Choice click.** `sceneView.commitChoice` fires `playChoiceSound()` alongside the `.is-pressed` CSS press animation, at input time rather than at the end of the 80ms delay, so the click reads as responsive.
- [x] **Transition whoosh.** `engine.runTransition` fires `playTransition()` at the start of the fade-out, underneath the black flash. No sound under reduced-motion (the transition short-circuits to a synchronous swap before `playTransition` is reached).
- [x] **S7 dramatic entry.** `engine.renderScene` adds `.is-s7-entry` to the freshly-mounted S7 scene root when `id === 'S7'`, removed after 1000ms so dev-jumper re-entries retrigger. CSS keyframes: `s7-shake` (400ms translate on `.scene`), `s7-glitch-strobe` (200ms hue-rotate + invert on `.scene`), `s7-chromatic` (1s decaying red/cyan drop-shadow on `.scene__bg`). Reduced-motion strips every keyframe + resets `transform` / `filter`.
- [x] **Progress dots.** `src/ui/progressDots.js` renders a fixed, top-centre row of 9 dots (S1…S9). Hollow rings by default; `.is-visited` fills with cyan; `.is-current` adds a pink outline. Listens to document-level `scene:rendered` (dispatched by `engine.renderScene` after mount) and `state:reset` (dispatched by `main.showTitleScreen`). Hidden on `body[data-screen="title"]`.
- [x] **Audio toggle.** `src/ui/audioToggle.js` mounts a fixed top-right pixel button. Text mirrors state (`AUDIO ON` / `AUDIO OFF`); `aria-pressed` + `aria-label` announce the action. Click flips `toggleMute()`. Subscribes to `onMuteChange` so external mute changes keep the label in sync.
- [x] **Content note modal.** `src/ui/contentNote.js` shows a one-shot pixel-amber modal framed by the shared palette on first launch. Copy: "This game explores themes of loneliness, parasocial relationships, and performative intimacy. Click 'Begin' when ready." Dismiss paths: Begin button click or Esc key. `localStorage` key `content-note:seen` is set on first dismiss so the modal never returns. No backdrop dismiss (intentional consent gate).
- [x] **Reduced-motion discipline.** `@media (prefers-reduced-motion: reduce)` strips `s7-shake`, `s7-glitch-strobe`, `s7-chromatic`, `progress-dots__dot` transition, and `audio-toggle:active` transform. Audio cues still fire (sound is not motion); a user who wants silence uses the mute toggle.
- [x] **No regressions.** `node --check` on all 12 JS files: OK. JS-emitted class names (`progress-dots`, `progress-dots__dot`, `audio-toggle`, `content-note`, `content-note__*`, `is-s7-entry`, `is-visited`, `is-current`, `is-muted`) all resolve to CSS rules. Dev-server 200 OK on every new path. Existing Slice E placeholder + transition system untouched.

---

## SLICE G — Responsive layout + full accessibility pass

- **status:** DONE (2026-04-23)
- **commit:** `feat(slice-g): responsive layout + full a11y pass`
- **files touched:** `index.html`, `styles/main.css`, `styles/scene.css`, `src/story.js`, `src/engine.js`, `src/ui/sceneView.js`, `src/ui/endingView.js`, `src/ui/pauseOverlay.js`, `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

**Goal.** Fully playable at 375px mobile (stacked layout), fully playable keyboard-only, all ARIA wired, prefers-reduced-motion disables every animation, pause menu adds Mute/Credits/Restart/Close with focus trap.

**Acceptance (all met).**
- [x] **Desktop (≥1024px):** `#app` letterboxed 16:9, max 1600×900, centered by flexbox body. Body padding removed so the stage fills edge-to-edge.
- [x] **Tablet (768–1023px):** standard layout, tighter gutters (3×--px body padding).
- [x] **Mobile (<768px):** `.scene__stage` pulled out of absolute overlay; becomes top 50% flex child. Dialogue + choices fill the bottom 50%. Char sprite scales to 40% of stage height and repositions to `left: 5%` / `right: 5%`. Choice buttons full-width.
- [x] **Keyboard.** 1/2/3 choose (existing). Space/Enter advance or skip typewriter (existing). Esc opens/closes pause (existing). **New:** R = restart from title; M = toggle mute. Both added to `engine.js` global handler; guarded against pause-open state and input elements.
- [x] **ARIA.** `#app` has `role="application"` + `aria-label="Subscribed interactive story"` (removed old `aria-live`). Dialogue section already had `aria-live="polite"`. Choice buttons get `aria-label="Choice N: [label text]"`. All scene bg/char images get descriptive alt text from new `backgroundAlt` + `character.alt` fields in `story.js` (removed `aria-hidden="true"` from those images). Ending bg uses `scene.backgroundAlt` or a hardcoded fallback.
- [x] **Alt text.** `backgroundAlt` and `character.alt` fields added to all 8 scenes (S1–S8) and all 8 endings (S9, E1–E7) in `story.js`.
- [x] **Pause menu expanded.** 4 buttons: Resume, Mute/Unmute (live label via `onMuteChange`), Credits (toggles inline panel), Restart. Focus trapped: Tab/Shift+Tab cycle only through panel buttons. Backdrop click = Resume. Esc still handled globally by engine.
- [x] **prefers-reduced-motion.** Already comprehensive from Slices C–F. No new animated properties added in G.
- [x] **`node --check` on all modified JS modules:** OK.

---

## Follow-up backlog (not yet scheduled into slices)

- **About modal** — currently a `window.alert` in `titleScreen.js`. Replace with a dismissible themed overlay.
- **Return-to-title from inside a scene** — only reachable after an ending today. Consider exposing via Esc once the pause overlay lands in Slice C.
- **S9 orphan vs. S9 removed** — the user's flowchart pick (S4.D3 → E5) makes S9 unreachable from S1. If the flowchart ever reverts to the spec (S4.D3 → S9), update `src/story.js` and the reachability expectation in the log at the bottom of that file.
- **S9 takeaway** — left empty (`''`) per spec. If a CCHU9015 one-liner is authored, drop it into `STORY.S9.takeaway`.
- **`scripts/validate-story.mjs`** — the runtime dev-flag BFS in `story.js` is dev-only. A standalone node-runnable validator (same invariants: keys equal expected set, every `next` resolves, reachable set matches expectation) would catch data drift in CI/pre-commit.
- **Pose atlas** — Slice D will need `happy` / `sad` / `glitch` / `idle` distinguishable. Decide whether to draw four sprites or one sprite + CSS filter variations.
- **Ambient bed track** — Slice F ships blips / choice / whoosh / S7 drama; an optional looping ambient layer (muteable via the same toggle) would fill the dead air between dialogue beats.
- **Audio toggle keyboard shortcut** — currently click-only. A single-letter shortcut (M) would be cheap; needs a Slice-F-follow-up decision on whether to claim the key globally.
