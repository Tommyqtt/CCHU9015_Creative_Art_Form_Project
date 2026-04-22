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

## SLICE D — Background + character art

- **status:** TODO
- **depends on:** none (can run in parallel with C once C is underway)
- **files touched (planned):** `assets/bg_*.png` × 9, `assets/mira_*.png` × 4 poses, possibly `src/story.js` (sprite path swaps)

**Goal.** The nine backgrounds named in `src/story.js` exist as pixel-art PNGs. Mira's sprite exists with `idle` / `happy` / `sad` / `glitch` poses (can be one sprite + CSS filter variations if drawing four poses is out of scope).

**Acceptance (planned).**
- [ ] `assets/bg_bedroom_night.png`, `bedroom_night_after`, `phone_browser`, `phone_dm`, `phone_dm_warm`, `phone_dm_cool`, `phone_dm_idle`, `phone_dm_late`, `phone_dm_bleary` all exist as pixel PNGs.
- [ ] A Mira sprite exists (one file or per-pose) and `story.js` swaps off the Alex-`//TODO(slice-e)` stand-ins.
- [ ] Every scene loads its background and sprite without a broken-image icon.
- [ ] Assets are pixel-art consistent (no blurry scale-ups, no anti-aliased edges).

---

## SLICE E — Classroom build polish

- **status:** TODO
- **depends on:** C + D

**Goal.** The build is presentable on the classroom projector: full-screen layout at the projector's native resolution, font self-hosted so `file://` without network still reads pixel-art, smoke for reduced-motion, and a short operator runbook in `README.md`.

**Acceptance (planned).**
- [ ] Press Start 2P available at `assets/fonts/` with a font-face declaration in `main.css`.
- [ ] Manual check at the projector resolution the class uses (confirm before presentation day).
- [ ] Reduced-motion end-to-end (typewriter skips, caret blink removed) confirmed.
- [ ] README §"Running on presentation day" added.

---

## Follow-up backlog (not yet scheduled into slices)

- **About modal** — currently a `window.alert` in `titleScreen.js`. Replace with a dismissible themed overlay.
- **Return-to-title from inside a scene** — only reachable after an ending today. Consider exposing via Esc once the pause overlay lands in Slice C.
- **S9 orphan vs. S9 removed** — the user's flowchart pick (S4.D3 → E5) makes S9 unreachable from S1. If the flowchart ever reverts to the spec (S4.D3 → S9), update `src/story.js` and the reachability expectation in the log at the bottom of that file.
- **S9 takeaway** — left empty (`''`) per spec. If a CCHU9015 one-liner is authored, drop it into `STORY.S9.takeaway`.
- **`scripts/validate-story.mjs`** — the runtime dev-flag BFS in `story.js` is dev-only. A standalone node-runnable validator (same invariants: keys equal expected set, every `next` resolves, reachable set matches expectation) would catch data drift in CI/pre-commit.
- **Pose atlas** — Slice D will need `happy` / `sad` / `glitch` / `idle` distinguishable. Decide whether to draw four sprites or one sprite + CSS filter variations.
- **Audio** — spec doesn't require sound; consider a single ambient bed track and a keypress SFX, both optional.
