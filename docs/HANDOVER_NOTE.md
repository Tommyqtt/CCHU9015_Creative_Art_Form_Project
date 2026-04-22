# HANDOVER — "Subscribed"

> Single-file snapshot of current project state. **Overwritten at the end of every slice.** If you are resuming this project, read this first, then `docs/TASKS.md` and the latest block of `docs/INTEGRATION_LOG.md`.

**Last updated:** 2026-04-22, end of Slice B.

---

## Mode

**Single-agent.** One operator acts as planner, implementer, and integrator. Commits land directly on `main`.

## Current branch

`main`. Working tree clean after the Slice B commit. Last two code commits: `feat(slice-a): scaffold + title screen`, `feat(slice-b): story data + engine with dev jumper`.

## What exists on `main`

- **Rules & specs:** `.cursorrules`, `CLAUDE.md`, `docs/story_spec.md`, `docs/story line tree diagram.png`, `docs/script.pptx`.
- **Entry + CSS:** `index.html`, `styles/reset.css`, `styles/main.css`, `styles/scene.css`.
- **Source:**
  - `src/main.js` — boots on `DOMContentLoaded`, owns the title lifecycle, installs the engine lazily on first start, mounts the dev jumper when `localStorage.getItem('dev')==='true'`.
  - `src/state.js` — `state = { currentSceneId, history, visitedScenes: Set }`. Helpers: `reset()`, `recordVisit(id)`, and a deprecated `enterScene(id)` alias.
  - `src/story.js` — full 16-entry `STORY` (S1–S9 + E1–E7), deep-frozen. Dev-flag-gated BFS at the module bottom logs reachability.
  - `src/engine.js` — `initEngine(el, hooks)`, `renderScene(id)`, `handleChoice(choice)`, `returnToTitle()`, and a real `typewriter(el, text, speed=30)` that returns a Promise with a `.skip()` method.
  - `src/ui/titleScreen.js` — "SUBSCRIBED" title card (unchanged since Slice A).
  - `src/ui/sceneView.js` — renders `type==='scene'`: bg, char sprite, speaker label, typewriter text, choice list. Click / Enter / Space advances or skips; 1/2/3 select choices.
  - `src/ui/endingView.js` — renders `type==='ending'`: bg, optional char, narration typewriter, reveals takeaway + "Return to title" button when narration finishes.
  - `src/ui/devJumper.js` — bottom-right pixel panel with a dropdown of all 16 ids + "Jump" button.
- **Docs:** `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md` (this file).
- **Assets:** `assets/alex_neutral.png`, `assets/alex_phone.png`, `assets/alex_anxious.png`, `assets/alex_defeated.png`. All referenced from `src/story.js` as stand-ins.
- **README.md.**

## What works right now

- Title screen renders as before. Pressing **Start** (click or Enter) enters `S1`.
- **Scene flow.** Dialogue types character-by-character at ~30ms/char. Clicking (or Enter/Space) while typing completes the current line; a second press advances to the next line. When all lines are typed, choice buttons fade in (the first gets keyboard focus). Pressing `1`, `2`, or `3` picks the matching choice.
- **Ending flow.** Narration types the same way. When narration finishes, the CCHU9015 takeaway reveals alongside a "Return to title" button (gets keyboard focus). Enter activates the button.
- **Return to title** resets `state` and re-mounts the title screen.
- **Dev jumper.** Paste `localStorage.setItem('dev','true')` in devtools and reload. A small amber-bordered panel appears bottom-right. Pick any id from the dropdown and click Jump — works from the title, from inside a scene, from inside an ending. Keydown shortcuts inside scenes explicitly ignore events originating within `.dev-jumper`, so clicking the dropdown never triggers "advance".
- **Console on boot.** Clean. When dev flag is on, a single `[story] reachable from S1: 15/16 · orphans: S9` info log fires (expected; see below).
- **Reduced motion.** `prefers-reduced-motion: reduce` collapses the typewriter to a synchronous full-text write.
- `npx serve .` and direct `file://` both continue to work. (Still requires network for Press Start 2P; self-hosting is a Slice E follow-up.)

## What's broken / blocked

