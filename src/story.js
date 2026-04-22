/**
 * @file src/story.js — the single source of truth for "Subscribed".
 *
 * Every scene (S1–S9) and ending (E1–E7) is defined here. All dialogue,
 * choice labels, and ending narration are transcribed byte-for-byte from
 * `docs/story_spec.md`. If the spec and this file ever disagree, the
 * spec wins and this file is stale.
 *
 * ## Shape
 *
 *   Scene:
 *     {
 *       id:         'S1',
 *       type:       'scene',
 *       title:      'The Scroll',
 *       background: 'assets/bg_*.png',
 *       character:  { sprite: 'assets/...png', position: 'center', pose: 'idle' } | null,
 *       dialogue:   [ { speaker, text, note? }, ... ],
 *       choices:    [ { id, label, next }, ... ],
 *     }
 *
 *   Ending (type === 'ending'):
 *     { id, type, title, background, character, narration, takeaway }
 *
 * ## Speaker ids (lowercase snake_case — view layer resolves display labels)
 *
 *   narrator        — third-person, Alex-aligned
 *   alex            — Alex, spoken aloud   (reserved; unused in current spec)
 *   alex_dm         — Alex typing in a DM
 *   alex_internal   — Alex's inner thought
 *   mira            — Mira, spoken aloud    (reserved; unused in current spec)
 *   mira_dm         — Mira in a DM
 *   mira_post       — Mira in a public post
 *   mira_pinned     — Mira's pinned post
 *
 * ## Decisions encoded here (confirmed with user before transcription)
 *
 *  - **S4 choice 3 → E5** (not S9, per user's flowchart). This orphans S9
 *    from the choice graph. S9 remains defined and is reachable via the
 *    dev jumper. The reachability check at the bottom of this file logs
 *    S9 as an expected orphan.
 *  - **Choice ids** use the scene-prefixed scheme (`S1_1`, `S1_2`, ...)
 *    to avoid collision with scene ids.
 *  - **Character sprites** temporarily reuse the four existing Alex PNGs
 *    (`alex_phone`, `alex_neutral`, `alex_anxious`, `alex_defeated`) as
 *    stand-ins. Slice E will draw/replace with Mira variants. Each reuse
 *    is marked `// TODO(slice-e): ...` so the follow-up is greppable.
 *  - **Background filenames** use the flatter `assets/bg_<slug>.png`
 *    naming (not the spec's `assets/bg/<slug>.png` sub-folder). Files do
 *    not exist yet; CSS hides broken-image icons. Slice E unblocks.
 *  - **Quotes** are straight ASCII everywhere. Em-dashes (U+2014) are
 *    preserved verbatim because the spec uses them.
 *  - **S9** is typed as `'ending'` per `story_spec.md`'s engine note
 *    ("treat S9 as ending: true with the second line serving as its
 *    epilogue"). Its takeaway is left empty — the spec does not author
 *    a CCHU9015 thematic line for S9.
 */

/** @typedef {'narrator'|'alex'|'alex_dm'|'alex_internal'|'mira'|'mira_dm'|'mira_post'|'mira_pinned'} SpeakerId */
/** @typedef {{ speaker: SpeakerId, text: string, note?: string }} Line */
/** @typedef {{ id: string, label: string, next: string }} Choice */
/** @typedef {{ sprite: string, position: 'left'|'center'|'right', pose: 'idle'|'happy'|'sad'|'glitch' }} Character */

