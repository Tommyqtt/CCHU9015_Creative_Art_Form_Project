/**
 * @file src/ui/endingView.js — renders a `type === 'ending'` entry.
 *
 * Slice C (final-screen layout):
 *   <main class="ending" data-scene-id="E1">
 *     <div class="ending__bg-placeholder">assets/bg_endings.png</div>
 *     <img class="ending__bg" src="assets/bg_endings.png" />
 *     <h1  class="ending__title"></h1>              <!-- typewriter -->
 *     <p   class="ending__narration is-hidden"></p>  <!-- fade-in -->
 *     <p   class="ending__takeaway  is-hidden"></p>  <!-- fade-in -->
 *     <div class="ending__actions   is-hidden">
 *       <button class="btn btn--primary">Replay</button>
 *       <button class="btn">View my path</button>
 *     </div>
 *     <aside class="ending__path is-hidden">
 *       <h2 class="ending__path-title">Your path</h2>
 *       <ol class="ending__path-list"></ol>
 *       <button class="btn ending__path-close">Close</button>
 *     </aside>
 *   </main>
 *
 * Flow:
 *   1. Mount shows only the ending-card background + placeholder.
 *   2. Title types letter-by-letter (e.g. "THE SKEPTIC"). Caret blinks
 *      via the shared `.is-typing::after` rule.
 *   3. When typing completes, narration + (optional) takeaway + actions
 *      fade in (CSS keyframe on `.is-revealed`). Replay gets focus.
 *   4. Replay → `ctx.onReturnToTitle()` (main.js resets state + title).
 *   5. View my path → toggles a scrollable list of `state.history`
 *      with each entry rendered as `${id} · ${title}` (looked up from
 *      STORY so copy changes propagate automatically). Close returns
 *      focus to the Replay button.
 *
 * Clicking anywhere in the ending card while the title is still typing
 * skips to the fully-typed title. Once revealed, clicks outside the
 * buttons and the path panel are no-ops. The engine's Esc pause
 * overlay still works over the top of this view.
 *
 * Ending background is a single `assets/bg_endings.png` for every
 * ending — a deliberate design beat (all endings share the same
 * after-piece surface). Per-ending `background` fields in STORY are
 * ignored by this view.
 */

import { typewriter } from '../engine.js';
import { state } from '../state.js';
import { STORY } from '../story.js';

const ENDING_BG = 'assets/bg_endings.png';

/**
 * @param {HTMLElement} root
 * @param {any}         scene  — a STORY[id] entry with type === 'ending'.
 * @param {{onReturnToTitle: () => void}} ctx
 * @returns {{unmount: () => void}}
 */
