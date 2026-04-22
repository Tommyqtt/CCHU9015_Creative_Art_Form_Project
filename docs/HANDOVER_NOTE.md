# HANDOVER — "Subscribed"

> Single-file snapshot of current project state. **Overwritten at the end of every slice.** If you are resuming this project, read this first, then `docs/TASKS.md` and the latest block of `docs/INTEGRATION_LOG.md`.

**Last updated:** 2026-04-22, end of Slice A.

---

## Mode

**Single-agent.** One operator acts as planner, implementer, and integrator. Commits land directly on `main`.

## Current branch

`main`. Working tree clean. Last code commit: Slice A, `feat(slice-a): scaffold + title screen`.

## What exists on `main`

- **Rules & specs:** `.cursorrules`, `CLAUDE.md`, `docs/story_spec.md`, `docs/story line tree diagram.png`, `docs/script.pptx`.
- **Entry + CSS:** `index.html`, `styles/reset.css`, `styles/main.css`, `styles/scene.css`.
- **Source:**
  - `src/main.js` — boots on `DOMContentLoaded`, mounts title screen, swaps to scene view on Start.
  - `src/state.js` — `state = { currentSceneId, history }` plus `reset()` and `enterScene()`.
  - `src/story.js` — **empty** frozen `STORY = {}`. Slice B fills it.
  - `src/engine.js` — three stubs (`renderScene`, `handleChoice`, `typewriter`) that log warnings and no-op. Slice C replaces them.
  - `src/ui/titleScreen.js` — "SUBSCRIBED" title card, Start + About buttons, Enter-to-start.
  - `src/ui/sceneView.js` — placeholder scene layout with "Scene rendering coming in Slice C" copy.
- **Docs:** `docs/TASKS.md` (Slice A DONE; Slices B–E and a follow-up backlog), `docs/INTEGRATION_LOG.md` (first entry for Slice A), `docs/HANDOVER_NOTE.md` (this file).
- **Assets:** `assets/alex_neutral.png`, `assets/alex_phone.png` (neither yet referenced in code).
- **README.md.**

## What works right now

- Opening `index.html` via `file://` or `npx serve .` shows the title screen in Press Start 2P on a `--navy` background with `--cyan` / `--pink` accents.
- Clicking **Start** swaps the app root to the placeholder scene view.
- Pressing **Enter** on the title screen does the same (the button is focused on mount).
- **About** opens a minimal `window.alert` (temporary).
- Resizing down to ~375px width keeps the layout usable.
- Console is clean on boot; the only warnings appear if you manually call the engine stubs, which is expected.

## What's broken / blocked

- **No story yet.** `STORY` is empty; no dialogue can render. Slice B is the unblocker.
- **No engine.** `src/engine.js` is three stubs; advancing past the scene-view placeholder is not possible. Slice C is the unblocker.
- **No typewriter.** The stub just sets `textContent` synchronously when called.
- **No pause / back navigation.** Esc does nothing; there is no way to return to the title screen once on the scene placeholder. Intentional for Slice A.
- **No background art** under `assets/bg/`; **no Mira sprite** under `assets/chars/`. Scene layout hides broken images via CSS so nothing crashes. Slice E covers this.

## Unresolved architectural questions

- **ORCHESTRATION §3 contracts** (scene / view / class-name shapes) were dropped in the reset. Before Slice C lands the real engine, re-derive the scene shape from `docs/story_spec.md` and pin it in this file or re-introduce a thin `docs/ORCHESTRATION.md`. Risk if skipped: `src/engine.js` and `src/ui/sceneView.js` drift into conflicting assumptions about the view object.
- **Where does engine state live?** Currently `src/state.js` exposes a mutable module-scoped object. Slice C has to decide: engine-private state + public getters (last session's pattern), or keep `state.js` as the single shared store. Pick one consciously.

## Next planned slice

**Slice B — Populate `STORY` from `story_spec.md`** (~30–45 min, mechanical).

1. Re-pin the scene shape in comments at the top of `src/story.js` (adapt from `docs/story_spec.md` §"Reading this spec for src/story.js").
2. Transcribe S1–S9 and E1–E7 into the single `STORY` object, verbatim. Preserve speaker labels (`Narrator`, `Mira (DM)`, `Alex (internal)`, …). Endings + S9 carry `ending: true` and `epilogue`.
3. `Object.freeze` recursively.
4. Add a tiny smoke (inline node `--input-type=module`) that BFSes from `S1` and asserts all 16 keys are reachable.
5. Commit as `feat(slice-b): populate STORY from story_spec.md`.

Do NOT wire the engine in Slice B — engine is Slice C. Resist scope creep.

## Follow-ups discovered during Slice A

- **About modal** is a `window.alert`. Replace in Slice D polish.
- **Keyboard shortcut layer** currently lives on the title screen only. Slice C will need a global layer; consider whether it should live in `main.js` or in a new `src/ui/keybindings.js`.
- **`scripts/validate-story.mjs`** (referenced in older notes) does not exist. Low priority until Slice B lands, then useful.
- **Font fallback:** the project requires `file://` to work without a network. Press Start 2P is loaded from Google Fonts; when offline, the fallback is `ui-monospace, "Courier New", monospace`. Verified to render legibly but breaks the pixel-art aesthetic. Consider self-hosting the font under `assets/fonts/` in a later slice.

## Discipline reminders (self)

- Finish one slice end-to-end before starting the next.
- Resolve narrative ambiguities by consulting `docs/story_spec.md`, not by inventing patterns.
- Small, descriptive commits. `feat(slice-x):` / `fix(…):` / `docs(…):` prefixes.
- Never rewrite code you didn't just touch unless the slice requires it.
- Keyboard-first affordances are a hard requirement (`.cursorrules` §Accessibility); verify on every new screen.
