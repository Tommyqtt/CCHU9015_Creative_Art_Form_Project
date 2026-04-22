/**
 * @file src/engine.js — scene state machine for "Subscribed".
 *
 * Responsibilities (Slice B):
 *   - Own the currently-mounted scene / ending view (view lifecycle).
 *   - Look up scenes by id, validate, delegate to the appropriate view.
 *   - Record visits in `state` before mounting so history + DOM agree.
 *   - Provide a DOM-free `typewriter()` primitive (per-char rendering,
 *     respects prefers-reduced-motion, returns a Promise with `.skip()`).
 *
 * NOT responsibilities:
 *   - Title screen lifecycle (main.js owns that — the engine should
 *     never need to know the title exists).
 *   - Keyboard handling inside scenes (views own their own keys —
 *     centralising here would couple the engine to DOM semantics).
 *   - Pause / restart UI (follow-up slice).
 *
 * Views communicate with the engine through the `ctx` object passed
 * to them on mount:
 *   { onChoice: (choice) => void, onReturnToTitle: () => void }
 * — which lets the view stay ignorant of `STORY` and `state`.
 */

import { STORY } from './story.js';
import { recordVisit } from './state.js';
import { mountSceneView } from './ui/sceneView.js';
import { mountEndingView } from './ui/endingView.js';

/**
 * Default typewriter speed in milliseconds per character.
 *
 * `.cursorrules` §Dialogue specifies ~30ms/char as the target cadence,
 * but operator feedback during Slice B judged that too slow for the
 * roughly 300-char lines in S4/S7. 15ms reads as typewriter-paced
 * without forcing the reader to wait; skip-on-click is still the
 * primary accessibility path for slower readers.
 *
 * Tune here, not at call sites — sceneView / endingView let the
 * default through so a single edit changes the whole piece.
 */
const DEFAULT_TYPE_SPEED_MS = 15;

/** @type {HTMLElement|null} */
let rootEl = null;
/** @type {{unmount: () => void}|null} */
let currentScreen = null;
/** @type {(() => void)|null} */
let onReturnToTitleHook = null;

/**
 * Register the engine with its DOM root and any host-level callbacks.
 * Safe to call more than once — subsequent calls replace the root and
 * re-install hooks. `main.js` calls this before the first `renderScene()`.
 *
 * @param {HTMLElement}                el
 * @param {{onReturnToTitle?: () => void}} [hooks]
 * @returns {void}
 */
export function initEngine(el, hooks = {}) {
  rootEl = el;
  onReturnToTitleHook = typeof hooks.onReturnToTitle === 'function'
    ? hooks.onReturnToTitle
    : null;
}

/**
 * Render the scene identified by `id`. Unmounts the previous view
 * (including removing any keyboard listeners it installed), records
 * the visit in `state`, then delegates to the scene or ending view
 * based on `scene.type`.
 *
 * Returns silently with an error log if `id` is unknown or the engine
 * has not been initialised — the caller should never have to catch.
 *
 * @param {string} id
 * @returns {void}
 */
export function renderScene(id) {
  if (!rootEl) {
    console.error('[engine] renderScene: call initEngine(rootEl) first.');
    return;
  }
  const scene = STORY[id];
  if (!scene) {
    console.error(`[engine] renderScene: unknown scene id "${id}"`);
    return;
  }

  if (currentScreen && typeof currentScreen.unmount === 'function') {
    currentScreen.unmount();
  }
  currentScreen = null;

  recordVisit(id);

  const ctx = {
    onChoice: handleChoice,
    onReturnToTitle: returnToTitle,
  };

  currentScreen = scene.type === 'ending'
    ? mountEndingView(rootEl, scene, ctx)
    : mountSceneView(rootEl, scene, ctx);
}

/**
 * Handle a player's choice. Validates shape + `choice.next` resolution,
 * then re-enters the engine via `renderScene()`.
 *
 * @param {{id?: string, label?: string, next?: string}} choice
 * @returns {void}
 */
export function handleChoice(choice) {
  if (!choice || typeof choice.next !== 'string' || choice.next.length === 0) {
    console.error('[engine] handleChoice: invalid choice (missing next)', choice);
    return;
  }
  if (!(choice.next in STORY)) {
    console.error(`[engine] handleChoice: choice.next "${choice.next}" not in STORY`);
    return;
  }
  renderScene(choice.next);
}

/**
 * Unmount the current scene / ending view and hand control back to the
 * title screen via the host hook installed by `initEngine()`. Called by
 * the ending view's "Return to title" button.
 * @returns {void}
 */
export function returnToTitle() {
  if (currentScreen && typeof currentScreen.unmount === 'function') {
    currentScreen.unmount();
  }
  currentScreen = null;
  if (onReturnToTitleHook) onReturnToTitleHook();
}

/**
 * Type `text` into `el` one character at a time at ~`speed` ms/char.
 *
 * Contract:
 *   - Returns a Promise that resolves when the full text has been
 *     written to `el.textContent`, OR when `.skip()` is called
 *     (whichever is first). The Promise never rejects.
 *   - The returned Promise exposes a `.skip()` method that jumps to
 *     the final text immediately and resolves the pending Promise on
 *     the next tick. Safe to call multiple times (idempotent).
 *   - If `@media (prefers-reduced-motion: reduce)` matches, the full
 *     text is written synchronously and the Promise resolves on the
 *     next microtask — no per-character animation.
 *   - If `speed <= 0`, same behaviour as reduced-motion.
 *   - If `el` is falsy or has no `textContent`, resolves immediately.
 *
 * Scheduling:
 *   - Uses `setTimeout(..., speed)`. Each tick writes one additional
 *     character via `el.textContent = text.slice(0, i)`, which is O(n)
 *     per frame but fine for ~300-char lines at 30ms intervals.
 *
 * @param {HTMLElement} el
 * @param {string}      text
 * @param {number}      [speed=DEFAULT_TYPE_SPEED_MS]
 * @returns {Promise<void> & {skip: () => void}}
 */
export function typewriter(el, text, speed = DEFAULT_TYPE_SPEED_MS) {
  const safe = typeof text === 'string' ? text : String(text ?? '');

  /** Returns the resolved-promise shape with an attached no-op skip. */
  const resolvedNoop = () => {
    const p = /** @type {Promise<void> & {skip: () => void}} */ (Promise.resolve());
    p.skip = () => {};
    return p;
  };

  if (!el || typeof el.textContent !== 'string') {
    return resolvedNoop();
  }

  const reducedMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !Number.isFinite(speed) || speed <= 0 || safe.length === 0) {
    el.textContent = safe;
    return resolvedNoop();
  }

  el.textContent = '';
  let cancelled = false;
  let resolveFn = /** @type {() => void} */ (() => {});
  const promise = /** @type {Promise<void> & {skip: () => void}} */ (
    new Promise((resolve) => { resolveFn = resolve; })
  );

  let i = 0;
  const step = () => {
    if (cancelled) {
      el.textContent = safe;
      resolveFn();
      return;
    }
    i += 1;
    el.textContent = safe.slice(0, i);
    if (i >= safe.length) {
      resolveFn();
      return;
    }
    setTimeout(step, speed);
  };
  setTimeout(step, speed);

  promise.skip = () => { cancelled = true; };
  return promise;
}
