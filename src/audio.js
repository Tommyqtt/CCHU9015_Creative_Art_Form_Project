/**
 * @file src/audio.js — Web-Audio synthesis layer for "Subscribed".
 *
 * Exposes three one-shot cues used by the engine + scene view:
 *
 *   - playBlip()       — 800 Hz sine · 15 ms · quick attack/decay.
 *                        Fired every 3 characters by the typewriter
 *                        so the dialogue has an audible pulse.
 *   - playChoiceSound()— 500 Hz square · 30 ms · sharper attack.
 *                        Fired on choice commit for a "press" beat.
 *   - playTransition() — band-passed white-noise burst · 200 ms.
 *                        Fired at the start of a fade-to-black swap.
 *
 * Design:
 *   - Single AudioContext per page, lazily constructed on the first
 *     `play*` call. iOS / Safari require an AudioContext created or
 *     resumed inside a user gesture — we wire a document-level
 *     pointer/key/touch listener that calls `ctx.resume()` whenever
 *     the context is suspended.
 *   - Mute preference is persisted under the `audio:muted`
 *     localStorage key (values `"1"` or `"0"`). All three `play*`
 *     functions no-op when muted. A lightweight pub-sub
 *     (`onMuteChange`) lets the UI toggle re-render on change.
 *   - Every browser quirk is tolerated: missing `AudioContext`,
 *     missing `localStorage`, `ctx.createBufferSource` failing
 *     (headless), etc. The module never throws from play calls.
 *
 * NOT responsibilities:
 *   - UI chrome (the mute-toggle button lives in
 *     `src/ui/audioToggle.js`, which imports from here).
 *   - Ambient music, ducking, or scene-scoped background tracks.
 *     The cues here are deliberately tiny and stateless.
 */

const STORAGE_KEY = 'audio:muted';

/** @type {AudioContext|null} */
let ctx = null;

/** Current mute state; initialised from localStorage on module load. */
let muted = false;

/** Guard against double-installing the user-gesture unlock listener. */
let unlockWired = false;

/** Subscribers notified whenever `muted` changes. */
const muteListeners = new Set();

// --- mute pref --------------------------------------------------------

(function loadMutedPref() {
  try {
    const v = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (v === '1') muted = true;
  } catch { /* private-mode localStorage throws — fall through */ }
})();

/**
 * @returns {boolean} Current mute state.
 */
export function isMuted() {
  return muted;
}

/**
 * Persist a new mute state and notify subscribers. Safe to call with
 * the same value — subscribers still fire (cheap and convenient).
 * @param {boolean} next
 * @returns {void}
 */
export function setMuted(next) {
  muted = Boolean(next);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    }
  } catch { /* private-mode — silently skip persistence */ }
  for (const fn of muteListeners) {
    try { fn(muted); } catch { /* listener should never throw, but we defend */ }
  }
}

/** Convenience helper — inverts and persists. */
export function toggleMute() {
  setMuted(!muted);
}

/**
 * Subscribe to mute changes. Returns an unsubscribe function.
 * @param {(muted: boolean) => void} fn
 * @returns {() => void}
 */
export function onMuteChange(fn) {
  if (typeof fn !== 'function') return () => {};
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

// --- context management ----------------------------------------------

/**
 * Lazily build the AudioContext. Returns `null` if the browser
 * doesn't support Web Audio or construction throws.
 * @returns {AudioContext|null}
 */
function ensureCtx() {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  wireUnlock();
  return ctx;
}

/**
 * Install a document-level pointer/key/touch listener that resumes
 * a suspended AudioContext on the next user gesture. Chrome, Safari,
 * and Firefox all require a gesture-driven resume the first time;
 * some environments suspend again after tab switch, so we keep the
 * listener alive for the session (passive, so no scroll impact).
 */
function wireUnlock() {
  if (unlockWired || typeof document === 'undefined') return;
  unlockWired = true;
  const resume = () => {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* ignore — will retry on next gesture */ });
    }
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((evt) => {
    document.addEventListener(evt, resume, { passive: true });
  });
}

// --- cues -------------------------------------------------------------

/**
 * 800 Hz sine · 15 ms envelope · fires every 3 characters from the
 * typewriter in engine.js. Volume is kept quiet (peak gain 0.07) so
 * long lines don't fatigue. Rapid-fire is safe — each call creates
 * an oscillator that self-stops; no accumulation.
 * @returns {void}
 */
export function playBlip() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    // 2 ms attack, 13 ms decay to silence → 15 ms total audible pulse.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.002);
    gain.gain.linearRampToValueAtTime(0.0, now + 0.015);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  } catch {
    // Safari sometimes throws if the context was closed mid-tab-swap.
    // We swallow — the next call will re-ensure the context.
  }
}

/**
 * 500 Hz square · 30 ms with a short exponential tail. Square wave
 * gives the "click" character; the exponential tail avoids the tick
 * you get from a hard stop. Called from sceneView's `commitChoice`.
 * @returns {void}
 */
export function playChoiceSound() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = 500;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  } catch { /* see playBlip */ }
}

/**
 * Soft whoosh — band-passed white noise, decaying linearly over
 * 200 ms. Fired at the start of a scene-transition fade to sell
 * the "cut" sonically. Bandpass at 1200 Hz with Q 0.7 keeps it
 * airy (no low-end rumble, no high-end hiss).
 * @returns {void}
 */
export function playTransition() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const now = c.currentTime;
    const dur = 0.2;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      // Linear decay so the burst tails naturally; no envelope
      // on the source means we don't need a separate gain ramp.
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;
    const gain = c.createGain();
    gain.gain.value = 0.12;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(now);
    src.stop(now + dur + 0.01);
  } catch { /* see playBlip */ }
}
