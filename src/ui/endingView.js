/**
 * @file src/ui/endingView.js — renders a `type === 'ending'` entry.
 *
 * Layout:
 *   <main class="ending" data-scene-id="E1">
 *     <div class="ending__stage">
 *       <img class="ending__bg" />
 *       <img class="ending__char" />
 *     </div>
 *     <h2 class="ending__title">E1 · The Skeptic</h2>
 *     <p class="ending__text" aria-live="polite"></p>     <!-- typewriter narration -->
 *     <p class="ending__takeaway is-hidden"></p>          <!-- CCHU9015 one-liner -->
 *     <div class="ending__actions is-hidden">
 *       <button class="btn btn--primary">Return to title</button>
 *     </div>
 *     <p class="ending__hint">Click or press Enter / Space to continue.</p>
 *   </main>
 *
 * Interaction:
 *   - On mount, start typewriter on narration line 0.
 *   - Click / Enter / Space: skip current line or advance to next
 *     narration line. When the last line is typed, reveal the takeaway
 *     + "Return to title" button and focus the button.
 *   - Return to title: calls `ctx.onReturnToTitle()`.
 *
 * Endings with zero narration jump straight to the takeaway + button.
 * Endings with empty `takeaway` (S9, by spec) hide the takeaway element
 * but still show the return button.
 */

import { typewriter } from '../engine.js';

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

  // --- structure -------------------------------------------------------
  const endingEl = document.createElement('main');
  endingEl.className = 'ending';
  endingEl.dataset.sceneId = scene.id ?? '';

  const stage = document.createElement('div');
  stage.className = 'ending__stage';

  const bg = document.createElement('img');
  bg.className = 'ending__bg';
  bg.src = typeof scene.background === 'string' ? scene.background : '';
  bg.alt = '';
  bg.setAttribute('aria-hidden', 'true');
  bg.addEventListener('error', () => { bg.classList.add('is-hidden'); });

  const charEl = document.createElement('img');
  charEl.className = 'ending__char';
  charEl.alt = '';
  charEl.setAttribute('aria-hidden', 'true');
  if (scene.character && typeof scene.character.sprite === 'string') {
    charEl.src = scene.character.sprite;
    charEl.addEventListener('error', () => { charEl.classList.add('is-hidden'); });
  } else {
    charEl.classList.add('is-hidden');
    charEl.src = '';
  }

  stage.append(bg, charEl);

  const titleEl = document.createElement('h2');
  titleEl.className = 'ending__title';
  titleEl.textContent = `${scene.id ?? ''} \u00B7 ${scene.title ?? ''}`;

  const textEl = document.createElement('p');
  textEl.className = 'ending__text';
  textEl.setAttribute('aria-live', 'polite');

  const takeawayEl = document.createElement('p');
  takeawayEl.className = 'ending__takeaway is-hidden';
  takeawayEl.textContent = scene.takeaway ?? '';

  const actionsEl = document.createElement('div');
  actionsEl.className = 'ending__actions is-hidden';
  actionsEl.setAttribute('role', 'group');
  actionsEl.setAttribute('aria-label', 'After-ending actions');

  const returnBtn = document.createElement('button');
  returnBtn.type = 'button';
  returnBtn.className = 'btn btn--primary';
  returnBtn.textContent = 'Return to title';
  returnBtn.addEventListener('click', () => onReturnToTitle());
  actionsEl.appendChild(returnBtn);

  const hintEl = document.createElement('p');
  hintEl.className = 'ending__hint';
  hintEl.textContent = 'Click or press Enter / Space to continue.';

  endingEl.append(stage, titleEl, textEl, takeawayEl, actionsEl, hintEl);
  root.appendChild(endingEl);

  // --- state -----------------------------------------------------------
  const lines = Array.isArray(scene.narration) ? scene.narration : [];
  /** @type {{skip: () => void} | null} */
  let typingHandle = null;
  let typingDone = true;
  let lineIndex = -1;
  let finished = false;

  function startLine(i) {
    const line = lines[i];
    if (!line) return;
    textEl.classList.add('is-typing');
    typingDone = false;
    const handle = typewriter(textEl, line.text ?? '');
    typingHandle = handle;
    handle.then(() => {
      if (typingHandle === handle) typingDone = true;
    });
  }

  function finish() {
    if (finished) return;
    finished = true;
    textEl.classList.remove('is-typing');
    const hasTakeaway = typeof scene.takeaway === 'string' && scene.takeaway.length > 0;
    if (hasTakeaway) takeawayEl.classList.remove('is-hidden');
    actionsEl.classList.remove('is-hidden');
    hintEl.classList.add('is-hidden');
    queueMicrotask(() => returnBtn.focus());
  }

  function advance() {
    if (finished) return;
    if (!typingDone && typingHandle && typeof typingHandle.skip === 'function') {
      typingHandle.skip();
      return;
    }
    if (lineIndex + 1 < lines.length) {
      lineIndex += 1;
      startLine(lineIndex);
    } else {
      finish();
    }
  }

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

    if (finished) {
      // Let the focused return button handle Enter natively.
      return;
    }

    if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
      if (ev.target instanceof HTMLButtonElement) return;
      ev.preventDefault();
      advance();
    }
  }
  document.addEventListener('keydown', onKey);

  function onClick(ev) {
    if (isPauseOpen()) return;
    if (isFromDevJumper(ev.target)) return;
    if (ev.target instanceof Element && ev.target.closest('.btn')) return;
    if (finished) return;
    advance();
  }
  endingEl.addEventListener('click', onClick);

  // --- kickoff --------------------------------------------------------
  if (lines.length > 0) {
    lineIndex = 0;
    startLine(0);
  } else {
    finish();
  }

  return {
    unmount() {
      document.removeEventListener('keydown', onKey);
      if (typingHandle && typeof typingHandle.skip === 'function') typingHandle.skip();
      typingHandle = null;
      while (root.firstChild) root.removeChild(root.firstChild);
    },
  };
}
