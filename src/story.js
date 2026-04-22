/**
 * @file src/story.js — narrative data for "Subscribed".
 *
 * Slice A ships this module as an empty object so `src/engine.js` can
 * import it without error. Slice B will populate `STORY` with all 16
 * scene entries (S1–S9, E1–E7) keyed by scene id, shape per
 * `docs/story_spec.md` and `docs/ORCHESTRATION.md` §3.1.
 *
 * Until Slice B lands, no other module should depend on the *contents*
 * of STORY — only on the fact that it exports.
 */

/** @type {Readonly<Record<string, object>>} */
export const STORY = Object.freeze({});

export default STORY;
