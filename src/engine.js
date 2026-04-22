/**
 * @file src/engine.js — scene state machine for "Subscribed".
 *
 * Slice A ships three stubs so `main.js` and future UI modules have a
 * stable import surface before the real engine lands in Slice C.
 * Each stub logs a single warning and no-ops — calling them will not
 * crash the app, but it will be obvious in devtools that the wiring
 * is not yet live.
 *
 * The signatures here are intentionally slightly rougher than the final
 * contract (see `docs/ORCHESTRATION.md` §3.2 when it is re-introduced):
 * Slice C will refine `renderScene(id)` → `renderScene(view)` with a
 * view object, and introduce event-based advance/choice handling.
 * Callers in Slice A accept that looseness on purpose.
 */

import { STORY } from "./story.js";
import { state } from "./state.js";

/**
 * Render the scene identified by `id`. Slice-A stub: logs a warning
 * and records the intent in `state.currentSceneId` so inspectors can
 * see what *would* have happened.
 *
 * @param {string} id — scene id (e.g. "S1"); validated against STORY
 *                      only when STORY is populated (Slice B onwards).
 * @returns {void}
 */
export function renderScene(id) {
  console.warn(`[engine] renderScene("${id}") — Slice-A stub (real impl in Slice C).`);
  if (STORY && id in STORY) {
    state.currentSceneId = id;
  }
}

/**
 * Handle a choice the player picked. Slice-A stub: logs and no-ops.
 *
 * @param {{label?: string, next?: string}} choice — the chosen option.
 * @returns {void}
 */
export function handleChoice(choice) {
  console.warn(`[engine] handleChoice(${JSON.stringify(choice)}) — Slice-A stub.`);
}

/**
 * Type `text` into `el` one character at a time. Slice-A stub:
 * sets the full text synchronously so the DOM reflects the expected
 * end-state, logs a note that the animation is not yet wired.
 *
 * @param {HTMLElement} el
 * @param {string}      text
 * @returns {{complete: () => void}} — matches the signature the real
 *                                      typewriter will expose in Slice C.
 */
export function typewriter(el, text) {
  console.warn(`[engine] typewriter() — Slice-A stub (no per-char animation yet).`);
  if (el && typeof el === "object" && "textContent" in el) {
    el.textContent = String(text ?? "");
  }
  return {
    complete() {
      if (el && typeof el === "object" && "textContent" in el) {
        el.textContent = String(text ?? "");
      }
    },
  };
}