- **No art.** Every `assets/bg_*.png` and `assets/mira.png` 404s. Load-error handlers hide broken-image icons, so the scene just shows the navy chrome. Slice D ships the art.
- **No pause / Esc overlay.** Pressing Esc does nothing. Pause lands in Slice C along with the visual polish beats.
- **S9 unreachable from S1.** This is the user-approved consequence of the flowchart pick (S4.D3 → E5 instead of the spec's S9). Dev jumper still reaches it; the reachability check expects exactly `[S9]` as the orphan set and flags anything else.
- **S9 takeaway is empty.** Spec does not author a CCHU9015 one-liner for S9. Ending view hides the takeaway element when empty but still shows the return button.
- **About modal** is still a `window.alert`. Scheduled for Slice C or later.

## Unresolved architectural questions

- **ORCHESTRATION §3 contracts** remain un-re-introduced post-reset. The scene shape is now pinned in the module-header comment of `src/story.js` and the `ctx` contract (`onChoice` / `onReturnToTitle`) lives in `src/engine.js` and is echoed in the view modules. If a thin `docs/ORCHESTRATION.md` is wanted back, grep those two header blocks — they are the source of truth.
- **Where does engine state live?** Resolved for Slice B: shared store in `src/state.js`; engine writes via `recordVisit()`; views only read if/when needed (they don't, in Slice B — all needed data is passed in the `scene` argument). Revisit if pause/save state is added.
- **Typewriter return type.** The current shape is `Promise & { skip() }`. Works, but "augmenting a Promise with a method" is slightly unusual. Alternative: return `{ done: Promise, skip() }`. If that lands in Slice C, `sceneView.js` and `endingView.js` both need the same change; keep them in sync.

## Next planned slice

**Slice C — Visual polish and theme beats** (~45–60 min).

1. Caret blink on the active dialogue line (hide under reduced-motion).
2. Pressed-state for `.btn` and `.scene__choice` (2px translate + drop shadow).
3. S4-specific glitch: toggle `is-final-line` on the scene element when the last dialogue line starts; a CSS rule keyed off `[data-scene-id="S4"].is-final-line .scene__char` does the flicker.
4. Per-scene palette leans (S3 `--pink`, S5 `--ghost`, S7 `--amber`, S9 `--ghost`) via `.scene[data-scene-id="..."]` rules.
5. Pause overlay on Esc. Dismissable. Contains "Resume" + "Return to title".

Do NOT start Slice D (assets) in parallel with Slice C unless the operator explicitly wants to context-switch. One slice at a time until it's stable.

## Follow-ups discovered during Slice B

- **Runtime validator** — the BFS at the bottom of `src/story.js` only runs under the dev flag. A standalone `scripts/validate-story.mjs` would catch drift in CI / pre-commit.
- **Keyboard shortcut leak risk** — each view registers a document-level `keydown` handler on mount and removes it on unmount. If a future slice adds a view that forgets to unmount, two handlers will run in parallel. Consider a tiny `src/ui/keybindings.js` that centralises this.
- **`mira.png` doesn't exist yet** — confirm during Slice D whether we ship one sprite + pose CSS filters, or four separate PNGs (`mira_idle`, `mira_happy`, `mira_sad`, `mira_glitch`).
- **S9 copy on the ending view** — currently labelled `"S9 · The Wounded Exit"` and shows two narration lines with no takeaway. If the presentation design wants a terminal title card for S9 that reads differently from the other endings, the divergence lives in `src/ui/endingView.js` (currently the same component).
- **Choice buttons don't scroll into view on small heights.** If the choice list overflows on narrow windows, the player won't see all three options. Slice C should add an `overflow-y: auto` cap.
- **Dev flag rebind** — setting `localStorage.setItem('dev','true')` requires a page reload to show the jumper. Acceptable for now; if we ever want hot-toggling, watch `storage` events in `main.js`.

## Discipline reminders (self)

- Finish one slice end-to-end before starting the next.
- Resolve narrative ambiguities by consulting `docs/story_spec.md`, not by inventing patterns.
- Verbatim transcription means verbatim. Any paraphrase is a bug.
- Small, descriptive commits. `feat(slice-x):` / `fix(…):` / `docs(…):` prefixes.
- Never rewrite code you didn't just touch unless the slice requires it.
- Keyboard-first affordances are a hard requirement (`.cursorrules` §Accessibility); verify on every new screen.
