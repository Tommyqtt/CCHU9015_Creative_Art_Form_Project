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

<!-- Next slice appends below. -->
