/**
 * @file src/ui/pauseOverlay.js — modal pause overlay for "Subscribed".
 *
 * Summoned by the engine when the player presses Esc while a scene or
 * ending is mounted. Offers two actions:
 *   - Resume        → dismiss the overlay, return focus to the scene.
 *   - Return to title → unmount the overlay + active view, re-mount title.
 *
 * Structure:
 *   <div class="pause-overlay" role="dialog" aria-modal="true">
 *     <div class="pause-overlay__panel">
 *       <h2 class="pause-overlay__title">Paused</h2>
 *       <div class="pause-overlay__actions">
 *         <button class="btn btn--primary">Resume</button>
 *         <button class="btn">Return to title</button>
 *       </div>
 *       <p class="pause-overlay__hint">Press Esc to resume.</p>
 *     </div>
 *   </div>
 *
 * Accessibility:
 *   - `role="dialog"` + `aria-modal="true"` + labelled by the title.
 *   - Resume button gets focus on mount so Enter immediately dismisses.
 *   - Backdrop click = Resume (matches Esc-to-dismiss mental model).
 *   - The engine owns the Esc toggle globally; this module does not
 *     install its own keydown — otherwise two handlers would fight
 *     over the same key. Clicks on the panel don't bubble to the
 *     backdrop dismiss-click handler.
 */

/**
 * @param {HTMLElement} root — typically `document.body`.
 * @param {{onResume: () => void, onReturnToTitle: () => void}} handlers
 * @returns {{unmount: () => void}}
 */
export function mountPauseOverlay(root, handlers) {
  if (!root) throw new Error('mountPauseOverlay: root element is required.');
  const onResume = typeof handlers?.onResume === 'function'
    ? handlers.onResume
    : () => {};
  const onReturnToTitle = typeof handlers?.onReturnToTitle === 'function'
    ? handlers.onReturnToTitle
    : () => {};

  const overlay = document.createElement('div');
  overlay.className = 'pause-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'pause-overlay-title');

  const panel = document.createElement('div');
  panel.className = 'pause-overlay__panel';
  // Clicks on the panel itself should not bubble up to the backdrop
  // dismiss handler; only bare-backdrop clicks should resume.
  panel.addEventListener('click', (ev) => ev.stopPropagation());

  const titleEl = document.createElement('h2');
  titleEl.className = 'pause-overlay__title';
  titleEl.id = 'pause-overlay-title';
  titleEl.textContent = 'Paused';

  const actionsEl = document.createElement('div');
  actionsEl.className = 'pause-overlay__actions';
  actionsEl.setAttribute('role', 'group');
  actionsEl.setAttribute('aria-label', 'Pause actions');

  const resumeBtn = document.createElement('button');
  resumeBtn.type = 'button';
  resumeBtn.className = 'btn btn--primary pause-overlay__btn';
  resumeBtn.textContent = 'Resume';
  resumeBtn.addEventListener('click', () => onResume());

  const returnBtn = document.createElement('button');
  returnBtn.type = 'button';
  returnBtn.className = 'btn pause-overlay__btn';
  returnBtn.textContent = 'Return to title';
  returnBtn.addEventListener('click', () => onReturnToTitle());

  actionsEl.append(resumeBtn, returnBtn);

  const hint = document.createElement('p');
  hint.className = 'pause-overlay__hint';
  hint.textContent = 'Press Esc to resume.';

  panel.append(titleEl, actionsEl, hint);
  overlay.appendChild(panel);

  overlay.addEventListener('click', () => onResume());

  root.appendChild(overlay);

  queueMicrotask(() => resumeBtn.focus());

  return {
    unmount() {
      overlay.remove();
    },
  };
}
