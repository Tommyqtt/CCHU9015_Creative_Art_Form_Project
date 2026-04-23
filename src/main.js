/**
 * @file src/main.js — app entry for "Subscribed".
 *
 * Responsibilities:
 *   - Boot on DOMContentLoaded.
 *   - Own the title-screen lifecycle (mount/unmount). Everything scene-
 *     and ending-shaped belongs to the engine.
 *   - Install the engine with a "return to title" callback so endings
 *     can bring the player back without main.js importing any ending
 *     state.
 *   - Mount session-wide chrome that lives outside #app: the audio
 *     mute toggle (top-right), the progress-dots row (top-centre),
 *     and the one-shot content-note modal on first launch.
 *   - Mount the dev jumper if `localStorage.getItem('dev') === 'true'`.
 *
 * Swap discipline:
 *   - Only ONE of { title, engine-owned view } can be in #app at a time.
 *   - When the title is up, `engine.currentScreen` is null.
 *   - When a scene/ending is up, `titleHandle` is null.
 *   - A dev-jumper "jump" from the title correctly unmounts the title
 *     (removes its Enter listener) before asking the engine to render.
 *   - `document.body.dataset.screen` is either 'title' or 'story' and
 *     lets CSS hide the progress dots on the title. main.js is the
 *     single writer.
 */

import { reset } from './state.js';
import { initEngine, renderScene } from './engine.js';
import { mountTitleScreen } from './ui/titleScreen.js';
import { mountDevJumper } from './ui/devJumper.js';
import { mountAudioToggle } from './ui/audioToggle.js';
import { mountProgressDots } from './ui/progressDots.js';
import { mountContentNote, shouldShowContentNote } from './ui/contentNote.js';

const APP_ROOT_SELECTOR = '#app';

/** @type {{unmount: () => void} | null} */
let titleHandle = null;
let engineReady = false;

function getRoot() {
  const root = document.querySelector(APP_ROOT_SELECTOR);
  if (!root) {
    console.error(`main: ${APP_ROOT_SELECTOR} not found in DOM.`);
    return null;
  }
  return root;
}

/**
 * Lazy-init the engine on first need. Idempotent; safe to call
 * multiple times (a repeat call just re-installs the hook, which is
 * the same function).
 */
function ensureEngine(root) {
  if (engineReady) return;
  initEngine(root, { onReturnToTitle: showTitleScreen });
  engineReady = true;
}

/**
 * Swap the app root to the title screen. Resets state so returning from
 * an ending starts the next playthrough clean. Dispatches a document-
 * level `state:reset` event so session-wide chrome (progress dots)
 * can re-render.
 */
function showTitleScreen() {
  const root = getRoot();
  if (!root) return;
  reset();
  document.dispatchEvent(new CustomEvent('state:reset'));
  document.body.dataset.screen = 'title';
  if (titleHandle && typeof titleHandle.unmount === 'function') {
    titleHandle.unmount();
  }
  titleHandle = mountTitleScreen(root, {
    onStart: () => jumpTo('S1'),
  });
}

/**
 * Unmount the title (if present) and ask the engine to render `sceneId`.
 * Used by both the title's Start button and the dev jumper.
 * @param {string} sceneId
 */
function jumpTo(sceneId) {
  const root = getRoot();
  if (!root) return;
  if (titleHandle && typeof titleHandle.unmount === 'function') {
    titleHandle.unmount();
    titleHandle = null;
  }
  document.body.dataset.screen = 'story';
  ensureEngine(root);
  renderScene(sceneId);
}

function bootDevJumper() {
  if (typeof window === 'undefined') return;
  if (typeof window.localStorage === 'undefined') return;
  if (window.localStorage.getItem('dev') !== 'true') return;
  mountDevJumper(document.body, { onJump: jumpTo });
}

/**
 * Mount the session-wide chrome added in Slice F. Order matters only
 * insofar as DOM order affects tab-order for the (currently un-focus-
 * able) dots; the mute button and dots both sit at fixed positions
 * defined in CSS.
 */
function bootSessionChrome() {
  mountAudioToggle(document.body);
  mountProgressDots(document.body);
}

/**
 * Show the first-launch content note, if the user hasn't dismissed it.
 * Blocking the title screen behind a consent gate would feel heavy,
 * so we let the title render underneath and overlay the modal; the
 * reader dismisses it to Begin. The dismiss handler is a no-op for
 * navigation — the title screen's Start button is the real start
 * path. We only need the modal to appear and disappear.
 */
function bootContentNote() {
  if (!shouldShowContentNote()) return;
  mountContentNote(document.body, { onBegin: () => { /* nothing */ } });
}

document.addEventListener('DOMContentLoaded', () => {
  bootSessionChrome();
  showTitleScreen();
  bootContentNote();
  bootDevJumper();
});
