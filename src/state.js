/**
 * @file src/state.js — run-time game state for "Subscribed".
 *
 * A deliberately tiny module. The state it holds is the *minimum* every
 * slice after A will need: which scene the player is on and the path
 * they took to get there. The shape may grow (e.g. pause flag, tip
 * counter) but new fields should carry a one-line comment explaining
 * the theme/mechanic they support — the state surface is the piece's
 * model of "what the transaction has cost so far."
 *
 * Slice A exposes `state` as a plain object so UI modules can read from
 * it directly; reads are tolerated, writes should go through the
 * helpers below (or through the engine, once it exists in Slice C).
 */

/** @type {{currentSceneId: (string|null), history: string[]}} */
export const state = {
  /** SceneId currently on screen, or null before startGame() runs. */
  currentSceneId: null,
  /** Ordered list of scene ids visited, oldest first. */
  history: [],
};

/**
 * Reset the game to its pre-start condition. Called by the title screen
 * on mount (so returning to title via a future "back to menu" action
 * starts cleanly), and by any future "restart" affordance.
 * @returns {void}
 */
export function reset() {
  state.currentSceneId = null;
  state.history.length = 0;
}

/**
 * Record that the player has entered a scene. Keeps the history in
 * sync with `currentSceneId`. Engine will call this from `renderScene`
 * once Slice C lands; Slice A's placeholder does not yet call it.
 * @param {string} sceneId
 * @returns {void}
 */
export function enterScene(sceneId) {
  state.currentSceneId = sceneId;
  state.history.push(sceneId);
}
