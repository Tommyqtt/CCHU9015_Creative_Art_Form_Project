/**
 * @file src/state.js — run-time game state for "Subscribed".
 *
 * A deliberately tiny module. The shape it holds is the *minimum* the
 * engine and UI need to render the current scene and reconstruct how
 * the player arrived: which scene is on screen, the ordered path taken,
 * and the deduplicated set of scenes visited. Reads are tolerated from
 * anywhere; writes should funnel through `recordVisit()` (from the
 * engine) or `reset()` (from main.js on a return-to-title).
 *
 * The piece's theme is transactional intimacy; `history` and
 * `visitedScenes` are the model of "what the transaction has cost so
 * far" and can be surfaced in a future epilogue / credits screen.
 */

/**
 * @typedef {Object} GameState
 * @property {string|null} currentSceneId  SceneId currently on screen, null pre-start.
 * @property {string[]}    history         Ordered sequence of scene ids visited (may repeat).
 * @property {Set<string>} visitedScenes   Deduplicated set of scene ids visited so far.
 */

/** @type {GameState} */
export const state = {
  currentSceneId: null,
  history: [],
  visitedScenes: new Set(),
};

/**
 * Reset to pre-start condition. Called by main.js on a return-to-title
 * and on the initial boot. Does not itself render; the caller decides
 * what to show next (typically the title, and from there the player
 * chooses to re-enter S1).
 * @returns {void}
 */
export function reset() {
  state.currentSceneId = null;
  state.history.length = 0;
  state.visitedScenes.clear();
}

/**
 * Record that the player has just entered a scene. The engine calls
 * this from `renderScene()` before the view is mounted, so the state
 * and the DOM agree on the current scene even if the view mount
 * throws partway through.
 *
 * `history` preserves revisits (e.g. S5 → S4 → S5 shows up twice);
 * `visitedScenes` is deduped so UI can cheaply ask "have we been here?"
 *
 * @param {string} sceneId
 * @returns {void}
 */
export function recordVisit(sceneId) {
  state.currentSceneId = sceneId;
  state.history.push(sceneId);
  state.visitedScenes.add(sceneId);
}

/**
 * @deprecated since Slice B — kept as an alias so any lingering Slice-A
 * import sites continue to compile. New code should call `recordVisit()`.
 * @param {string} sceneId
 * @returns {void}
 */
export function enterScene(sceneId) {
  recordVisit(sceneId);
}
