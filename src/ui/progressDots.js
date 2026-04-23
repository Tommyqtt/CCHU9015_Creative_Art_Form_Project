/**
 * @file src/ui/progressDots.js — 9-dot progress indicator at top of viewport.
 *
 * One dot per non-ending scene (S1 through S9). The UI is purely
 * decorative: it does not affect gameplay, can't be interacted with,
 * and is hidden on the title screen (no scene has been rendered yet).
 *
 * States:
 *   - Hollow (default)  — not visited on this playthrough.
 *   - Filled (`.is-visited`) — `state.visitedScenes` contains the id.
 *   - Current (`.is-current`) — `state.currentSceneId` matches. Adds
 *     a pink ring on top of whatever the base state is, so the current
 *     scene reads clearly even during the first visit.
 *
 * Data flow:
 *   - Module listens to two document-level CustomEvents:
 *       * 'scene:rendered' — dispatched by engine.renderScene after a
 *         scene or ending is mounted.
 *       * 'state:reset'    — dispatched by main.js in showTitleScreen
 *         after `reset()` so we can clear all the filled dots between
 *         playthroughs.
 *   - On either event, re-read `state` and toggle the per-dot classes.
 *
 * Visibility:
 *   - Mounted once on boot, stays in the DOM for the whole session.
 *   - CSS hides the dots when <body data-screen="title">; the engine
 *     and main.js flip that attribute as views come and go.
 */

import { state } from '../state.js';

/**
 * Scene ids shown on the dot row, in narrative order. S9 is included
 * because it is a mainline scene that can be reached via dev-jumper
 * (and the bad-flag "spiral" branch in the design doc). Endings
 * (E1–E7) are not mainline and don't get their own dots.
 */
const SCENE_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];

/**
 * @param {HTMLElement} root
 * @returns {{unmount: () => void, update: () => void}}
 */
export function mountProgressDots(root) {
  if (!root) throw new Error('mountProgressDots: root element is required.');

  const nav = document.createElement('nav');
  nav.className = 'progress-dots';
  nav.setAttribute('aria-label', 'Scene progress');
  nav.setAttribute('role', 'group');

  /** @type {HTMLElement[]} */
  const dots = SCENE_IDS.map((id, idx) => {
    const el = document.createElement('span');
    el.className = 'progress-dots__dot';
    el.dataset.sceneId = id;
    el.setAttribute('aria-label', `Scene ${idx + 1}`);
    return el;
  });
  nav.append(...dots);

  function update() {
    const visited = state.visitedScenes instanceof Set
      ? state.visitedScenes
      : new Set();
    const current = state.currentSceneId;
    for (const dot of dots) {
      const id = dot.dataset.sceneId;
      dot.classList.toggle('is-visited', visited.has(id));
      dot.classList.toggle('is-current', id === current);
    }
  }
  update();

  const onRender = () => update();
  const onReset = () => update();
  document.addEventListener('scene:rendered', onRender);
  document.addEventListener('state:reset', onReset);

  root.appendChild(nav);

  return {
    update,
    unmount() {
      document.removeEventListener('scene:rendered', onRender);
      document.removeEventListener('state:reset', onReset);
      nav.remove();
    },
  };
}
