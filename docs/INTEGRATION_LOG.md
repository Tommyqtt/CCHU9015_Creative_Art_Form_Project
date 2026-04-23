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

<!-- Next slice appends below. -->
