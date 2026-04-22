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

**Acceptance (all met).**
- [x] `npx serve .` or opening `index.html` directly renders the title screen.
- [x] Title uses Press Start 2P (loaded via Google Fonts `<link>`).
- [x] Clicking Start swaps to the scene-view placeholder.
- [x] Enter anywhere on the title screen also starts.
- [x] No console errors on boot or on Start (the engine stubs log *warnings* on intentional invocation — those are expected and document the Slice-C wiring gap).

---

## SLICE B — Populate `STORY` from `story_spec.md`

- **status:** TODO
- **depends on:** Slice A
- **files touched (planned):** `src/story.js`

**Goal.** Replace `export const STORY = Object.freeze({})` with the 16 scene objects (S1–S9, E1–E7) keyed by scene id, shape per `docs/story_spec.md` and `docs/ORCHESTRATION.md` §3.1 (when re-introduced). All dialogue, choices, and ending epilogues transcribed verbatim from `docs/story_spec.md`. Whole object + every scene `Object.freeze`d.

**Acceptance (planned).**
- [ ] `Object.keys(STORY).sort()` deep-equals `["E1","E2","E3","E4","E5","E6","E7","S1","S2","S3","S4","S5","S6","S7","S8","S9"]`.
- [ ] Every scene has `id`, `title`, `background`, `character`, `characterPose`, `dialogue`, `choices`.
- [ ] Every non-ending scene has `choices.length >= 1` and every `choice.next` resolves to a STORY key.
- [ ] Every ending (`E1`–`E7`, `S9`) has `ending: true`, `choices.length === 0`, `epilogue.length > 0`.
- [ ] BFS from `S1` following `choice.next` reaches all 16 keys.
- [ ] `node --check src/story.js` passes.
- [ ] No paraphrasing — spec dialogue lands byte-for-byte.

---

## SLICE C — Wire engine, scene renderer, typewriter, keybindings

- **status:** TODO
- **depends on:** Slice A, Slice B
- **files touched (planned):** `src/engine.js`, `src/ui/sceneView.js`, `src/main.js`, possibly new `src/ui/typewriter.js`

**Goal.** Pressing Start on the title screen now enters `S1`, types the first dialogue line at ~30ms/char, lets the player advance with Click / Enter / Space, and renders choice buttons with 1/2/3 keyboard shortcuts. Transitions advance through the full tree; endings show their epilogue screen.

**Acceptance (planned).**
- [ ] `startGame()` (or equivalent) enters `S1` from `src/main.js` after title's onStart.
- [ ] Typewriter ~30ms/char; click-through completes current line; second advance moves to next line.
- [ ] `prefers-reduced-motion: reduce` prints full lines instantly.
- [ ] 1/2/3 pick the corresponding choice; Enter/Space advances; Esc toggles pause.
- [ ] Every choice's `next` transitions to the target scene.
- [ ] Ending scenes display their epilogue and stop accepting advances.
- [ ] Empty-dialogue ending scenes still reach `showEnding()` (guard against the known engine edge case).
- [ ] No direct DOM writes in `engine.js`; all DOM code lives in `src/ui/*`.
- [ ] Zero `innerHTML` assignments with story-derived strings.

---

## SLICE D — Visual polish and theme beats

- **status:** TODO
- **depends on:** Slice C
- **files touched (planned):** `styles/scene.css`, `styles/main.css`, possibly `src/ui/sceneView.js`

**Goal.** The scene reads as pixel-art and not as a wireframe. Dialogue-box caret blinks. Choice buttons have the pressed state from `.cursorrules`. S4's "glitch at final line" beat fires via `.scene[data-scene="S4"].is-final-line .scene__char` per `docs/story_spec.md` §Appendix. Warm/cool palette leans apply per scene (S3 `--pink`, S5 `--ghost`, S7 `--amber`).

**Acceptance (planned).**
- [ ] Caret blink animation (paused under `prefers-reduced-motion`).
- [ ] Choice buttons gain a pressed 2px-down/right translate on `:active`.
- [ ] S4 sprite flicker fires once on entering the last dialogue line; no flicker on other scenes.
- [ ] Palette leans verified visually at S3, S4, S5, S7, S9.
- [ ] No ad-hoc hex values anywhere — palette tokens only.

---

## SLICE E — Background + character art

- **status:** TODO
- **depends on:** none (can run in parallel with D once Slice C lands)
- **files touched (planned):** `assets/bg/*.png`, `assets/chars/mira.png`, possibly `src/story.js` (path updates)

**Goal.** The nine backgrounds named in `docs/story_spec.md` Appendix exist as pixel-art PNGs. Mira's sprite exists with `idle` / `happy` / `sad` / `glitch` poses (can be one sprite + CSS filter variations if drawing four poses is out of scope).

**Acceptance (planned).**
- [ ] `ls assets/bg/` shows nine PNGs matching spec filenames.
- [ ] `assets/chars/mira.png` exists.
- [ ] Every scene loads its background and sprite without a broken-image icon.
- [ ] Assets are pixel-art consistent (no blurry scale-ups, no anti-aliased edges).

---

## Follow-up backlog (not yet scheduled into slices)

- Pause overlay (Esc) — currently not implemented at all.
- Restart / return-to-title affordance from an ending screen.
- `scripts/validate-story.mjs` — node-runnable static check of STORY invariants (BFS, every choice.next resolves, every ending has epilogue). Helpful once Slice B lands.
- Classroom build checklist: font fallback confirmed without network; reduced-motion smoke; full-screen check on the presentation machine's resolution.
- About modal — currently a `window.alert`. Replace with a dismissable overlay in the same pixel theme.
