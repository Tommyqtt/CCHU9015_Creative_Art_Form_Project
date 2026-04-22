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

<!-- Next slice appends below. -->
