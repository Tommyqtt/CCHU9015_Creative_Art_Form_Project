/**
 * @file src/ui/audioToggle.js — top-right mute toggle button.
 *
 * Thin UI over src/audio.js:
 *   - Renders a fixed-position pixel-styled button.
 *   - Text reflects current state: "AUDIO ON" / "AUDIO OFF".
 *   - Click flips via `toggleMute()`; persistence is handled by audio.js.
 *   - Subscribes to `onMuteChange` so an external setMuted() (e.g. from
 *     a future keyboard shortcut) keeps the label in sync.
 *
 * Structure:
 *   <button class="audio-toggle" aria-pressed="..." aria-label="...">
 *     AUDIO ON
 *   </button>
 *
 * Accessibility:
 *   - `aria-pressed` mirrors mute state (true = muted).
 *   - `aria-label` + `title` describe the action, not the state, so
 *     screen readers announce "Mute audio" / "Unmute audio" rather
 *     than the literal button text.
 */

import { isMuted, toggleMute, onMuteChange } from '../audio.js';

/**
 * @param {HTMLElement} root
 * @returns {{unmount: () => void}}
 */
export function mountAudioToggle(root) {
  if (!root) throw new Error('mountAudioToggle: root element is required.');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'audio-toggle';

  function render() {
    const muted = isMuted();
    btn.textContent = muted ? 'AUDIO OFF' : 'AUDIO ON';
    btn.setAttribute('aria-pressed', String(muted));
    const label = muted ? 'Unmute audio' : 'Mute audio';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.classList.toggle('is-muted', muted);
  }
  render();

  btn.addEventListener('click', () => {
    toggleMute();
    // render() also fires via onMuteChange; calling twice is harmless
    // and keeps the UI responsive even if the listener is disposed.
    render();
  });
  const offChange = onMuteChange(render);

  root.appendChild(btn);

  return {
    unmount() {
      offChange();
      btn.remove();
    },
  };
}
