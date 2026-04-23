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
import { mountPauseOverlay } from './ui/pauseOverlay.js';
import { playBlip, playTransition, toggleMute } from './audio.js';

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
/** @type {{unmount: () => void}|null} */
let pauseHandle = null;
/** Prevents double-install of the document-level Esc listener. */
let escInstalled = false;

/**
 * Half-duration of the scene transition. 150ms fade-out + 150ms fade-in
 * = 300ms total per the Slice E acceptance spec. The DOM swap happens
 * at the midpoint, fully behind a solid black overlay, so the reader
 * never sees the old view's text evaporate mid-character.
 */
const TRANSITION_HALF_MS = 150;

/**
 * Slice F — "illusion shatters" duration for the S7 entry animation.
 * Longest child effect is `s7-chromatic` at 1000ms; after that the
 * class is stripped so a repeat visit via dev-jumper can re-fire it
 * (the class removal + re-add is what retriggers CSS animations).
 */
const S7_ENTRY_MS = 1000;

/** @type {HTMLDivElement|null} The overlay <div> lives on document.body across renders. */
let transitionOverlay = null;
/** Monotonic token so a fresh transition cancels an in-flight one. */
let transitionToken = 0;

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
  installEscListener();
}

/**
 * Install the document-level global hotkey handler (Esc, R, M).
 * Guarded against double-install so repeated `initEngine` calls don't
 * stack listeners. The Esc/R/M handlers are all no-ops while the title
 * screen is mounted (currentScreen === null).
 * @returns {void}
 */
function installEscListener() {
  if (escInstalled) return;
  escInstalled = true;
  document.addEventListener('keydown', onGlobalKeydown);
}

/**
 * Global hotkeys while a scene/ending is mounted:
 *   Esc — toggle the pause overlay (open or close).
 *   R   — restart from the title screen (immediate, no pause needed).
 *   M   — toggle mute via audio.js.
 *
 * Guards: modifier keys, input targets, and the title screen (currentScreen
 * === null) are all skipped. R and M are also no-ops while the pause is
 * open so they don't conflict with the overlay's own keyboard handling.
 *
 * @param {KeyboardEvent} ev
 * @returns {void}
 */
function onGlobalKeydown(ev) {
  if (ev.defaultPrevented) return;
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

  const k = ev.key;

  // Esc: toggle pause overlay regardless of currentScreen state
  if (k === 'Escape' || k === 'Esc') {
    if (pauseHandle) {
      ev.preventDefault();
      closePause();
      return;
    }
    if (!currentScreen) return;
    ev.preventDefault();
    openPause();
    return;
  }

  // R / M only fire when a scene/ending is mounted and the pause is closed
  if (!currentScreen || pauseHandle) return;
  if (ev.target instanceof HTMLInputElement)   return;
  if (ev.target instanceof HTMLTextAreaElement) return;

  // R: restart — return to title (same as ending's "Replay" button)
  if (k === 'r' || k === 'R') {
    ev.preventDefault();
    returnToTitle();
    return;
  }

  // M: toggle mute
  if (k === 'm' || k === 'M') {
    ev.preventDefault();
    toggleMute();
  }
}

/** Open the pause overlay. No-op if one is already open. */
function openPause() {
  if (pauseHandle) return;
  pauseHandle = mountPauseOverlay(document.body, {
    onResume: closePause,
    onReturnToTitle: () => {
      closePause();
      returnToTitle();
    },
  });
}

/** Close the pause overlay. Safe to call when none is open. */
function closePause() {
  if (!pauseHandle) return;
  pauseHandle.unmount();
  pauseHandle = null;
}

/**
 * Idempotently mount the transition overlay on document.body. The
 * element is reused across scene changes — creating and destroying
 * it every render would force layout twice per transition, and the
 * browser only needs one fixed-position black div.
 * @returns {HTMLDivElement}
 */
function ensureTransitionOverlay() {
  if (transitionOverlay && transitionOverlay.isConnected) return transitionOverlay;
  const el = document.createElement('div');
  el.className = 'scene-transition';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  transitionOverlay = el;
  return el;
}

/**
 * Run `doSwap` behind a 300ms fade-to-black. Under
 * `prefers-reduced-motion: reduce`, runs the swap synchronously so the
 * reader gets an instant cut with no phantom delay.
 *
 * Cancellation: each call bumps `transitionToken`; stale timers (e.g.
 * dev-jumper fired during a previous fade) check the token and bail
 * without re-running the swap.
 *
 * @param {() => void} doSwap
 * @returns {void}
 */