/** @type {Readonly<Record<string, any>>} */
export const STORY = {
  // ===== S1 ==============================================================
  S1: {
    id: 'S1',
    type: 'scene',
    title: 'The Scroll',
    background: 'assets/bg_bedroom_night.png',
    // TODO(slice-e): replace with Mira idle avatar per spec; Alex-on-phone is a stand-in.
    character: { sprite: 'assets/alex_phone.png', position: 'center', pose: 'idle' },
    dialogue: [
      { speaker: 'narrator',  text: "A creator he follows — someone whose cosplay content he's liked for months — posts a link." },
      { speaker: 'mira_post', text: "\"New subscribers get a free welcome video. Link in bio.\"" },
      { speaker: 'narrator',  text: "Alex has seen her paid content advertised before. He's always scrolled past. But tonight, something feels different. He's tired. Lonely. Curious." },
    ],
    choices: [
      { id: 'S1_1', label: "Scroll past. It's late. He shouldn't spend money impulsively.",    next: 'E1' },
      { id: 'S1_2', label: "Click the link but don't subscribe. Just see what she offers.",    next: 'S2' },
      { id: 'S1_3', label: "Subscribe. It's $12. He's curious what she would say to him.",     next: 'S3' },
    ],
  },

  // ===== S2 ==============================================================
  S2: {
    id: 'S2',
    type: 'scene',
    title: 'The Window Shopper',
    background: 'assets/bg_phone_browser.png',
    // TODO(slice-e): Mira idle; Alex-on-phone stand-in.
    character: { sprite: 'assets/alex_phone.png', position: 'center', pose: 'idle' },
    dialogue: [
      { speaker: 'mira_pinned', text: "\"I reply to every DM within 24 hours. Tell me something about your day.\"" },
      { speaker: 'narrator',    text: "Alex stares at the subscribe button." },
    ],
    choices: [
      { id: 'S2_1', label: "Subscribe. That DM promise got him. He wants to be seen.",                                next: 'S3' },
      { id: 'S2_2', label: "Close the tab. This feels like a trap designed for lonely people. He's not that lonely.", next: 'E1' },
    ],
  },

  // ===== S3 ==============================================================
  S3: {
    id: 'S3',
    type: 'scene',
    title: 'The First Message',
    background: 'assets/bg_phone_dm.png',
    // TODO(slice-e): Mira happy.
    character: { sprite: 'assets/alex_neutral.png', position: 'center', pose: 'happy' },
    dialogue: [
      { speaker: 'mira_dm',  text: "\"Hey Alex! Thanks for subbing. I saw you're into retro gaming from your Twitter. I just finished Chrono Trigger for the first time. What's your favorite?\"" },
      { speaker: 'narrator', text: "Alex is startled. She looked at his profile. She mentioned something specific. She asked him a real question." },
    ],
    choices: [
      { id: 'S3_1', label: "Respond enthusiastically. Tell her about his favorite game. Share why it matters to him.", next: 'S4' },
      { id: 'S3_2', label: "Respond but keep it brief. Thank her for the message, ask about her content schedule.",    next: 'S5' },
      { id: 'S3_3', label: "Don't respond. This feels too intimate for someone who doesn't know him.",                 next: 'S6' },
    ],
  },

  // ===== S4 ==============================================================
  S4: {
    id: 'S4',
    type: 'scene',
    title: 'The Bond Deepens',
    background: 'assets/bg_phone_dm_warm.png',
    // TODO(slice-e): Mira happy→glitch at final line; Alex-neutral stand-in for now.
    character: { sprite: 'assets/alex_neutral.png', position: 'center', pose: 'happy' },
    dialogue: [
      { speaker: 'narrator', text: "Over the next three weeks, Alex and Mira message daily. She remembers details. She sends voice notes saying she missed talking to him." },
      { speaker: 'narrator', text: "One night, Alex sends a vulnerable message about feeling isolated in his new city. The reply comes back in 8 seconds. At 2:17 AM." },
      { speaker: 'narrator', text: "Something feels off." },
    ],
    choices: [
      { id: 'S4_1', label: "Ask directly: 'Are you real? Like, am I talking to you or someone else?'",                 next: 'S7' },
      { id: 'S4_2', label: "Ignore the suspicion. The experience still makes him feel good. He doesn't want to ruin it.", next: 'S8' },
      // User flowchart pick: D3 → E5 (spec would have routed to S9; S9 stays defined but orphaned — see top-of-file note).
      { id: 'S4_3', label: "Unsubscribe immediately. The trust is broken. He feels stupid.",                           next: 'E5' },
    ],
  },

  // ===== S5 ==============================================================
  S5: {
    id: 'S5',
    type: 'scene',
    title: 'The Transactional User',
    background: 'assets/bg_phone_dm_cool.png',
    // TODO(slice-e): Mira idle (reduced opacity per spec).
    character: { sprite: 'assets/alex_neutral.png', position: 'center', pose: 'idle' },
    dialogue: [
      { speaker: 'narrator', text: "Alex keeps his messages brief. He asks about upcoming posts and rarely shares anything personal." },
      { speaker: 'narrator', text: "After two months, the content is still good. Without the emotional hook, it feels like just content. He can find similar content for free on Reddit." },
    ],
    choices: [
      { id: 'S5_1', label: "Unsubscribe. The value isn't there anymore.",                                  next: 'E2' },
      { id: 'S5_2', label: "Stay subscribed but start engaging more personally to see if the feeling returns.", next: 'S4' },
    ],
  },

  // ===== S6 ==============================================================
  S6: {
    id: 'S6',
    type: 'scene',
    title: 'The Guarded One',
    background: 'assets/bg_phone_dm_idle.png',
    // TODO(slice-e): Mira idle.
    character: { sprite: 'assets/alex_neutral.png', position: 'center', pose: 'idle' },
    dialogue: [
      { speaker: 'mira_dm',  text: "\"Hey, no pressure to reply. Just wanted to say I hope you're having a good week.\"" },
      { speaker: 'narrator', text: "Alex feels seen, even though he didn't ask for it. He appreciates that she didn't push." },
    ],
    choices: [
      { id: 'S6_1', label: "Continue lurking. Never message. Just consume content quietly.", next: 'E3' },
      { id: 'S6_2', label: "Send a short reply. Just to acknowledge her.",                    next: 'S4' },
    ],
  },

  // ===== S7 ==============================================================
  S7: {
    id: 'S7',
    type: 'scene',
    title: 'The Confrontation',
    background: 'assets/bg_phone_dm_late.png',
    // TODO(slice-e): Mira sad.
    character: { sprite: 'assets/alex_anxious.png', position: 'center', pose: 'sad' },
    dialogue: [
      { speaker: 'alex_dm', text: "\"Are you real? Like, am I talking to you or someone else?\"" },
      { speaker: 'mira_dm', note: 'after 15 minutes', text: "\"I appreciate you asking. I use a small team to help manage messages so I can focus on creating content. But I review everything, and the connection is still real to me. I'm sorry if that wasn't clear.\"" },
      { speaker: 'narrator', text: "Alex feels a mix of relief (she told the truth) and disappointment (it wasn't just her)." },
    ],
    choices: [
      { id: 'S7_1', label: "Accept this. Stay subscribed. He still enjoys the experience.",    next: 'E4' },
      { id: 'S7_2', label: "Unsubscribe. He feels deceived. The trust is gone.",                next: 'E5' },
      { id: 'S7_3', label: "Ask for a video call to verify she's real. Offer to pay extra.",   next: 'E6' },
    ],
  },

  // ===== S8 ==============================================================
  S8: {
    id: 'S8',
    type: 'scene',
    title: 'Willful Ignorance',
    background: 'assets/bg_phone_dm_bleary.png',
    // TODO(slice-e): Mira glitch.
    character: { sprite: 'assets/alex_phone.png', position: 'center', pose: 'glitch' },
    dialogue: [
      { speaker: 'alex_internal', text: "\"The experience is good. Why ruin it?\"" },
      { speaker: 'narrator',      text: "He continues subscribing. He continues tipping. He continues feeling less lonely." },
    ],
    choices: [
      { id: 'S8_1', label: "No. He never checks. He stays subscribed for a year.", next: 'E7' },
      { id: 'S8_2', label: "Yes. One day, curiosity wins. He asks.",                next: 'S7' },
    ],
  },

  // ===== S9 (terminal, reachable only via dev jumper under flowchart_e5) ===
  S9: {
    id: 'S9',
    type: 'ending',
    title: 'The Wounded Exit',
    background: 'assets/bg_bedroom_night_after.png',
    character: null,
    narration: [
      { speaker: 'narrator',      text: "He closes the tab, then the app. The unsubscribe confirmation sits in his inbox for a week before he deletes it." },
      { speaker: 'alex_internal', text: "He can't decide whether the worst part is that he was fooled — or that for three weeks, being fooled had felt exactly like being known." },
    ],
    takeaway: '', // Spec does not author a CCHU9015 takeaway for S9; see top-of-file note.
  },

  // ===== E1 — The Skeptic ================================================
  E1: {
    id: 'E1',
    type: 'ending',
    title: 'The Skeptic',
    background: 'assets/bg_bedroom_night.png',
    character: null,
    narration: [
      { speaker: 'narrator', text: "He sets the phone face-down and doesn't check it again until morning. Nothing has changed about the apartment, or the weekend ahead, or the shape of Tuesday. He can't tell if he's proud of himself, or just unreachable." },
    ],
    takeaway: "Opting out of the market does not opt you out of the loneliness the market was built to answer.",
  },

  // ===== E2 — The Rational Consumer ======================================
  E2: {
    id: 'E2',
    type: 'ending',
    title: 'The Rational Consumer',
    background: 'assets/bg_phone_dm_cool.png',
    // TODO(slice-e): Mira idle (scene echo of S5).
    character: { sprite: 'assets/alex_neutral.png', position: 'center', pose: 'idle' },
    narration: [
      { speaker: 'narrator', text: "He cancels the subscription the same way he cancels streaming services — two clicks, no farewell. The content was fine. It was always going to be fine. He just keeps forgetting that \"fine\" isn't what he was paying for." },
    ],
    takeaway: "When intimacy is stripped from the transaction, what's left is content — and content is always cheaper elsewhere.",
  },

  // ===== E3 — The Silent Observer ========================================
  E3: {
    id: 'E3',
    type: 'ending',
    title: 'The Silent Observer',
    background: 'assets/bg_phone_browser.png',
    // TODO(slice-e): Mira idle (scene echo of S2/S6).
    character: { sprite: 'assets/alex_anxious.png', position: 'center', pose: 'idle' },
    narration: [
      { speaker: 'narrator', text: "He watches for months without speaking. She never writes again. He tells himself this is the honest version of the arrangement — he pays, she performs, nobody pretends otherwise. The lie inside that is so small he almost doesn't notice it." },
    ],
    takeaway: "Silence inside a parasocial economy is not neutrality; it is a subscription paid in attention alone.",
  },

  // ===== E4 — The Informed Realist =======================================
  E4: {
    id: 'E4',
    type: 'ending',
    title: 'The Informed Realist',
    background: 'assets/bg_phone_dm_late.png',
    // TODO(slice-e): Mira sad (scene echo of S7).
    character: { sprite: 'assets/alex_defeated.png', position: 'center', pose: 'sad' },
    narration: [
      { speaker: 'narrator', text: "He stays. The messages come a little slower now, because he pays attention to them differently. He's made peace with knowing, which he didn't expect. Peace, he realises, is just disappointment you've had enough time to arrange." },
    ],
    takeaway: "Informed consumption is not the opposite of illusion — it is a negotiated one.",
  },

  // ===== E5 — The Betrayed ===============================================
  E5: {
    id: 'E5',
    type: 'ending',
    title: 'The Betrayed',
    background: 'assets/bg_bedroom_night_after.png',
    character: null,
    narration: [
      { speaker: 'narrator', text: "He unsubscribes and feels the specific stupidity of having been moved by an inbox staffed in shifts. The anger cools into something worse within a day. He isn't angry at her, exactly — he's angry that the part of him that answered back was real." },
    ],
    takeaway: "The wound of parasocial attachment lands hardest on the consumer, because only one side was ever bringing anything real.",
  },

  // ===== E6 — The Verification Seeker ====================================
  E6: {
    id: 'E6',
    type: 'ending',
    title: 'The Verification Seeker',
    background: 'assets/bg_phone_dm_late.png',
    // TODO(slice-e): Mira sad (scene echo of S7).
    character: { sprite: 'assets/alex_defeated.png', position: 'center', pose: 'sad' },
    narration: [
      { speaker: 'narrator', text: "He sends the extra money before he can think about it. Whatever she does on the call, whatever is proved, he knows already what it will cost to need proof. He pays, and pays again, to be sure of something that used to be free." },
    ],
    takeaway: "When intimacy is something you purchase, verification becomes another product on the shelf.",
  },

  // ===== E7 — The Happy Ignorant =========================================
  E7: {
    id: 'E7',
    type: 'ending',
    title: 'The Happy Ignorant',
    background: 'assets/bg_phone_dm_bleary.png',
    // TODO(slice-e): Mira glitch (scene echo of S8).
    character: { sprite: 'assets/alex_phone.png', position: 'center', pose: 'glitch' },
    narration: [
      { speaker: 'narrator', text: "A year goes by. He's less lonely than he was. He doesn't ask the question, and the not-asking becomes a small muscle he's learned to keep flexed. Somewhere in the ledger, he knows, he is paying for the flexing too." },
    ],
    takeaway: "Some forms of happiness are subscription services — renewed monthly, auto-billed, terms of service unread.",
  },
};

