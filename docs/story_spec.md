# Story Spec — "Subscribed"

> Authoritative narrative reference for `src/story.js`. Consolidates the two source files and fills the gaps they leave open, so the implementer can key straight off a single document.
>
> **Sources:**
> - `docs/story line tree diagram.png` — full branching flowchart
> - `docs/script.pptx` — scene descriptions and dialogue
>
> **Course context:** HKU CCHU9015 — *Sex and Intimacy in Modern Times*. Themes: parasocial relationships, digital intimacy, the transactional nature of modern online connection. Tone is melancholic and self-aware; never preachy or melodramatic.

## Canon vs. authored

- **Canon** — scenes S1–S8, their dialogue, and all choice labels come verbatim from `script.pptx`.
- **Authored** — Scene 9 prose, all seven ending epilogues, the creator's name ("Mira"), background filenames, and character poses are **not in the source files**. They are inferences from the tree diagram and `.cursorrules`. Lines authored for this spec are marked with `> authored` blockquotes so drift from any future script update stays visible.

---

## Scene-choice-outcome matrix

| From | Choice label (verbatim) | → Next | Branch flavor |
|---|---|---|---|
| **S1** | Scroll past. It's late. He shouldn't spend money impulsively. | E1 | Refusal |
| **S1** | Click the link but don't subscribe. Just see what she offers. | S2 | Window-shop |
| **S1** | Subscribe. It's $12. He's curious what she would say to him. | S3 | Commit |
| **S2** | Subscribe. That DM promise got him. He wants to be seen. | S3 | Commit (seeking recognition) |
| **S2** | Close the tab. This feels like a trap designed for lonely people. He's not that lonely. | E1 | Refusal (with self-denial) |
| **S3** | Respond enthusiastically. Tell her about his favorite game. Share why it matters to him. | S4 | Emotional investment |
| **S3** | Respond but keep it brief. Thank her for the message, ask about her content schedule. | S5 | Transactional |
| **S3** | Don't respond. This feels too intimate for someone who doesn't know him. | S6 | Guarded |
| **S4** | Ask directly: "Are you real? Like, am I talking to you or someone else?" | S7 | Seek truth |
| **S4** | Ignore the suspicion. The experience still makes him feel good. He doesn't want to ruin it. | S8 | Willful ignorance |
| **S4** | Unsubscribe immediately. The trust is broken. He feels stupid. | S9 | Wounded exit |
| **S5** | Unsubscribe. The value isn't there anymore. | E2 | Rational consumer |
| **S5** | Stay subscribed but start engaging more personally to see if the feeling returns. | S4 | Re-enter the bond |
| **S6** | Continue lurking. Never message. Just consume content quietly. | E3 | Silent observer |
| **S6** | Send a short reply. Just to acknowledge her. | S4 | Slow-burn entry |
| **S7** | Accept this. Stay subscribed. He still enjoys the experience. | E4 | Informed realist |
| **S7** | Unsubscribe. He feels deceived. The trust is gone. | E5 | Betrayed |
| **S7** | Ask for a video call to verify she's real. Offer to pay extra. | E6 | Verification seeker |
| **S8** | No. He never checks. He stays subscribed for a year. | E7 | Happy ignorant |
| **S8** | Yes. One day, curiosity wins. He asks. | S7 | Delayed truth-seek |

Terminal: **S9** has no choices — it functions as an implicit ending (see S9 entry below).

---

## Characters

- **Alex** — 28, marketing coordinator. Moved to a new city two years ago for work. Has a few work friends but no one close. Scrolls Twitter and Reddit daily; follows gaming, tech reviews, fitness, a handful of cosplay creators. Has subscribed to creators before, never for more than two months. Wants genuine connection, suspects what he's getting is performative, keeps paying anyway.
- **Mira** — the creator. Cosplay content. Operates with a small message-assistance team, which she does not initially disclose. Speaks in casual, warm, friend-register DMs. *Name is authored for this spec; the script refers to her only as "the creator" / "she."*
- **Narrator** — third-person, Alex-aligned. Describes setting, atmosphere, and Alex's internal state.

---

## Scenes