function runTransition(doSwap) {
  const reducedMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    doSwap();
    return;
  }
  const overlay = ensureTransitionOverlay();
  const token = ++transitionToken;
  // Slice F — sonic beat for the cut. Fires at the start of the
  // fade-out so the whoosh lands underneath the black flash rather
  // than after the new scene has already painted.
  playTransition();
  overlay.classList.add('is-active');
  setTimeout(() => {
    if (token !== transitionToken) return;
    doSwap();
    // Wait one frame so the new view's initial paint lands before we
    // start fading back in — otherwise the first typewriter tick can
    // show through the tail of the fade-out.
    requestAnimationFrame(() => {
      if (token !== transitionToken) return;
      overlay.classList.remove('is-active');
    });
  }, TRANSITION_HALF_MS);
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

  // Any open pause overlay is stale the moment we switch scenes
  // (e.g. dev jumper mid-pause); close it before the fade starts so
  // it doesn't flash through the transition.
  closePause();

  runTransition(() => {
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

    // Slice F — S7 dramatic entry. Triggered here (inside doSwap, so
    // the class lands on the freshly-mounted `.scene`) rather than
    // inside sceneView, which would couple a generic view to one
    // scene's atmosphere. `is-s7-entry` drives shake + glitch-strobe
    // + chromatic-aberration keyframes defined in scene.css; removed
    // after S7_ENTRY_MS so a dev-jumper re-entry can retrigger them.
    if (id === 'S7') {
      const sceneEl = /** @type {HTMLElement|null} */ (
        rootEl.querySelector('.scene[data-scene-id="S7"]')
      );
      if (sceneEl) {
        sceneEl.classList.add('is-s7-entry');
        setTimeout(() => sceneEl.classList.remove('is-s7-entry'), S7_ENTRY_MS);
      }
    }

    // Slice F — notify listeners (e.g. progress dots) that the DOM
    // now reflects a new scene. Fires after mount so observers can
    // read both `state` and the live document synchronously.
    document.dispatchEvent(new CustomEvent('scene:rendered', {
      detail: { id, type: scene.type },
    }));
  });
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
  closePause();
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
 *   - The returned Promise exposes:
 *       * `.skip()` — synchronously fills `el.textContent` with the
 *         full text, resolves the pending Promise, and flips `.done`
 *         to `true`. Safe to call any number of times (idempotent).
 *       * `.done`  — a read-only boolean, `true` the moment the full
 *         text is on screen (either via natural completion or via
 *         `.skip()`). Needed because a Promise's `.then` callback
 *         runs on a microtask, which gives scene/ending views a
 *         narrow race window where "click right as the last char
 *         lands" can read `typingDone === false` and bounce off
 *         `skip()` instead of advancing. `.done` closes that race.
 *   - If `@media (prefers-reduced-motion: reduce)` matches, the full
 *     text is written synchronously, `.done` is `true` immediately,
 *     and the Promise resolves on the next microtask — no per-char
 *     animation.
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
 * @returns {Promise<void> & {skip: () => void, readonly done: boolean}}
 */
export function typewriter(el, text, speed = DEFAULT_TYPE_SPEED_MS) {
  const safe = typeof text === 'string' ? text : String(text ?? '');

  /** Returns the resolved-promise shape with a no-op skip and done=true. */
  const resolvedNoop = () => {
    const p = /** @type {Promise<void> & {skip: () => void, done: boolean}} */ (
      Promise.resolve()
    );
    p.skip = () => {};
    Object.defineProperty(p, 'done', { value: true, enumerable: true });
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
  let done = false;
  let resolveFn = /** @type {() => void} */ (() => {});
  const promise = /** @type {Promise<void> & {skip: () => void, done: boolean}} */ (
    new Promise((resolve) => { resolveFn = resolve; })
  );

  /**
   * Collapse to the final state exactly once. Sets text, flips `done`,
   * resolves the promise. Idempotent so `.skip()` after natural finish
   * is a no-op, and natural finish after `.skip()` is also a no-op.
   */
  const finish = () => {
    if (done) return;
    done = true;
    el.textContent = safe;
    resolveFn();
  };

  let i = 0;
  const step = () => {
    if (cancelled || done) {
      finish();
      return;
    }
    i += 1;
    el.textContent = safe.slice(0, i);
    // Slice F — audible typewriter. Fire a blip every 3 characters so
    // long lines have a perceptible cadence without each letter
    // clicking (which fatigues on ~300-char paragraphs). playBlip()
    // no-ops when muted or when the AudioContext is unavailable.
    if (i % 3 === 0) playBlip();
    if (i >= safe.length) {
      finish();
      return;
    }
    setTimeout(step, speed);
  };
  setTimeout(step, speed);

  promise.skip = () => {
    cancelled = true;
    finish();
  };
  Object.defineProperty(promise, 'done', {
    enumerable: true,
    get: () => done,
  });
  return promise;
}
