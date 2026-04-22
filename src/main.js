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
 *   - Mount the dev jumper if `localStorage.getItem('dev') === 'true'`.
 *
 * Swap discipline:
 *   - Only ONE of { title, engine-owned view } can be in #app at a time.
 *   - When the title is up, `engine.currentScreen` is null.
 *   - When a scene/ending is up, `titleHandle` is null.
 *   - A dev-jumper "jump" from the title correctly unmounts the title
 *     (removes its Enter listener) before asking the engine to render.
 */

import { reset } from './state.js';
import { initEngine, renderScene } from './engine.js';
import { mountTitleScreen } from './ui/titleScreen.js';
import { mountDevJumper } from './ui/devJumper.js';

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
 * an ending starts the next playthrough clean.
 */
function showTitleScreen() {
  const root = getRoot();
  if (!root) return;
  reset();
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
  ensureEngine(root);
  renderScene(sceneId);
}

function bootDevJumper() {
  if (typeof window === 'undefined') return;
  if (typeof window.localStorage === 'undefined') return;
  if (window.localStorage.getItem('dev') !== 'true') return;
  mountDevJumper(document.body, { onJump: jumpTo });
}

document.addEventListener('DOMContentLoaded', () => {
  showTitleScreen();
  bootDevJumper();
});
