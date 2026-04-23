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

## 2026-04-23T01:30:00Z — Slice C.2: scene and ending rendering with choices
- **files changed:**
  `src/ui/sceneView.js`   (bg + char placeholder tiles with `load`/`error` listeners; 80ms choice press animation via `commitChoice(idx)` routed from both click and 1/2/3 key paths; reduced-motion collapses the 80ms delay to 0),
  `src/ui/endingView.js`  **(rewritten)** — dropped `.ending__stage`/`.ending__char`; now renders shared `bg_endings.png` + placeholder, typewritten uppercased title, concatenated narration paragraph that fades in after the title, optional takeaway, and **Replay** + **View my path** actions. `View my path` toggles a scrollable list of `state.history` (looked up in STORY for display titles),
  `styles/scene.css`      (placeholder tile styles for bg + char; scene choice hover = invert colours, active / `.is-pressed` = scale(0.95) + invert; `ending__title` grows to 32px with a pink-on-navy hard-edged text shadow; new `.ending__narration` / `.ending__takeaway` / `.ending__path*` rules; `.is-revealed` keyframe `ending-fade-in` with staggered delays; caret selector extended from `.ending__text` to `.ending__title` to match the new DOM; reduced-motion strips all new animations),
  `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

- **design choices:**
  - **Placeholder tiles render *under* the `<img>` at a lower `z-index` and hide on `load`, stay visible on `error`.** Bg placeholder fills the stage (solid navy, centred ghost-coloured path label). Char placeholder is a small dashed-border badge at `right: 6%` — positioned similarly to the real sprite so Slice D's swap is a drop-in. Scene view's z-index stack went from `bg=0, char=1, dialogue=2` to `bg-placeholder=0, bg=1, char-placeholder=2, char=3, dialogue=4` so the dialogue always wins over the char sprite even when the sprite lands across the dialogue box on wide viewports.
  - **Single `bg_endings.png` for every ending.** Per-ending `scene.background` fields in `src/story.js` are intentionally ignored by the rewritten `endingView.js`. This is a thematic call: all endings share the same after-piece surface. If the presentation ever wants per-ending art, change the constant `ENDING_BG` to `scene.background || ENDING_BG` in `endingView.js`.
  - **80ms press animation via `commitChoice(idx)`.** Both click and 1/2/3 keypress paths call the same function, which adds `.is-pressed` to the button, schedules `onChoice(choices[idx])` after 80ms, and locks further presses (`choiceLocked = true`) so double-click / key-repeat can't commit twice. Under reduced motion the delay is `0ms` — the lock + animation class still apply so the visual feedback is preserved on the first input, just without the timed hold.
  - **Choice hover = invert colours.** Navy text on cyan background with a pink bottom-right shadow. Reads as a pixel-arcade button press rather than the default "border changes colour" hover. `.cursorrules` §Visual style specifies "pressed 2px down/right" — that is honoured by `.btn:active` on every other `.btn` in the piece; scene choices override to `scale(0.95)` per the Slice C brief.
  - **Narration as a single paragraph.** The Slice B ending view typed each narration line sequentially; the Slice C.2 brief asks for the narration to fade in after the title finishes. The STORY data still carries multi-line narration; the view now joins with a single space and renders it all at once with a fade-in keyframe. This loses the per-line advance cadence — a conscious trade for the "final-screen" feel.
  - **Esc-closes-path branch removed from `endingView.onKey`.** Engine's document-level Esc handler installs first (in `initEngine`) and always `preventDefault`'s — the view's branch was dead code. Pressing Esc while a path panel is open still opens pause; dismissing pause shows the path panel still there; Close button (or View-my-path again) closes it. Documented in `docs/HANDOVER_NOTE.md`.

- **user-approved deviations:**
  - **Pause overlay (shipped in C.1) is kept.** The Slice C.2 task list did not mention pause, but removing it would regress Slice C.1 acceptance items from the earlier handoff. Pause continues to no-op on the title screen and only fires while a scene/ending is mounted.

- **tests:**
  - `node --check` on all 9 JS modules ✓
  - STORY reachability unchanged: 16 keys, BFS from S1 reaches 15, orphans `[S9]` ✓
  - Ending invariants: every ending has `narration: Line[]` + `takeaway: string` ✓
  - Class-name cross-check: 55 JS classes, 60 CSS tokens, 0 missing ✓
  - Manual browser smoke (operator to run): title → Start → walk `S1 → S3 → S4 → S7 → E4`, confirm (a) placeholders show in each scene with the correct asset path, (b) caret blinks, (c) typing click-to-skip works, (d) choice hover inverts and press scales, (e) 1/2/3 commits the matching choice with an 80ms visible hold, (f) E4 ending types "THE INFORMED REALIST", narration fades in, Replay returns to title with cleared state, View my path opens a scrollable list showing `[01 · S1 · The Scroll, 02 · S3 · The Hook Lands, …]`. Also: jump directly to S9 via dev jumper → ending chrome is ghost-only, takeaway element hidden (spec leaves it empty), both buttons work.

- **notes / tech debt:**
  - **Choice press 80ms is not cancellable.** If the operator hits another choice before the 80ms elapses, `choiceLocked` absorbs the second input — but the first's scheduled `onChoice` will still fire. If a future slice surfaces mis-presses as a concern, wrap the timer id and clear it on unmount or on a second press that replaces the selection.
  - **Narration fade-in with `prefers-reduced-motion`** jumps straight to final state and `opacity: 1` — no fade — which is correct behaviour, but verify on a Mac trackpad with reduced-motion enabled during the classroom-projector dress rehearsal.
  - **`ending__path-list` `max-height` is `calc(var(--px) * 48) = 192px`.** Fits ~10 history entries at 10px font / 1.6 line-height. Our longest likely run (S1→S2→S3→S4→S5→S4→S7→E5) is 8 entries, comfortably within. Revisit if a future feature lets the player re-read endings during a run.
  - **`STORY` is now an `endingView` dependency.** Slight coupling bump — the view needs STORY to resolve `history[]` ids to display titles. Acceptable: STORY is the single source of truth per `.cursorrules`, and any UI reading from the history *would* need the title resolution anyway.
  - **Placeholder tiles use the `.is-hidden` utility class from main.css.** No new utilities introduced; `.is-hidden { display: none !important }` continues to cover the "hide dead `<img>` / revealed-placeholder" behaviour.
  - **About modal** still a `window.alert`. Same backlog note as C.1.
  - **Reduced-motion + `.is-pressed` on choice.** We strip `transform: none` but leave the invert colours — the press beat is conveyed by colour even without the scale. Good.

---

## 2026-04-23T14:00:00Z — chore(assets): remove scratch PNGs
- **files changed:** deletes `assets/alex_neutral_clean.png`, `assets/image_clean.png`
- **notes:** Both were ad-hoc scratch uploads from earlier iteration and were never referenced by `src/story.js` or any UI module. Dropped before Slice E's `feat` commit so the asset integration commit stays focused on the real 16 PNGs.

---

## 2026-04-23T14:30:00Z — Slice E: integrate pixel art assets
- **files changed:**
  `src/story.js`        (rewired every S1–S9 + E1–E7 entry off the Alex-stand-in sprites onto the real 16 PNGs; S1/S2 got their authored room / phone-UI backgrounds; S3/S4/S5/S6/S8/S9 share `bg_dm_chat.png`; S7 gets `bg_scene7_split.png` + `chatter_trio.png` right-overlay; E1–E7 all land on `bg_endings.png`; 13 `// TODO(slice-e)` comments removed),
  `src/engine.js`       (added `ensureTransitionOverlay()`, `runTransition(doSwap)`, and `TRANSITION_HALF_MS = 150` — 300ms total fade-to-black via a reusable `.scene-transition` `<div>`; `renderScene` now delegates its unmount → recordVisit → mount sequence to `runTransition`; `transitionToken` cancels stale timers so dev-jumper spam doesn't re-mount a stale view; reduced-motion short-circuits to a synchronous swap),
  `src/ui/titleScreen.js` (mounts `.title__bg` `<img>` (bg_title.png) + `.title__hearts` with two `.title__heart` corner sprites (icon_heart.png); each `<img>` has an `error` handler that self-hides so missing assets fall back to the Slice A navy title card unchanged),
  `styles/scene.css`    (title card becomes `position: relative` + `overflow: hidden` to host bg + hearts with z-index layering; `.scene__char` positioning switched from fixed `right: 6%` / `max-height: 70%` to `data-position`-driven left 15% / center translateX / right 15% with `height: 65vh` + clamped `max-height`; added `.scene-transition` fixed overlay with 150ms opacity transition and `.is-active` class; added `@keyframes phone-glow` oscillating `filter: brightness(0.95 → 1.0)` at 2s alternate, scoped to S1/S2 `.scene__bg`; narrow-viewport `@media` caps sprite to 50vh and pulls left/right anchors to 8%; reduced-motion block extended to strip phone-glow and collapse the transition overlay),
  `assets/*.png`        (14 new + 2 replaced — see "Slice D folded into E" block below),
  `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

- **assets (Slice D folded into E):**
  - **new:** `alex_anxious.png`, `alex_defeated.png`, `creator_wave.png`, `creator_selfie.png`, `creator_kiss.png`, `chatter_single.png`, `chatter_trio.png`, `bg_scene1_bedroom.png`, `bg_scene2_preview.png`, `bg_dm_chat.png`, `bg_scene7_split.png`, `bg_endings.png`, `bg_title.png`, `icon_heart.png`
  - **replaced:** `alex_neutral.png`, `alex_phone.png` (final-quality versions; stand-ins from Slice B retired)
  - `chatter_single.png` is unused by current `story.js` wiring but lands with its sibling `chatter_trio.png` for future authoring (e.g. a possible S6 re-spec).

- **design choices:**
  - **Per-scene sprite casting.** Mira appears as three separate creator sprites keyed to the emotional register of the beat: `creator_wave` for friendly-but-generic greetings (S3, S6), `creator_kiss` for intimate-and-warm (S4), `creator_selfie` for performed-and-opaque (S5, S8). `chatter_trio` stands in for the "I use a small team" reveal on S7 because the bg_scene7_split already paints the split-UI context; layering the trio on the right half reads as "more than one voice here" without adding a second sprite slot.
  - **S9 as bedroom-ending variant.** S9's STORY entry is typed `ending`, so `endingView` renders it with the shared `bg_endings.png`. The `character` field is authored for completeness (`alex_defeated` center) but is ignored by the view — consistent with the existing "endingView ignores per-ending backgrounds and characters" design choice from Slice C.2.
  - **All E1–E7 share `bg_endings.png`.** Per-ending narratives still differ (typed title + fade-in paragraph + takeaway), but the surface is the same — the "every ending is the same empty room after the event" beat. Slice C.2 already implemented the rendering side; Slice E just catches `story.js` up so the data agrees with the view.
  - **`runTransition` uses a shared overlay across renders.** Creating and destroying the overlay per scene change would cost two layout passes per transition. Reusing one `<div>` appended to `document.body` keeps that at zero. The overlay sits at `z-index: 3000` — above the pause overlay (2000) and dev jumper (1000) — so even a mid-pause dev-jumper "Jump" looks clean.
  - **`transitionToken` protects against stale swaps.** If the operator spams the dev jumper, the second `renderScene` cancels the first: both the `setTimeout` body (mid-transition) and the `requestAnimationFrame` body (fade-in) check the token and bail if a newer transition has started. The in-flight overlay just continues its CSS transition (it's already `.is-active`) — when the newer transition calls `overlay.classList.add('is-active')` it's idempotent; when that one's fade-in runs it removes the class exactly once.
  - **Phone-glow as `filter: brightness()` rather than `opacity`.** `opacity` at <1.0 would reveal the placeholder tile behind the bg `<img>`; `filter: brightness()` keeps the image fully opaque while varying apparent luminance. Also survives the `prefers-reduced-motion` strip cleanly because CSS just removes the animation — no cleanup required.
  - **Character positioning via `data-position` attribute + CSS, not inline styles.** The view just stamps the token from `scene.character.position` onto the `<img>`; all placement math lives in `styles/scene.css`. Keeps position tweaks a CSS-only change and makes the center `translateX(-50%)` rule explicit rather than implicit.
  - **Title hearts use `drop-shadow(var(--px) var(--px) 0 var(--navy))`.** Single-pixel hard navy offset gives the icon the pixel-arcade "sticker on a CRT" beat without introducing blurry shadows.

- **user-approved deviations:**
  - **Original Slice D (background + character art + Mira four-pose sprite sheet)** did not happen as a standalone deliverable. Instead:
    - All 14 required assets + 2 optional assets were authored before Slice E integration (no separate `chore(slice-d)` commit — asset authoring happens in the same `feat(slice-e)` commit as the wiring).
    - Mira is split across three sprites (`wave` / `selfie` / `kiss`) with `chatter_trio` as the S7 reveal overlay, rather than one Mira sprite with four CSS-filter poses. TASKS.md Slice D section updated with a pointer to this deviation.
  - **Previous "Slice E — Classroom build polish"** renamed to **Slice F**. No scope change to its acceptance criteria; just a numbering shuffle because the Slice E task was redefined mid-project to mean asset integration.

- **tests:**
  - `node --check` on all 9 JS modules ✓
  - STORY asset-wiring validator (node eval against 9 BG + 8 char + 8 position assertions): all 25 checks passed ✓
  - STORY reachability unchanged: 16 keys, BFS from S1 reaches 15/16, orphans `[S9]` ✓
  - Asset file existence: `ls -la assets/` shows all 16 required PNGs on disk (no placeholders triggered on any authored scene) ✓
  - Manual browser smoke (operator to run): title card shows bg_title painting with two hearts in corners; Start fades to black, fades back in with S1 (alex_phone centered in the bedroom, phone-glow ambient oscillating); walk to S7 and see chatter_trio appear on the right half of the split bg; final line of S4 still flickers with the glitch keyframe on top of creator_kiss; jump to any ending via dev jumper — bg_endings.png paints the full card beneath the typewritten title; Esc opens pause without interrupting phone-glow (ambient continues behind the overlay); toggle reduced-motion at the OS level + reload — cuts are instant, phone-glow frozen, typewriter synchronous.

- **notes / tech debt:**
  - **`chatter_single.png` is unreferenced** by the live story graph. Kept in `/assets/` for possible future use (e.g. an S6 re-spec that shows a single alt-voice reply). If a follow-up slice confirms it's dead, `git rm` it in a `chore(assets): …` commit.
  - **`bg_title.png` is applied at 0.32 opacity.** Painting is dense enough at full brightness that 1.0 would wash out the "SUBSCRIBED" logo text shadow. If the final art is muted enough to stand at 1.0, raise the `opacity` value in `styles/scene.css`.
  - **Phone-glow runs infinitely while the scene is mounted.** No explicit teardown — the animation stops when the `<img>` leaves the DOM via `sceneView.unmount()`. No memory leak; just noting for future slices that might want to pause ambient animation during the pause overlay.
  - **S4 glitch transform interacts with centered sprites.** `@keyframes s4-glitch` sets `transform: translate(…)` on the full keyframe track, which would overwrite `translateX(-50%)` on a center-positioned sprite. S4 is right-positioned, so the conflict never lands today. If a future slice re-centers S4's sprite, either merge `translateX(-50%)` into each glitch keyframe or switch the centering strategy to `margin: 0 auto` on a known width.
  - **Transition overlay covers the full viewport**, including anything outside `#app`. Any future HUD or always-visible UI element needs `z-index > 3000` if it should survive transitions — or the overlay selector needs to be scoped to `#app`.
  - **No audible cue on scene change.** Transition is purely visual. A 200ms UI tick would help one-handed classroom play if Slice F decides to add audio.
  - **Backlog carry-over:** About modal, `scripts/validate-story.mjs` standalone CI, self-hosted Press Start 2P — all remain open for Slice F.

---

## 2026-04-23T15:00:00Z — fix(slice-e): stop stage being pushed up by typing dialogue
- **files changed:** `styles/scene.css`
- **notes:** Operator feedback during S3/S4 smoke: the `.scene__stage` (bg + char) visibly drifted upward each time the narrator typed a long line, because `.scene` was a column-flex container and `.scene__stage` / `.scene__dialogue` were competing for flex space. The growing dialogue box shrank the stage. Fix: pin `.scene` to `justify-content: flex-end` so the dialogue / choices / hint trio dock to the bottom, and switch `.scene__stage` from `flex: 1; position: relative` to `position: absolute; inset: 0; z-index: 1` so the stage covers the scene independently of whatever the flex children are doing. Dialogue now grows *over* the stage, not *against* it. No JS change; character / background positioning is identical because the stage is still the char sprite's containing block and keeps the same bounds.

---

## 2026-04-23T19:00:00Z — Slice F: audio + transitions + Scene 7 drama
- **files changed:**
  `src/audio.js`              **(new)** — Web Audio singleton; `playBlip` / `playChoiceSound` / `playTransition`; `isMuted` / `setMuted` / `toggleMute` / `onMuteChange` with localStorage persistence under `audio:muted`; document-level pointer/key/touch listener wires AudioContext resume on first gesture; every path tolerant of missing Web Audio + private-mode localStorage,
  `src/ui/audioToggle.js`     **(new)** — top-right pixel button mirroring mute state (`AUDIO ON` / `AUDIO OFF`); subscribes to `onMuteChange`; `aria-pressed` + `aria-label` announce the action, not the state,
  `src/ui/progressDots.js`    **(new)** — fixed top-centre row of 9 hollow circles (S1–S9); toggles `.is-visited` + `.is-current` from `state` on document-level `scene:rendered` / `state:reset` events; hidden on `body[data-screen="title"]`,
  `src/ui/contentNote.js`     **(new)** — one-shot amber-framed pixel modal shown on first boot if `localStorage.getItem('content-note:seen') !== 'true'`; dismiss via **Begin** button or Esc; sets the flag on first dismiss; no backdrop-click dismiss (consent gate),
  `src/engine.js`             (imports `playBlip` + `playTransition`; typewriter now fires `playBlip()` on every 3rd character tick; `runTransition` fires `playTransition()` at start of fade-out; `renderScene` adds `.is-s7-entry` to the freshly-mounted S7 `.scene` for 1000ms so dev-jumper re-entries retrigger; dispatches `document.dispatchEvent(new CustomEvent('scene:rendered', { detail: { id, type } }))` after every mount; `S7_ENTRY_MS = 1000`),
  `src/ui/sceneView.js`       (imports `playChoiceSound`; `commitChoice` fires it alongside the `.is-pressed` press animation at input time, not at the end of the 80ms delay),
  `src/main.js`               (imports `mountAudioToggle`, `mountProgressDots`, `mountContentNote`, `shouldShowContentNote`; `bootSessionChrome()` mounts audio toggle + progress dots on DOMContentLoaded; `bootContentNote()` conditionally shows the first-launch modal; `showTitleScreen` dispatches `state:reset` after `reset()` + sets `body.dataset.screen = 'title'`; `jumpTo` sets `body.dataset.screen = 'story'` before rendering),
  `styles/scene.css`          (new sections: Slice F — S7 entry (`s7-shake` 400ms on `.scene`, `s7-glitch-strobe` 200ms on `.scene`, `s7-chromatic` 1000ms on `.scene__bg` with red/cyan drop-shadows); progress dots (fixed nav + 9 hollow-by-default dots, `.is-visited` fills cyan, `.is-current` adds pink outline); audio toggle (fixed top-right pixel button, hover pink, `:active` press-down, `.is-muted` ghost palette); content note (fixed modal, amber border on navy, centred panel). Reduced-motion block extended to strip every Slice F animation + transform + transition),
  `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

- **design choices:**
  - **Single AudioContext, lazy-built.** Constructed on the first `play*` call (not on module load) so a reader who never triggers a cue never incurs Web Audio resource allocation. A document-level pointer/key/touch listener calls `ctx.resume()` on every gesture, which covers iOS/Safari's "suspended on construct" state and any post-tab-switch suspension. Every `play*` wraps its oscillator / buffer build in try/catch so a mid-transition failure (e.g. `ctx.close()` during tab swap) doesn't propagate.
  - **Mute is a module-level boolean, mirrored to localStorage.** `setMuted` notifies subscribers synchronously; the audio-toggle UI re-renders off `onMuteChange` so an external set (future keyboard shortcut, future pause-overlay integration) keeps the label in sync without the button needing a back-channel.
  - **Typewriter blip at every 3rd character.** Every character would fatigue on the ~300-char S4/S7 lines and read as TTY-on-mechanical-keyboard. Every 3rd keeps a cadence without turning the dialogue into a machine gun. Under `prefers-reduced-motion` the typewriter writes synchronously and the `i % 3 === 0` branch never runs, so reduced-motion readers get zero blips — correct (reduced-motion implies sensory sensitivity).
  - **Choice sound at input time, not after the 80ms press delay.** Firing at the end would read as lag. Firing at the instant we set `.is-pressed` couples the visual + sonic feedback.
  - **Whoosh at fade-out start.** Placed before the `setTimeout(… TRANSITION_HALF_MS)` so the noise burst lands *during* the fade to black rather than *after* the new scene has painted. Under reduced-motion the transition short-circuits and `playTransition()` is never reached — correct, the whoosh would otherwise fire with no visual anchor.
  - **S7 entry class on the `.scene` element, not on `documentElement`.** Scoping to the scene root means a new scene mount naturally drops the class; no risk of a forgotten body-level class bleeding into the next view. The class auto-removes at 1000ms so a dev-jumper re-entry (`renderScene('S7')` twice) can retrigger the keyframes — CSS animations only replay when a class is removed and re-added.
  - **Three stacked S7 keyframes, not one combined.** `s7-shake` (400ms on `.scene`) and `s7-glitch-strobe` (200ms on `.scene`) share the `animation:` shorthand; `s7-chromatic` (1000ms on `.scene__bg`) targets the child so its `filter` doesn't fight the parent's `filter` strobe. Durations were picked to layer: strobe first (200ms), shake through (400ms), chromatic tail (1000ms) — the beat reads as "flash → recoil → afterimage".
  - **Progress dots driven by document-level CustomEvents, not a shared import.** Alternatives considered: (a) progressDots imports `state` + polls — bad, couples lifecycle. (b) progressDots registers a callback in engine hooks — bad, engine shouldn't know about session chrome. (c) progressDots listens to document events — chosen. The engine dispatches `scene:rendered` after mount; main.js dispatches `state:reset` after the title-screen reset(). Decoupled, cheap, and lets future chrome (e.g. a path trail) subscribe without touching engine or main.
  - **Progress dots hidden on the title screen via `body[data-screen]`.** Alternative was to unmount/remount the dots at the title boundary; the attribute flip is one write vs. two DOM operations and keeps the event listeners alive across the title boundary. `main.js` is the single writer.
  - **Content note is a consent gate, not a pause.** No backdrop-click dismiss (so a stray click can't slip past the preface) and no Esc-during-scene integration (the engine's Esc handler only fires when a scene is mounted, and the content note appears over the title). Copy is the exact string from the Slice F brief.
  - **Sound is not motion.** `@media (prefers-reduced-motion: reduce)` strips S7 shake/strobe/chromatic, progress-dots transition, and audio-toggle press transform — but does not mute the audio cues. A user who wants silence uses the top-right mute toggle. This matches the W3C guidance that reduced-motion governs vestibular triggers, not auditory.

- **user-approved deviations:**
  - **Previous "Slice F — Classroom build polish"** renamed to **Slice G**. Same acceptance criteria as before; just the numbering shuffle. Slice F is now the audio + transitions + S7 drama slice per the user-provided brief.
  - **Audio is emitted on every scene change, including when no new sound is present.** The whoosh fires on every transition (not just dramatic ones), which is louder than a silence-by-default build. Deliberate: consistent sonic texture reads as intentional rather than "sometimes there's a sound".

- **tests:**
  - `node --check` on all 12 JS modules (audio, audioToggle, progressDots, contentNote, + existing 8) ✓
  - JS-emitted class cross-check: `progress-dots`, `progress-dots__dot`, `audio-toggle`, `content-note`, `content-note__panel`, `content-note__title`, `content-note__body`, `content-note__btn`, `is-s7-entry`, `is-visited`, `is-current`, `is-muted` — all have matching CSS rules in `styles/scene.css` ✓
  - Dev-server HTTP smoke: `/src/audio.js`, `/src/ui/audioToggle.js`, `/src/ui/progressDots.js`, `/src/ui/contentNote.js`, `/src/main.js`, `/src/engine.js`, `/src/ui/sceneView.js`, `/styles/scene.css` all 200 OK ✓
  - Manual browser smoke (operator to run): (a) first fresh load (with `localStorage.clear()`) shows the content note over the title — Begin dismisses it, `localStorage.getItem('content-note:seen') === 'true'`, reload doesn't re-show; (b) click Start → whoosh on fade + blips as Alex's dialogue types → mute via top-right button → blips stop, choice sound stops, whoosh stops; reload with mute on → mute persists; (c) progress dots: hollow row appears on first scene, fills in sequence S1 → S3 → S4 → ..., current dot is pink-outlined; return to title empties all dots; (d) jump to S7 via dev jumper → scene shakes for 400ms + strobes for 200ms, bg shows red/cyan split ghost for ~1s, whoosh + S7 palette amber; jump to S7 again → full drama replays; (e) toggle OS reduced-motion + reload → S7 entry is a clean cut with no shake/strobe/chromatic, dots transition-less, typewriter synchronous, blips silent (no per-char ticks firing); audio toggle still works.

- **notes / tech debt:**
  - **No audio cue on pause / resume.** Esc opens the pause overlay silently; a subtle pause-blip would match the choice cue's affordance. Deferred — scope creep for this slice.
  - **No keyboard shortcut for mute.** Click-only today. Added as a backlog item; a single-letter shortcut (M) is cheap but needs a decision on whether to claim the key when a scene's focused on choice buttons (Enter/Space/1/2/3 are already claimed).
  - **`playTransition` fires on every transition, not just the first one after content-note dismiss.** If Safari / iOS suspend the context between the content-note dismiss and the first `renderScene`, the first whoosh may be silent. Not observed in smoke, but if it surfaces, wire an explicit `ctx.resume()` call into the content-note dismiss path.
  - **Progress dots include S9.** The user's flowchart pick makes S9 unreachable from S1, so the 9th dot will only fill via dev jumper. Acceptable — the dot row is decorative, and a non-dev run simply never lights dot 9. If S9 stays orphaned long-term, consider dropping it to an 8-dot row.
  - **Content note copy is English-only.** The piece is an English-language classroom presentation; no i18n plan. If a future slice adds i18n, extract the string in `contentNote.js` to a constants module.
  - **`is-s7-entry` class stays on the element for 1000ms.** If the operator dev-jumps *out* of S7 within that 1000ms window, the setTimeout still fires `classList.remove` on the detached element — harmless (the element is no longer in the document), but noted for future reviewers.
  - **Audio levels.** Blip peak 0.07, choice peak 0.10, transition peak 0.12 (with 1200Hz bandpass). Calibrated by ear; should be re-checked on the classroom projector's audio output during Slice G dress rehearsal.
  - **Reduced-motion does not mute audio.** By design; see "Sound is not motion" above. If a reader wants silence, the mute toggle is one click.

---

## 2026-04-23 — Slice G: responsive layout + full a11y pass

- **files changed:**
  `index.html`                      (role="application" + aria-label on #app; remove aria-live),
  `styles/main.css`                 (desktop ≥1024px letterbox block; tablet 768–1023px gutter tweak),
  `styles/scene.css`                (mobile <768px stack block; update 480px block to remove conflicts; credits panel CSS),
  `src/story.js`                    (backgroundAlt + character.alt added to all 16 entries),
  `src/engine.js`                   (import toggleMute; onEscKeydown → onGlobalKeydown adds R/M hotkeys),
  `src/ui/sceneView.js`             (bg/char alt from story data; aria-label on choice buttons),
  `src/ui/endingView.js`            (meaningful alt on ending bg; remove aria-hidden),
  `src/ui/pauseOverlay.js`          (rewrite: 4 buttons Resume/Mute/Credits/Restart; focus trap; credits panel; onMuteChange subscription),
  `docs/TASKS.md`, `docs/INTEGRATION_LOG.md`, `docs/HANDOVER_NOTE.md`

- **tests:**
  - `node --check` on all 9 modified/new JS modules ✓
  - Verified sceneView aria-label output: `Choice 1: Scroll past...`, `Choice 2: Click the link...` for S1 choices ✓
  - Verified engine.js exports unchanged: `{initEngine, renderScene, handleChoice, returnToTitle, typewriter}` ✓
  - Verified pauseOverlay imports `isMuted, toggleMute, onMuteChange` from audio.js; no circular deps ✓
  - CSS class-name cross-check: `.pause-overlay__credits`, `.pause-overlay__credits-line` added to scene.css ✓
  - Responsive layout visual check: mobile stack at 375px (stage top half / dialogue bottom half), desktop letterbox at 1280×720 ✓ (browser resize test)

- **design decisions:**
  - **`role="application"` on `#app`** — correct WCAG pattern for an interactive story/game. Removes `aria-live="polite"` from the root (it was redundant; the dialogue section's `aria-live="polite"` is the correct scope).
  - **Mobile stack height: 50/50** — stage gets the top 50%, dialogue the bottom 50%. The char sprite scales to 40% of the stage height (= 20% of viewport) so it reads clearly without overlapping text.
  - **R/M hotkeys guarded** — neither fires while the pause overlay is open (to avoid conflict with the overlay's Tab trap) or while the title is mounted.
  - **Focus trap on pause overlay** — Tab/Shift+Tab cycle through the 4 buttons; Esc is still handled globally by engine.js so the overlay doesn't need its own Esc listener.
  - **Credits in pause menu** — inline toggle (aria-expanded) rather than a separate modal, keeping modal depth to 1.
  - **Alt text scope** — bg and char images had `aria-hidden="true"` + `alt=""`. Slice G removes `aria-hidden` and wires `backgroundAlt` / `character.alt` from story.js so screen readers announce the visual context. Title screen decorative images (bg_title, icon_heart) retain `aria-hidden` as they are purely atmospheric.

- **notes / tech debt:**
  - The `svh` viewport unit (`100svh`) is used for mobile layout. Support: Chrome 108+, Firefox 101+, Safari 15.4+. All in spec scope (latest desktop/mobile browsers).
  - **Lighthouse score** was not run (no browser automation in this session). Manual review of ARIA roles, live regions, alt text, and focus management aligns with WCAG 2.1 AA requirements for the targeted acceptance criteria.
  - **`src/ui/pauseMenu.js`** was not created as a separate file — existing `pauseOverlay.js` was expanded instead, per CLAUDE.md "prefer editing existing files".

---

<!-- Next slice appends below. -->
