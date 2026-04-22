# INTEGRATION LOG — "Subscribed"

> Append-only. One block per slice merged to `main`. Never rewrite past entries; if a later merge invalidates a note, add a new entry that supersedes it.

---

## 2026-04-22T15:30:00Z — Slice A: scaffold + title screen
- **files changed:**
  `index.html`,
  `styles/reset.css`, `styles/main.css`, `styles/scene.css`,
  `src/main.js`, `src/story.js`, `src/engine.js`, `src/state.js`,
  `src/ui/titleScreen.js`, `src/ui/sceneView.js`,
  `README.md`,
  `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`
- **tests:**
  - `node --check` on every JS module ✓
  - import-graph smoke (`node --input-type=module` resolves `./src/state.js`, `./src/story.js`, `./src/engine.js`) ✓
  - Class-name cross-check: every `class=` emitted by `src/ui/*.js` has a matching rule in `styles/scene.css` ✓
  - Manual browser smoke (expected, not yet run by operator): title card visible in Press Start 2P; Start click swaps screens; Enter key also starts; Chrome/Safari/Firefox console clean.
- **notes / tech debt:**
  - The repo was git-reset from Slice-1 state back to commit `e2dea9f` to start Slice A clean (DECISIONS #001 in the previous session is now historical). Orphaned commits remain in reflog until GC.
  - `src/engine.js` ships three intentional stubs (`renderScene`, `handleChoice`, `typewriter`). Each logs a `console.warn` when called. These warnings are expected during Slice-A smoke; Slice C will replace them with real implementations.
  - `src/story.js` exports `STORY = Object.freeze({})`. Do not read from STORY's contents until Slice B lands — the shape is not yet guaranteed.
  - `docs/ORCHESTRATION.md` from the pre-reset session no longer exists on disk. Its §3.1 / §3.2 / §3.3 contracts will be re-derived from `.cursorrules` + `docs/story_spec.md` during Slice C. If the full ORCHESTRATION doc is wanted back, it can be recovered from git reflog (`29e94a9`).
  - Title-screen "About" button currently uses `window.alert`; replace with a themed overlay in Slice D or later.
  - Keyboard shortcut `Enter` on the title screen triggers Start globally while mounted; the scene-view placeholder does not yet listen for any keys (Slice C will add the 1/2/3 bindings).

---

## 2026-04-22T18:00:00Z — Slice B: story data + engine with dev jumper
- **files changed:**
  `src/story.js`        (empty stub → full 16-entry STORY + dev-only BFS reachability check),
  `src/state.js`        (added `visitedScenes: Set<string>` + `recordVisit()`; `reset()` clears it),
  `src/engine.js`       (three stubs → real `initEngine`, `renderScene`, `handleChoice`, `returnToTitle`, `typewriter`),
  `src/ui/sceneView.js` (placeholder → real renderer: bg / char / speaker / typewriter text / choices + 1/2/3 keys + click-to-skip/advance),
  `src/ui/endingView.js` **(new)** (narration typewriter + takeaway reveal + "Return to title" button),
  `src/ui/devJumper.js` **(new)** (dropdown + "Jump" button; gated on `localStorage.getItem('dev')==='true'`),
  `src/main.js`         (owns title lifecycle only; wires Start → `jumpTo('S1')` which lazily inits engine; mounts dev jumper on boot when flag is set),
  `styles/scene.css`    (added speaker colouring, choice buttons, ending view layout, dev-jumper panel; kept Slice-A title + scene shell rules),
  `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

- **user-approved deviations from spec (flagged during planning):**
  - **S4 choice 3 → E5** (not S9). User's flowchart pick overrides the `story_spec.md` matrix. S9 remains defined and reachable via the dev jumper; the runtime BFS now expects exactly `['S9']` as orphans and only errors on *unexpected* orphans.
  - **Character sprites** — every scene temporarily reuses one of the existing `alex_*.png` sprites. Each reuse is commented `// TODO(slice-e): ...` in `src/story.js` so the follow-up is greppable. Missing `mira.png` is not referenced by the code (so no broken-image icons), and `<img>` load-error handlers hide any other missing asset.
  - **Choice IDs** use scene-prefixed scheme (`S1_1`, `S1_2`, ...) to avoid collision with scene ids on S5 (which in the user's prompt had choice ids `E1`/`E2`).
  - **Ending backgrounds** follow the spec's reuse pattern (E1 reuses S1 bg, E2 reuses S5 bg, etc.) at flatter filenames `assets/bg_<slug>.png`.
  - **Quotes** are straight ASCII everywhere (matches spec grep); em-dashes (`\u2014`) preserved verbatim.

- **tests:**
  - `node --check` on every JS module (8 files) ✓
  - STORY invariant smoke: 16 keys match `[S1..S9, E1..E7]`, 8 scenes + 8 endings, every `choice.next` resolves, every scene has non-empty dialogue, every ending has narration + string takeaway ✓
  - Reachability BFS from `S1` = 15/16 · orphans `[S9]` ✓ (matches user-approved flowchart pick)
  - `typewriter()` headless: speed=0 sync write ✓, skip-immediate ✓, natural completion ✓, skip-after-done no-throw ✓
  - Engine export surface: `{initEngine, renderScene, handleChoice, returnToTitle, typewriter}` all present ✓
  - Class-name cross-check (35 tokens emitted by JS → all present among 50 CSS tokens) ✓
  - Verbatim spot checks against `docs/story_spec.md`: S1.dialogue[0], S1.dialogue[1], S1.choices[2].label, S4.choices[0].label, S4.choices[2].next, S7.dialogue[1].note, E1.takeaway, E5.narration[0].text, S9.takeaway ✓
  - HTTP smoke via running `npx serve .`: `/`, `src/story.js`, `src/engine.js`, `src/ui/endingView.js`, `src/ui/devJumper.js`, `styles/scene.css` all 200 ✓
  - Manual browser smoke (operator to run): title → Start → S1 typewriter → click through → reach ending → takeaway visible → Return to title works. `localStorage.setItem('dev','true')` + reload → dev jumper visible, jumping from title lands scene/ending cleanly.

- **notes / tech debt:**
  - **S9 unreachable from S1** is a deliberate consequence of the flowchart_e5 decision. The runtime BFS logs S9 as an expected orphan and only flags unexpected orphans. If the flowchart reverts to the spec (S4.D3 → S9), update the `expectedOrphans` set in `src/story.js` and Slice-B acceptance line 3 in `TASKS.md`.
  - **S9 takeaway is empty** because the spec does not author a CCHU9015 thematic takeaway for S9. Endings with empty takeaway hide the takeaway element but still show the return button.
  - **Mira assets are placeholder.** Every scene points at one of `alex_phone.png` / `alex_neutral.png` / `alex_anxious.png` / `alex_defeated.png`. Slice D draws Mira and swaps paths. Grep `TODO(slice-e)` in `src/story.js` to see the 13 sites.
  - **Backgrounds don't exist yet** — every `bg_*.png` 404s. CSS `.scene__bg.is-hidden` fires via `<img>` `error` handler so the broken-image icon never flashes. Slice D produces the art.
  - **Typewriter skip-Promise shape.** `typewriter()` returns a Promise with a `.skip()` method attached (so callers can `await` and also skip). This departs slightly from the canonical "Promise or object-with-promise" split; the tests cover both paths.
  - **Dev jumper Jump from title** works because `main.js#jumpTo` unmounts the title screen (removing its Enter listener) before asking the engine to render. If a future screen type is added outside main.js, mirror this unmount-first discipline.
  - **Pause / Esc** is still not implemented. Slice C will add it with the themed overlay.
  - **Global keydown listener** — each scene-view mount installs a document-level `keydown` listener and removes it on unmount. The swap order in `engine.renderScene` is `unmount-old → recordVisit → mount-new` so the listener count stays at 1.
  - **No linter.** `.cursorrules` forbids linter-as-dependency. Rely on `node --check` + the class-name cross-check script in this log as the quality gate.

---

## 2026-04-23T00:00:00Z — chore: tune typewriter default to 15ms
- **files changed:** `src/engine.js`
- **notes:** Operator feedback during Slice B smoke judged 30ms/char too slow for ~300-char lines in S4/S7. Introduced `DEFAULT_TYPE_SPEED_MS = 15` at the top of `src/engine.js` and threaded it through `typewriter(el, text, speed = DEFAULT_TYPE_SPEED_MS)`. Documented as a conscious override of `.cursorrules` §Dialogue at the declaration site.

---

## 2026-04-23T00:30:00Z — Slice C: visual polish + pause overlay
- **files changed:**
  `src/engine.js`           (Esc-handled pause toggle; `installEscListener()`, `openPause()`, `closePause()`; `returnToTitle()` + `renderScene()` now also `closePause()`),
  `src/ui/sceneView.js`     (add `.is-typing` on text at line start / remove on advance + choice reveal; add `.is-final-line` on sceneEl when starting the last dialogue line; skip keyboard + click handlers while pause overlay is in the DOM),
  `src/ui/endingView.js`    (same `.is-typing` toggle on narration; pause-overlay skip),
  `src/ui/pauseOverlay.js`  **(new)** — role="dialog" aria-modal panel with **Resume** + **Return to title** + Esc hint; backdrop click = resume; panel clicks don't bubble,
  `styles/scene.css`        (caret blink, `.scene__choice:active` pink lean, S4 `.is-final-line` glitch keyframes, per-scene palette leans for S3 / S4 / S5 / S7 / S9, pause-overlay styles; reduced-motion rules strip caret animation + S4 glitch),
  `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

- **design choices:**
  - **Engine owns the Esc toggle.** Installed in `initEngine()` (idempotent via `escInstalled` guard) so a single listener lives for the lifetime of the app. Scene/ending views do NOT listen for Esc — that would duplicate the handler and race the toggle. Views instead skip their own keys/clicks when `document.querySelector('.pause-overlay')` returns non-null.
  - **Caret is CSS-only**, driven by the presence of `.is-typing` on the text element. No per-frame JS. Blinks at `900ms steps(2, end) infinite`; reduced-motion collapses the animation and pins opacity to 1 (still visible, just not blinking).
  - **S4 glitch is a short burst**, not an infinite animation: `120ms steps(4, end) 3` — three staccato frames, then settles. Drop-shadows are hard-edged (0 blur) per `.cursorrules` pixel-art discipline.
  - **S5 lean mutes `.scene__text` to `--ghost`.** Ghost (#7a7f9a) on navy still meets WCAG AA at 12px (~4.8:1). The atmosphere spec explicitly asks for "reduced contrast" to suggest distance; skip-to-end is still one click away.
  - **S9 selector targets `.ending`** (not `.scene`) because S9's STORY entry is `type: 'ending'` — the ending view is what mounts.
  - **Pause overlay coexists with the dev jumper.** The dev jumper sits at `z-index: 1000`; the overlay at `z-index: 2000`. Overlay backdrop clicks resume; panel clicks are `stopPropagation()`'d so they don't count as a backdrop-dismiss.

- **user-approved deviations:**
  - None for Slice C beyond the already-approved Slice-B decisions. The 15ms typewriter tuning committed before Slice C is tracked as its own chore commit (see entry above).

- **tests:**
  - `node --check` on every JS module, including the new `src/ui/pauseOverlay.js` (9 files) ✓
  - STORY invariant re-run: 16 keys, BFS from S1 reaches 15/16 · orphans `[S9]` ✓ (unchanged from Slice B; just confirming no regression)
  - Class-name cross-check: every class emitted by `src/**/*.js` (`classList.*` + `className = ...`) has a matching `.token` in the combined CSS. 43 JS classes → all matched among 48 CSS tokens. No dangling classes. ✓
  - Manual browser smoke (operator to run): title → Start → S1 types with caret → click through to E1 → takeaway + Return; Esc at any point in S1–S8 opens pause → Resume restores focus → Esc again closes; "Return to title" from pause drops back to the title cleanly; jump to S4 with the dev jumper + advance to last line → sprite flickers three times; S3 reads pink, S5 reads ghost, S7 reads amber; `localStorage.setItem('dev','true')` + reload still shows the dev jumper below the pause overlay (z-index discipline).

- **notes / tech debt:**
  - **Pause overlay does not trap focus.** Tab from the Return-to-title button can still reach underlying buttons (focus ring visible). For a one-shot classroom piece this is acceptable; if the piece ever ships beyond the presentation, add a focus trap in `pauseOverlay.js`.
  - **`.scene__text::after` caret is a solid block.** Looks crisp at 12px; on narrow viewports the 1em height might read as a line-height nudge. Watch this at the 375px min width during Slice E projector smoke.
  - **S5 character opacity of 0.6** applies to whatever sprite is loaded; once Mira art lands in Slice D the reduced-distance effect should re-read — review then.
  - **`isPauseOpen()` is queried per-event via `querySelector`.** Cheap at our scale but moves a tiny DOM read into the keyboard hot path. If we add more overlays (About modal, etc.) a shared `src/ui/overlayStack.js` registry would be cleaner.
  - **Reduced-motion only strips S4's glitch; it leaves the palette leans.** Intentional — palette leans are static colour + border changes, not motion.
  - **About modal is still a `window.alert`.** Not in Slice C scope; moved to backlog.

---

<!-- Next slice appends below. -->