/**
 * Deep-freeze so no UI module can accidentally mutate STORY at runtime.
 * State that legitimately changes (currentSceneId, history, visitedScenes)
 * lives in state.js, not here.
 * @template T
 * @param {T} obj
 * @returns {Readonly<T>}
 */
function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    for (const key of Object.keys(obj)) deepFreeze(obj[key]);
    Object.freeze(obj);
  }
  return obj;
}
deepFreeze(STORY);

// ---------------------------------------------------------------------------
// Dev-only reachability check (opt-in via localStorage dev flag).
// Logs reachable set size and any orphans. S9 is an expected orphan under
// the current flowchart decision; any other orphan is a story-data bug.
// ---------------------------------------------------------------------------

if (
  typeof window !== 'undefined'
  && typeof window.localStorage !== 'undefined'
  && window.localStorage.getItem('dev') === 'true'
) {
  const allIds = Object.keys(STORY);
  const reachable = new Set();
  const queue = ['S1'];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || reachable.has(id)) continue;
    if (!(id in STORY)) {
      console.error(`[story] dangling next pointer: "${id}" not in STORY`);
      continue;
    }
    reachable.add(id);
    const node = STORY[id];
    if (Array.isArray(node.choices)) {
      for (const ch of node.choices) {
        if (typeof ch.next === 'string' && !reachable.has(ch.next)) queue.push(ch.next);
      }
    }
  }
  const orphans = allIds.filter((id) => !reachable.has(id));
  const expectedOrphans = new Set(['S9']);
  const unexpectedOrphans = orphans.filter((id) => !expectedOrphans.has(id));

  console.info(
    `[story] reachable from S1: ${reachable.size}/${allIds.length}`
    + (orphans.length ? ` · orphans: ${orphans.join(', ')}` : ''),
  );
  if (unexpectedOrphans.length > 0) {
    console.error(
      `[story] UNEXPECTED orphans (data bug): ${unexpectedOrphans.join(', ')}`,
    );
  }
}

export default STORY;
