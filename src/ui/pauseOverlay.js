/**
 * @file src/ui/pauseOverlay.js — modal pause overlay for "Subscribed".
 *
 * Summoned by the engine when the player presses Esc (or the global R/M
 * shortcuts bypass it). Offers three actions:
 *   - Resume (Close) → dismiss the overlay, return focus to the scene.
 *   - Mute / Unmute  → toggle audio; label stays in sync via onMuteChange.
 *   - Restart        → unmount the overlay + active view, re-mount title.
 *
 * Structure:
 *   <div class="pause-overlay" role="dialog" aria-modal="true">
 *     <div class="pause-overlay__panel">
 *       <h2 class="pause-overlay__title">Paused</h2>
 *       <div class="pause-overlay__actions">
 *         <button>Resume</button>
 *         <button aria-pressed="…">Mute Audio / Unmute Audio</button>
 *         <button>Restart</button>
 *       </div>
 *       <p class="pause-overlay__hint">Press Esc to resume.</p>
 *     </div>
 *   </div>
 *
 * Accessibility:
 *   - `role="dialog"` + `aria-modal="true"` + labelled by the h2.
 *   - Focus trapped: Tab/Shift+Tab cycle only through the panel's buttons.
 *   - Resume button gets focus on mount so Enter immediately dismisses.
 *   - Backdrop click = Resume.
 *   - The engine owns the Esc toggle globally; this module does not
 *     install its own keydown for Esc — otherwise two handlers fight.
 *   - Tab-trap keydown listener is installed on the overlay (not document)
 *     so it is automatically scoped to the modal.
 */

import { isMuted, toggleMute, onMuteChange } from '../audio.js';

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
  panel.addEventListener('click', (ev) => ev.stopPropagation());

  const titleEl = document.createElement('h2');
  titleEl.className = 'pause-overlay__title';
  titleEl.id = 'pause-overlay-title';
  titleEl.textContent = 'Paused';

  const actionsEl = document.createElement('div');
  actionsEl.className = 'pause-overlay__actions';
  actionsEl.setAttribute('role', 'group');
  actionsEl.setAttribute('aria-label', 'Pause actions');

  // --- Resume (Close) ---
  const resumeBtn = document.createElement('button');
  resumeBtn.type = 'button';
  resumeBtn.className = 'btn btn--primary pause-overlay__btn';
  resumeBtn.textContent = 'Resume';
  resumeBtn.addEventListener('click', () => onResume());

  // --- Mute toggle ---
  const muteBtn = document.createElement('button');
  muteBtn.type = 'button';
  muteBtn.className = 'btn pause-overlay__btn';

  function renderMuteBtn() {
    const muted = isMuted();
    muteBtn.textContent = muted ? 'Unmute Audio' : 'Mute Audio';
    muteBtn.setAttribute('aria-pressed', String(muted));
  }
  renderMuteBtn();
  muteBtn.addEventListener('click', () => {
    toggleMute();
    renderMuteBtn();
  });
  const offMuteChange = onMuteChange(renderMuteBtn);

  // --- Restart ---
  const restartBtn = document.createElement('button');
  restartBtn.type = 'button';
  restartBtn.className = 'btn pause-overlay__btn';
  restartBtn.textContent = 'Restart';
  restartBtn.addEventListener('click', () => onReturnToTitle());

  actionsEl.append(resumeBtn, muteBtn, restartBtn);

  const hint = document.createElement('p');
  hint.className = 'pause-overlay__hint';
  hint.textContent = 'Press Esc to resume.';

  panel.append(titleEl, actionsEl, hint);
  overlay.appendChild(panel);

  // --- Backdrop dismiss ---
  overlay.addEventListener('click', () => onResume());

  // --- Focus trap: Tab / Shift+Tab cycle only within panel buttons ---
  overlay.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Tab') return;
    const focusable = /** @type {HTMLButtonElement[]} */ (
      [...panel.querySelectorAll('button')]
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (ev.shiftKey) {
      if (document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  });

  root.appendChild(overlay);

  queueMicrotask(() => resumeBtn.focus());

  return {
    unmount() {
      offMuteChange();
      overlay.remove();
    },
  };
}