### S1 — The Scroll

- **Setting:** Thursday night, 11:47 PM. Alex is in bed, phone in hand, unable to sleep. He's been scrolling Twitter for an hour.
- **Atmosphere:** Late-night blue glow. Quiet apartment. `--navy` dominates; `--cyan` phone light. Low ambient anxiety.
- **Background:** `assets/bg/bedroom-night.png`
- **Character:** `assets/chars/mira.png` — pose: `idle` *(shown only as a small profile-photo avatar on a Twitter post, not full sprite)*
- **Dialogue:**
  - *Narrator:* A creator he follows — someone whose cosplay content he's liked for months — posts a link.
  - *Mira (post):* "New subscribers get a free welcome video. Link in bio."
  - *Narrator:* Alex has seen her paid content advertised before. He's always scrolled past. But tonight, something feels different. He's tired. Lonely. Curious.
- **Choices:**
  1. "Scroll past. It's late. He shouldn't spend money impulsively." → **E1**
  2. "Click the link but don't subscribe. Just see what she offers." → **S2**
  3. "Subscribe. It's $12. He's curious what she would say to him." → **S3**

---

### S2 — The Window Shopper

- **Setting:** Alex clicks the link. The preview page shows a grid of photos — some suggestive, some surprisingly mundane: her making coffee, her laughing at a cat video, her in workout clothes. The captions are casual, like she's talking to a friend.
- **Atmosphere:** The algorithmic shop-window — bright, curated, faintly clinical. `--pink` accents on the grid; `--cyan` on the subscribe button, which pulses.
- **Background:** `assets/bg/phone-browser.png`
- **Character:** `assets/chars/mira.png` — pose: `idle` *(shown in preview photos)*
- **Dialogue:**
  - *Mira (pinned post):* "I reply to every DM within 24 hours. Tell me something about your day."
  - *Narrator:* Alex stares at the subscribe button.
- **Choices:**
  1. "Subscribe. That DM promise got him. He wants to be seen." → **S3**
  2. "Close the tab. This feels like a trap designed for lonely people. He's not that lonely." → **E1**

---

### S3 — The First Message

- **Setting:** Alex subscribes. Within minutes, he receives an automated welcome message with a link to the free video. He watches it. It's fine. But then, two hours later, another message appears.
- **Atmosphere:** The hook lands. Phone screen warms from clinical `--cyan` to a softer `--pink`-tinted DM thread. Alex sits up a little.
- **Background:** `assets/bg/phone-dm.png`
- **Character:** `assets/chars/mira.png` — pose: `happy`
- **Dialogue:**
  - *Mira (DM):* "Hey Alex! Thanks for subbing. I saw you're into retro gaming from your Twitter. I just finished Chrono Trigger for the first time. What's your favorite?"
  - *Narrator:* Alex is startled. She looked at his profile. She mentioned something specific. She asked him a real question.
- **Choices:**
  1. "Respond enthusiastically. Tell her about his favorite game. Share why it matters to him." → **S4**
  2. "Respond but keep it brief. Thank her for the message, ask about her content schedule." → **S5**
  3. "Don't respond. This feels too intimate for someone who doesn't know him." → **S6**

---

### S4 — The Bond Deepens

- **Setting:** Over the next three weeks, Alex and Mira message daily. She remembers details — his work stress, his cat's name, his upcoming vacation. She sends voice notes saying she missed talking to him. He starts checking his phone first thing in the morning. He's tipped her an extra $50 this month. He's thinking about her during work. Then, one night: Alex sends a vulnerable message about feeling isolated in his new city. The reply comes back in 8 seconds. At 2:17 AM. The grammar is flawless. The tone is warm but... generic.
- **Atmosphere:** Warm-then-wrong. `--pink` dominates early, then a single `--amber` flicker at the moment of doubt. A slight `glitch` frame on Mira's portrait when the 8-second reply lands.
- **Background:** `assets/bg/phone-dm-warm.png`
- **Character:** `assets/chars/mira.png` — pose: `happy` → `glitch` at the final line
- **Dialogue:**
  - *Narrator:* Over the next three weeks, Alex and Mira message daily. She remembers details. She sends voice notes saying she missed talking to him.
  - *Narrator:* One night, Alex sends a vulnerable message about feeling isolated in his new city. The reply comes back in 8 seconds. At 2:17 AM.
  - *Narrator:* Something feels off.
