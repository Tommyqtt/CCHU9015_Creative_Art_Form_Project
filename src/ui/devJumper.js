/**
 * @file src/ui/devJumper.js — dev-only scene navigator.
 *
 * Mounts a small pixel-styled panel in the bottom-right corner with a
 * dropdown listing every scene/ending id and a Jump button that calls
 * `onJump(id)`. Intended for operator use during authoring & QA.
 *
 * Gated by `localStorage.getItem('dev') === 'true'` — main.js checks
 * the flag and only calls `mountDevJumper()` when enabled. To enable,
 * open devtools and run:
 *
 *     localStorage.setItem('dev', 'true')
 *
 * To disable:
 *
 *     localStorage.removeItem('dev')
 *
 * The panel persists across scene swaps (mounted into <body>, not
 * #app). Keyboard shortcuts in scene views explicitly skip events
 * originating inside `.dev-jumper`, so interacting with the dropdown
 * never fires a scene "advance".
 */

/**
 * Every scene/ending id the player can jump to. Listed in story order
 * (S-then-E, ascending) so the dropdown reads naturally. Keep in sync
 * with `STORY` — a missing id becomes a silent 404 on jump.
 */
const JUMP_TARGETS = [
  'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9',
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7',
];

/**
 * Mount the dev jumper into `host` (typically `document.body`).
 * @param {HTMLElement} host
 * @param {{onJump: (id: string) => void}} handlers
 * @returns {{unmount: () => void}}
 */
export function mountDevJumper(host, handlers) {
  if (!host) throw new Error('mountDevJumper: host element is required.');
  const onJump = typeof handlers?.onJump === 'function'
    ? handlers.onJump
    : () => {};

  const panel = document.createElement('aside');
  panel.className = 'dev-jumper';
  panel.setAttribute('role', 'toolbar');
  panel.setAttribute('aria-label', 'Developer: scene jumper');

  const tag = document.createElement('span');
  tag.className = 'dev-jumper__tag';
  tag.textContent = 'DEV';

  const select = document.createElement('select');
  select.className = 'dev-jumper__select';
  select.setAttribute('aria-label', 'Scene to jump to');
  for (const id of JUMP_TARGETS) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    select.appendChild(opt);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dev-jumper__btn';
  btn.textContent = 'Jump';
  btn.addEventListener('click', () => onJump(select.value));

  // Pressing Enter inside the select also jumps — tiny QoL for keyboard users.
  select.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      onJump(select.value);
    }
  });

  panel.append(tag, select, btn);
  host.appendChild(panel);

  return {
    unmount() {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    },
  };
}