export function mountEndingView(root, scene, ctx) {
  if (!root) throw new Error('mountEndingView: root element is required.');
  if (!scene) throw new Error('mountEndingView: scene is required.');
  const onReturnToTitle = typeof ctx?.onReturnToTitle === 'function'
    ? ctx.onReturnToTitle
    : () => {};

  while (root.firstChild) root.removeChild(root.firstChild);

  // --- structure ------------------------------------------------------
  const endingEl = document.createElement('main');
  endingEl.className = 'ending';
  endingEl.dataset.sceneId = scene.id ?? '';

  const bgPlaceholder = document.createElement('div');
  bgPlaceholder.className = 'ending__bg-placeholder';
  bgPlaceholder.setAttribute('aria-hidden', 'true');
  bgPlaceholder.textContent = ENDING_BG;

  const bg = document.createElement('img');
  bg.className = 'ending__bg';
  bg.src = ENDING_BG;
  bg.alt = typeof scene.backgroundAlt === 'string' && scene.backgroundAlt
    ? scene.backgroundAlt
    : 'Dark abstract ending card with a faint starfield';
  bg.addEventListener('load',  () => { bgPlaceholder.classList.add('is-hidden'); });
  bg.addEventListener('error', () => { bg.classList.add('is-hidden'); });

  const titleEl = document.createElement('h1');
  titleEl.className = 'ending__title';

  const narrationText = Array.isArray(scene.narration)
    ? scene.narration.map((l) => (l && typeof l.text === 'string' ? l.text : '')).filter(Boolean).join(' ')
    : '';

  const narrationEl = document.createElement('p');
  narrationEl.className = 'ending__narration is-hidden';
  narrationEl.textContent = narrationText;

  const takeawayEl = document.createElement('p');
  takeawayEl.className = 'ending__takeaway is-hidden';
  const hasTakeaway = typeof scene.takeaway === 'string' && scene.takeaway.length > 0;
  if (hasTakeaway) takeawayEl.textContent = scene.takeaway;

  const actionsEl = document.createElement('div');
  actionsEl.className = 'ending__actions is-hidden';
  actionsEl.setAttribute('role', 'group');
  actionsEl.setAttribute('aria-label', 'After-ending actions');

  const replayBtn = document.createElement('button');
  replayBtn.type = 'button';
  replayBtn.className = 'btn btn--primary ending__action';
  replayBtn.textContent = 'Replay';
  replayBtn.addEventListener('click', () => onReturnToTitle());

  const pathBtn = document.createElement('button');
  pathBtn.type = 'button';
  pathBtn.className = 'btn ending__action';
  pathBtn.textContent = 'View my path';
  pathBtn.setAttribute('aria-expanded', 'false');

  actionsEl.append(replayBtn, pathBtn);

  // --- path panel (hidden until "View my path") ----------------------
  const pathPanel = document.createElement('aside');
  pathPanel.className = 'ending__path is-hidden';
  pathPanel.setAttribute('aria-label', 'Your path this run');

  const pathTitle = document.createElement('h2');
  pathTitle.className = 'ending__path-title';
  pathTitle.textContent = 'Your path';

  const pathList = document.createElement('ol');
  pathList.className = 'ending__path-list';

  const pathClose = document.createElement('button');
  pathClose.type = 'button';
  pathClose.className = 'btn ending__path-close';
  pathClose.textContent = 'Close';

  pathPanel.append(pathTitle, pathList, pathClose);

  endingEl.append(bgPlaceholder, bg, titleEl, narrationEl, takeawayEl, actionsEl, pathPanel);
  root.appendChild(endingEl);

  // --- state ----------------------------------------------------------
  /** @type {{skip: () => void} | null} */
  let typingHandle = null;
  let titleDone = false;
  const rawTitle = typeof scene.title === 'string' ? scene.title : '';
  const titleText = rawTitle.toUpperCase();

  /** Reveal narration + takeaway + actions with the fade-in keyframe. */
  function reveal() {
    if (titleDone) return;
    titleDone = true;
    titleEl.classList.remove('is-typing');
    narrationEl.classList.remove('is-hidden');
    narrationEl.classList.add('is-revealed');
    if (hasTakeaway) {
      takeawayEl.classList.remove('is-hidden');
      takeawayEl.classList.add('is-revealed');
    }
    actionsEl.classList.remove('is-hidden');
    actionsEl.classList.add('is-revealed');
    queueMicrotask(() => replayBtn.focus());
  }

  // --- path panel wiring ----------------------------------------------
  /**
   * Build a list item for a history entry. Looks up the scene / ending
   * in STORY so the operator doesn't have to re-author copy when the
   * spec changes.
   * @param {string} sceneId
   * @param {number} step
   */
  function renderPathItem(sceneId, step) {
    const entry = STORY[sceneId];
    const titleStr = (entry && typeof entry.title === 'string') ? entry.title : '';
    const li = document.createElement('li');
    li.className = 'ending__path-item';
    const stepEl = document.createElement('span');
    stepEl.className = 'ending__path-step';
    stepEl.textContent = `${String(step).padStart(2, '0')}.`;
    const idEl = document.createElement('span');
    idEl.className = 'ending__path-id';
    idEl.textContent = sceneId;
    const titleElLi = document.createElement('span');
    titleElLi.className = 'ending__path-title-line';
    titleElLi.textContent = titleStr;
    li.append(stepEl, idEl, titleElLi);
    return li;
  }

  function openPath() {
    // Rebuild every open so late visits show up (we never close-and-
    // re-enter an ending in a single run, but cheap insurance).
    while (pathList.firstChild) pathList.removeChild(pathList.firstChild);
    const history = Array.isArray(state.history) ? state.history : [];
    if (history.length === 0) {
      const li = document.createElement('li');
      li.className = 'ending__path-item ending__path-item--empty';
      li.textContent = '(no scenes recorded)';
      pathList.appendChild(li);
    } else {
      history.forEach((id, i) => pathList.appendChild(renderPathItem(id, i + 1)));
    }
    pathPanel.classList.remove('is-hidden');
    pathPanel.classList.add('is-revealed');
    pathBtn.setAttribute('aria-expanded', 'true');
    queueMicrotask(() => pathClose.focus());
  }

  function closePath() {
    pathPanel.classList.add('is-hidden');
    pathPanel.classList.remove('is-revealed');
    pathBtn.setAttribute('aria-expanded', 'false');
    queueMicrotask(() => pathBtn.focus());
  }

  pathBtn.addEventListener('click', () => {
    if (pathPanel.classList.contains('is-hidden')) openPath();
    else closePath();
  });
  pathClose.addEventListener('click', () => closePath());

  // --- input wiring ---------------------------------------------------
  function isFromDevJumper(target) {
    return target instanceof Element && target.closest('.dev-jumper') !== null;
  }

  function isPauseOpen() {
    return document.querySelector('.pause-overlay') !== null;
  }

  function onKey(ev) {
    if (ev.defaultPrevented) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (isPauseOpen()) return;
    if (isFromDevJumper(ev.target)) return;

    // Enter / Space while title is still typing → skip to fully typed.
    // (Esc is owned by the engine's pause overlay; any Esc keydown
    // has already been preventDefault()'d by that handler before it
    // reaches us, so we don't double-handle it here.)
    if (!titleDone && (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar')) {
      if (ev.target instanceof HTMLButtonElement) return;
      ev.preventDefault();
      if (typingHandle) typingHandle.skip();
    }
  }
  document.addEventListener('keydown', onKey);

  function onClick(ev) {
    if (isPauseOpen()) return;
    if (isFromDevJumper(ev.target)) return;
    if (ev.target instanceof Element && ev.target.closest('.btn')) return;
    if (ev.target instanceof Element && ev.target.closest('.ending__path')) return;
    if (titleDone) return;
    if (typingHandle) typingHandle.skip();
  }
  endingEl.addEventListener('click', onClick);

  // --- kickoff --------------------------------------------------------
  titleEl.classList.add('is-typing');
  const handle = typewriter(titleEl, titleText);
  typingHandle = handle;
  handle.then(() => {
    if (typingHandle === handle) reveal();
  });

  return {
    unmount() {
      document.removeEventListener('keydown', onKey);
      if (typingHandle && typeof typingHandle.skip === 'function') typingHandle.skip();
      typingHandle = null;
      while (root.firstChild) root.removeChild(root.firstChild);
    },
  };
}