- **Choices:**
  1. "Ask directly: 'Are you real? Like, am I talking to you or someone else?'" → **S7**
  2. "Ignore the suspicion. The experience still makes him feel good. He doesn't want to ruin it." → **S8**
  3. "Unsubscribe immediately. The trust is broken. He feels stupid." → **S9**

---

### S5 — The Transactional User

- **Setting:** Alex keeps his messages brief and content-focused. He asks about upcoming posts, requests specific photo sets, and rarely shares personal information. Mira still replies warmly, but Alex doesn't engage emotionally. After two months, he notices his interest fading. The content is still good, but without the emotional hook, it feels like… just content. He can find similar content for free on Reddit.
- **Atmosphere:** Cool, sparse, efficient. `--ghost` muted palette; low saturation; Mira's sprite appears at reduced opacity to suggest distance.
- **Background:** `assets/bg/phone-dm-cool.png`
- **Character:** `assets/chars/mira.png` — pose: `idle`
- **Dialogue:**
  - *Narrator:* Alex keeps his messages brief. He asks about upcoming posts and rarely shares anything personal.
  - *Narrator:* After two months, the content is still good. Without the emotional hook, it feels like just content. He can find similar content for free on Reddit.
- **Choices:**
  1. "Unsubscribe. The value isn't there anymore." → **E2**
  2. "Stay subscribed but start engaging more personally to see if the feeling returns." → **S4**

---

### S6 — The Guarded One

- **Setting:** Alex doesn't reply to the first message. He continues watching her content but never initiates conversation. Three days later, Mira sends a follow-up.
- **Atmosphere:** Quiet, pending. A half-typed reply that never sends. `--ghost` on the unanswered thread, `--pink` on the new message that arrives unprompted.
- **Background:** `assets/bg/phone-dm-idle.png`
- **Character:** `assets/chars/mira.png` — pose: `idle`
- **Dialogue:**
  - *Mira (DM):* "Hey, no pressure to reply. Just wanted to say I hope you're having a good week."
  - *Narrator:* Alex feels seen, even though he didn't ask for it. He appreciates that she didn't push.
- **Choices:**
  1. "Continue lurking. Never message. Just consume content quietly." → **E3**
  2. "Send a short reply. Just to acknowledge her." → **S4**

---

### S7 — The Confrontation

