/**
 * @file src/ui/contentNote.js — first-launch content-note modal.
 *
 * Shows once per browser (flagged in localStorage under
 * `content-note:seen`). Displays a short preface framing the themes
 * of the piece so the reader can opt in with context. A single
 * "Begin" button dismisses the modal and sets the seen flag.
 *
 * Structure:
 *   <div class="content-note" role="dialog" aria-modal="true">
 *     <div class="content-note__panel">
 *       <h2 class="content-note__title">Content note</h2>
 *       <p  class="content-note__body">...</p>
 *       <button class="btn btn--primary">Begin</button>
 *     </div>
 *   </div>
 *
 * Dismiss paths:
 *   - Click "Begin"  → mark seen, unmount, call `onBegin()`.
 *   - Press Esc      → same as Begin; the engine's Esc handler is
 *     no-op while no scene is mounted, so we handle Esc locally.
 *   - Clicking the backdrop does NOT dismiss (intentional — this is
 *     a consent gate, unlike the pause overlay which dismisses on
 *     backdrop click).
 *
 * Accessibility:
 *   - `role="dialog"`, `aria-modal="true"`, labelled by the title.
 *   - Focus moves to the Begin button on mount so Enter dismisses.
 */

const STORAGE_KEY = 'content-note:seen';

const NOTE_TEXT = "This game explores themes of loneliness, parasocial "
  + "relationships, and performative intimacy. Click 'Begin' when ready.";

/**
 * @returns {boolean} true if the user has not yet seen the note.
 */
export function shouldShowContentNote() {
  try {
    return typeof localStorage === 'undefined'
      || localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

/** Persist the seen flag. Silent on private-mode failures. */
export function markContentNoteSeen() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  } catch { /* ignore */ }
}

/**
 * @param {HTMLElement} root
 * @param {{onBegin?: () => void}} [handlers]
 * @returns {{unmount: () => void}}
 */
export function mountContentNote(root, handlers = {}) {
  if (!root) throw new Error('mountContentNote: root element is required.');
  const onBegin = typeof handlers.onBegin === 'function'
    ? handlers.onBegin
    : () => {};

  const overlay = document.createElement('div');
  overlay.className = 'content-note';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'content-note-title');

  const panel = document.createElement('div');
  panel.className = 'content-note__panel';
  // Clicks inside the panel should not dismiss. We also don't dismiss
  // on backdrop click (see file header), so stopping propagation here
  // is belt-and-braces against a future backdrop-click handler.
  panel.addEventListener('click', (ev) => ev.stopPropagation());

  const titleEl = document.createElement('h2');
  titleEl.className = 'content-note__title';
  titleEl.id = 'content-note-title';
  titleEl.textContent = 'Content note';

  const body = document.createElement('p');
  body.className = 'content-note__body';
  body.textContent = NOTE_TEXT;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--primary content-note__btn';
  btn.textContent = 'Begin';

  function dismiss() {
    markContentNoteSeen();
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    onBegin();
  }

  function onKey(ev) {
    if (ev.defaultPrevented) return;
    if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') {
      // Enter / Space on the focused button fires click natively;
      // this branch catches Esc and keyboard presses that landed
      // somewhere other than the button (e.g. focus got lost).
      if (ev.key === 'Escape') {
        ev.preventDefault();
        dismiss();
      }
    }
  }

  btn.addEventListener('click', dismiss);
  document.addEventListener('keydown', onKey);

  panel.append(titleEl, body, btn);
  overlay.appendChild(panel);
  root.appendChild(overlay);

  queueMicrotask(() => btn.focus());

  return {
    unmount() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    },
  };
}
