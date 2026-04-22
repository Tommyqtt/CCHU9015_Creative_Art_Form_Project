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

## SLICE C — Visual polish and theme beats

- **status:** TODO
- **depends on:** Slice B
- **files touched (planned):** `styles/scene.css`, `styles/main.css`, possibly `src/ui/sceneView.js`

**Goal.** The scene reads as pixel-art and not as a wireframe. Caret blink on dialogue. Choice buttons have the pressed state from `.cursorrules`. S4's "glitch at final line" beat fires via `.scene[data-scene-id="S4"].is-final-line .scene__char` per `docs/story_spec.md` §S4 atmosphere. Palette leans apply per scene (S3 `--pink`, S5 `--ghost`, S7 `--amber`).

**Acceptance (planned).**
- [ ] Caret blink animation (paused under `prefers-reduced-motion`).
- [ ] Choice buttons gain a pressed 2px-down/right translate on `:active`.
- [ ] S4 sprite flicker fires once on entering the last dialogue line; no flicker on other scenes.
- [ ] Palette leans verified visually at S3, S4, S5, S7, S9.
- [ ] No ad-hoc hex values anywhere — palette tokens only.
- [ ] Pause overlay (Esc) shipped with a dismissible themed panel.

Note: Slice C used to be titled "wire engine, scene renderer, typewriter, keybindings" — all of that landed in Slice B, so the former Slice C contents are now closed. Slice C in this document is the *new* Slice C (visual polish + pause).

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