- **Setting:** Alex asks directly. The reply comes after 15 minutes — the longest she's ever taken.
- **Atmosphere:** A held breath. `--amber` tint on the thread while the typing indicator pulses, then resolves into `--ghost`.
- **Background:** `assets/bg/phone-dm-late.png`
- **Character:** `assets/chars/mira.png` — pose: `sad`
- **Dialogue:**
  - *Alex (DM):* "Are you real? Like, am I talking to you or someone else?"
  - *Mira (DM, after 15 minutes):* "I appreciate you asking. I use a small team to help manage messages so I can focus on creating content. But I review everything, and the connection is still real to me. I'm sorry if that wasn't clear."
  - *Narrator:* Alex feels a mix of relief (she told the truth) and disappointment (it wasn't just her).
- **Choices:**
  1. "Accept this. Stay subscribed. He still enjoys the experience." → **E4**
  2. "Unsubscribe. He feels deceived. The trust is gone." → **E5**
  3. "Ask for a video call to verify she's real. Offer to pay extra." → **E6**

---

### S8 — Willful Ignorance

- **Setting:** Alex notices the signs — the fast replies, the perfect grammar, the slightly generic warmth. But he chooses not to investigate.
- **Atmosphere:** Comfortable and wrong. Palette looks warm at first glance but subtly desaturated on a second look. Mira's portrait flickers between `happy` and `glitch` at random intervals; Alex never looks directly at it.
- **Background:** `assets/bg/phone-dm-bleary.png`
- **Character:** `assets/chars/mira.png` — pose: `glitch`
- **Dialogue:**
  - *Alex (internal):* "The experience is good. Why ruin it?"
  - *Narrator:* He continues subscribing. He continues tipping. He continues feeling less lonely.
- **Choices:**
  1. "No. He never checks. He stays subscribed for a year." → **E7**
  2. "Yes. One day, curiosity wins. He asks." → **S7**

---

### S9 — The Wounded Exit

> authored *(entire scene — not in `script.pptx`)*

- **Setting:** Alex unsubscribes the same night. The confirmation email sits in his inbox for a week before he deletes it. He doesn't open the app again. He doesn't tell anyone. The studio apartment is very quiet without the phone lighting up.
- **Atmosphere:** Aftermath. Same bedroom as S1, but the phone is face-down. `--navy` and `--ghost` only; no accent colour. Silence functions like weight.
- **Background:** `assets/bg/bedroom-night-after.png`
- **Character:** `null` *(Mira is absent — the break is the point)*
- **Dialogue:**
  - *Narrator:* He closes the tab, then the app. The unsubscribe confirmation sits in his inbox for a week before he deletes it.
  - *Alex (internal):* He can't decide whether the worst part is that he was fooled — or that for three weeks, being fooled had felt exactly like being known.
- **Choices:** *(none — terminal scene)*
- **Engine note:** Treat S9 as `ending: true` with the second narrator/Alex line serving as its epilogue, so the existing ending-screen pathway handles the fade-out. The tree diagram leaves S9 terminal; the spec follows suit rather than fabricating a follow-up choice.

---

## Endings

All ending narration below is **authored** for this spec; the source files name the endings but do not provide epilogue text.

### E1 — The Skeptic

- **Reached from:** S1 ("Scroll past…"), S2 ("Close the tab…")
- **Emotional tone:** Detached relief, tinged with a question he can't quite close.
- **Background:** `assets/bg/bedroom-night.png`
- **Final narration:**
  > authored
  > He sets the phone face-down and doesn't check it again until morning. Nothing has changed about the apartment, or the weekend ahead, or the shape of Tuesday. He can't tell if he's proud of himself, or just unreachable.
- **Thematic takeaway (CCHU9015):** *Opting out of the market does not opt you out of the loneliness the market was built to answer.*

---

### E2 — The Rational Consumer

- **Reached from:** S5 ("Unsubscribe. The value isn't there anymore.")
- **Emotional tone:** Flat satisfaction of a completed transaction, with a hairline crack in it.
- **Background:** `assets/bg/phone-dm-cool.png`
- **Final narration:**
  > authored
  > He cancels the subscription the same way he cancels streaming services — two clicks, no farewell. The content was fine. It was always going to be fine. He just keeps forgetting that "fine" isn't what he was paying for.
- **Thematic takeaway (CCHU9015):** *When intimacy is stripped from the transaction, what's left is content — and content is always cheaper elsewhere.*

---

### E3 — The Silent Observer

- **Reached from:** S6 ("Continue lurking…")
- **Emotional tone:** A quiet, unexamined agreement with nobody in particular.
- **Background:** `assets/bg/phone-browser.png`
- **Final narration:**
  > authored
  > He watches for months without speaking. She never writes again. He tells himself this is the honest version of the arrangement — he pays, she performs, nobody pretends otherwise. The lie inside that is so small he almost doesn't notice it.
- **Thematic takeaway (CCHU9015):** *Silence inside a parasocial economy is not neutrality; it is a subscription paid in attention alone.*

---

### E4 — The Informed Realist

- **Reached from:** S7 ("Accept this. Stay subscribed…")
- **Emotional tone:** Measured peace that is indistinguishable, on some nights, from resignation.
- **Background:** `assets/bg/phone-dm-late.png`
- **Final narration:**
  > authored
  > He stays. The messages come a little slower now, because he pays attention to them differently. He's made peace with knowing, which he didn't expect. Peace, he realises, is just disappointment you've had enough time to arrange.
- **Thematic takeaway (CCHU9015):** *Informed consumption is not the opposite of illusion — it is a negotiated one.*

---

### E5 — The Betrayed

- **Reached from:** S7 ("Unsubscribe. He feels deceived…")
- **Emotional tone:** Sharp embarrassment that cools into something harder to name.
- **Background:** `assets/bg/bedroom-night-after.png`
- **Final narration:**
  > authored
  > He unsubscribes and feels the specific stupidity of having been moved by an inbox staffed in shifts. The anger cools into something worse within a day. He isn't angry at her, exactly — he's angry that the part of him that answered back was real.
- **Thematic takeaway (CCHU9015):** *The wound of parasocial attachment lands hardest on the consumer, because only one side was ever bringing anything real.*

---

### E6 — The Verification Seeker

- **Reached from:** S7 ("Ask for a video call to verify she's real…")
- **Emotional tone:** Transactional reassurance; the uneasy feeling of paying twice for one thing.
- **Background:** `assets/bg/phone-dm-late.png`
- **Final narration:**
  > authored
  > He sends the extra money before he can think about it. Whatever she does on the call, whatever is proved, he knows already what it will cost to need proof. He pays, and pays again, to be sure of something that used to be free.
- **Thematic takeaway (CCHU9015):** *When intimacy is something you purchase, verification becomes another product on the shelf.*

---

### E7 — The Happy Ignorant

- **Reached from:** S8 ("No. He never checks. He stays subscribed for a year.")
- **Emotional tone:** Functional contentment, quietly maintained.
- **Background:** `assets/bg/phone-dm-bleary.png`
- **Final narration:**
  > authored
  > A year goes by. He's less lonely than he was. He doesn't ask the question, and the not-asking becomes a small muscle he's learned to keep flexed. Somewhere in the ledger, he knows, he is paying for the flexing too.
- **Thematic takeaway (CCHU9015):** *Some forms of happiness are subscription services — renewed monthly, auto-billed, terms of service unread.*

---

## Appendix

### Pose vocabulary (for the asset artist)

Poses referenced across the spec. Each needs a sprite at `assets/chars/mira.png` with frames selectable via `characterPose`:

- `idle` — neutral, distant avatar register (S1, S2, S5, S6)
- `happy` — warm smile, direct eye-line (S3, early S4)
- `sad` — downcast, apologetic (S7)
- `glitch` — brief RGB offset / duplicated silhouette, ~120ms flicker (late S4, S8)

`null` (no character on screen) is used in S9 and in endings where Mira is structurally absent (E1, E5).

### Background asset list

| Filename | First use | Reused by |
|---|---|---|
| `assets/bg/bedroom-night.png` | S1 | E1 |
| `assets/bg/phone-browser.png` | S2 | E3 |
| `assets/bg/phone-dm.png` | S3 | — |
| `assets/bg/phone-dm-warm.png` | S4 | — |
| `assets/bg/phone-dm-cool.png` | S5 | E2 |
| `assets/bg/phone-dm-idle.png` | S6 | — |
| `assets/bg/phone-dm-late.png` | S7 | E4, E6 |
| `assets/bg/phone-dm-bleary.png` | S8 | E7 |
| `assets/bg/bedroom-night-after.png` | S9 | E5 |

Nine unique backgrounds total — reuse is deliberate so the palette economy reads as a closed loop.

### Palette recall (from `.cursorrules`)

| Var | Colour | Scene lean |
|---|---|---|
| `--navy` | `#0f1020` | S1, S9, E1, E5 (quiet, alone) |
| `--cyan` | `#6ee7ff` | S2, S3 (phone-glow, invitation) |
| `--pink` | `#ff6fb5` | S3, S4, S6 (the romance accent) |
| `--amber` | `#ffb347` | S4 flicker, S7 (warning, money) |
| `--ghost` | `#7a7f9a` | S5, S6, S9, E2 (muted, distant) |

### Reading this spec for `src/story.js`

Each scene entry maps 1:1 to a `story.js` object: `id` = section header, `title` = header text after the em-dash, `background` = the Background field, `character` / `characterPose` = the Character field, `dialogue[]` = the Dialogue lines in order (split `speaker` / `text`), `choices[]` = the Choices list. Endings follow the same shape with `choices: []`, `ending: true`, and `epilogue` = the Final narration block.
