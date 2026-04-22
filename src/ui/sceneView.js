/**
 * @file src/ui/sceneView.js — renders a `type === 'scene'` entry from STORY.
 *
 * Layout (bottom-up in DOM):
 *   <main class="scene" data-scene-id="...">
 *     <div class="scene__stage">
 *       <img class="scene__bg" />
 *       <img class="scene__char" />
 *     </div>
 *     <section class="scene__dialogue" aria-live="polite">
 *       <p class="scene__speaker" data-speaker="..."></p>
 *       <p class="scene__text"></p>
 *     </section>
 *     <section class="scene__choices" aria-label="Choices">
 *       <button class="btn scene__choice">1. label</button> ...
 *     </section>
 *     <p class="scene__hint">Click or press Enter / Space to continue.</p>
 *   </main>
 *
 * Interaction model:
 *   - On mount, start typewriter on line 0 immediately.
 *   - Click / Enter / Space:
 *       * if still typing → skip to end of current line
 *       * if line done and more lines remain → advance to next line
 *       * if all lines typed and choices not shown → show choices
 *       * if choices shown → no-op (button clicks handle it)
 *   - 1 / 2 / 3 (while choices shown) → pick the matching choice.
 *   - Focus moves to the first choice button when choices appear.
 *
 * The view never reads from `STORY` directly; everything comes from
 * the `scene` argument and the `ctx.onChoice` callback.
 */

import { typewriter } from '../engine.js';

/**
 * Display-label lookup for speaker ids. Keeps styling (colour per
 * speaker) driven by the `data-speaker` attribute, not by mixing
 * label strings into dialogue text.
 */
const SPEAKER_LABELS = {
  narrator:      'Narrator',
  alex:          'Alex',
  alex_dm:       'Alex (DM)',
  alex_internal: 'Alex (internal)',
  mira:          'Mira',
  mira_dm:       'Mira (DM)',
  mira_post:     'Mira (post)',
  mira_pinned:   'Mira (pinned post)',
};

/**
 * Build a speaker label, injecting an optional timing/modifier note
 * into the existing parenthesis (if any) or appending one.
 *   displayLabel('mira_dm', 'after 15 minutes')
 *     → 'Mira (DM, after 15 minutes)'
 *   displayLabel('alex')
 *     → 'Alex'
 * @param {string}  speakerId
 * @param {string=} note
 * @returns {string}
 */
function displayLabel(speakerId, note) {
  const base = SPEAKER_LABELS[speakerId] ?? (speakerId ?? '');
  if (!note) return base;
  if (base.endsWith(')')) return `${base.slice(0, -1)}, ${note})`;
  return `${base} (${note})`;
}

/**
 * Mount the scene view into `root`, replacing any previous content.
 * @param {HTMLElement} root
 * @param {any}         scene  — a STORY[id] entry with type === 'scene'.
 * @param {{onChoice: (choice: any) => void}} ctx
 * @returns {{unmount: () => void}}
 */
export function mountSceneView(root, scene, ctx) {
  if (!root) throw new Error('mountSceneView: root element is required.');
  if (!scene) throw new Error('mountSceneView: scene is required.');
  const onChoice = typeof ctx?.onChoice === 'function' ? ctx.onChoice : () => {};

  while (root.firstChild) root.removeChild(root.firstChild);

  // --- structure -------------------------------------------------------
  const sceneEl = document.createElement('main');
  sceneEl.className = 'scene';
  sceneEl.dataset.sceneId = scene.id ?? '';

  const stage = document.createElement('div');
  stage.className = 'scene__stage';

  const bg = document.createElement('img');
  bg.className = 'scene__bg';
  bg.src = typeof scene.background === 'string' ? scene.background : '';
  bg.alt = '';
  bg.setAttribute('aria-hidden', 'true');
  // Hide the broken-image icon if the asset doesn't exist yet (Slice E).
  bg.addEventListener('error', () => { bg.classList.add('is-hidden'); });

  const charEl = document.createElement('img');
  charEl.className = 'scene__char';
  charEl.alt = '';
  charEl.setAttribute('aria-hidden', 'true');
  if (scene.character && typeof scene.character.sprite === 'string') {
    charEl.src = scene.character.sprite;
    charEl.dataset.pose = scene.character.pose ?? 'idle';
    charEl.dataset.position = scene.character.position ?? 'center';
    charEl.addEventListener('error', () => { charEl.classList.add('is-hidden'); });
  } else {
    charEl.classList.add('is-hidden');
    charEl.src = '';
  }

  stage.append(bg, charEl);

  const dialogueEl = document.createElement('section');
  dialogueEl.className = 'scene__dialogue';
  dialogueEl.setAttribute('aria-live', 'polite');

  const speakerEl = document.createElement('p');
  speakerEl.className = 'scene__speaker';

  const textEl = document.createElement('p');
  textEl.className = 'scene__text';

  dialogueEl.append(speakerEl, textEl);

  const choicesEl = document.createElement('section');
  choicesEl.className = 'scene__choices is-hidden';
  choicesEl.setAttribute('aria-label', 'Choices');

  const hintEl = document.createElement('p');
  hintEl.className = 'scene__hint';
  hintEl.textContent = 'Click or press Enter / Space to continue.';

  sceneEl.append(stage, dialogueEl, choicesEl, hintEl);
  root.appendChild(sceneEl);

  // --- state -----------------------------------------------------------
  const dialogue = Array.isArray(scene.dialogue) ? scene.dialogue : [];
  const choices  = Array.isArray(scene.choices)  ? scene.choices  : [];
  /** @type {{skip: () => void} | null} */
  let typingHandle = null;
  let typingDone = true;
  let lineIndex = -1;
  let choicesShown = false;

  // --- line progression -----------------------------------------------
  function startLine(i) {
    const line = dialogue[i];
    if (!line) return;
    speakerEl.textContent = displayLabel(line.speaker, line.note);
    speakerEl.dataset.speaker = line.speaker ?? '';
    typingDone = false;
    const handle = typewriter(textEl, line.text ?? '');
    typingHandle = handle;
    handle.then(() => {
      // Only mark done if this is still the current line (no race with unmount).
      if (typingHandle === handle) typingDone = true;
    });
  }

  function showChoices() {
    if (choicesShown) return;
    choicesShown = true;
    hintEl.textContent = 'Click a choice, or press 1 / 2 / 3.';
    if (choices.length === 0) return;
    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn scene__choice';
      if (typeof choice.id === 'string')   btn.dataset.choiceId = choice.id;
      if (typeof choice.next === 'string') btn.dataset.next = choice.next;
      const num = document.createElement('span');
      num.className = 'scene__choice-num';
      num.textContent = `${idx + 1}.`;
      const lbl = document.createElement('span');
      lbl.className = 'scene__choice-label';
      lbl.textContent = choice.label ?? '';
      btn.append(num, lbl);
      btn.addEventListener('click', () => onChoice(choice));
      choicesEl.appendChild(btn);
    });
    choicesEl.classList.remove('is-hidden');
    queueMicrotask(() => {
      const first = choicesEl.querySelector('.scene__choice');
      if (first instanceof HTMLElement) first.focus();
    });
  }

  function advance() {
    if (choicesShown) return;
    if (!typingDone && typingHandle && typeof typingHandle.skip === 'function') {
      typingHandle.skip();
      return;
    }
    if (lineIndex + 1 < dialogue.length) {
      lineIndex += 1;
      startLine(lineIndex);
    } else {
      showChoices();
    }
  }

  // --- input wiring ---------------------------------------------------
  function isFromDevJumper(target) {
    return target instanceof Element && target.closest('.dev-jumper') !== null;
  }

  function isFromChoiceButton(target) {
    return target instanceof Element && target.closest('.scene__choice') !== null;
  }

  function onKey(ev) {
    if (ev.defaultPrevented) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (isFromDevJumper(ev.target)) return;
    // Don't hijack typing in inputs (no scene has inputs today, future-proofing).
    if (ev.target instanceof HTMLInputElement) return;
    if (ev.target instanceof HTMLTextAreaElement) return;
    if (ev.target instanceof HTMLSelectElement) return;

    if (choicesShown) {
      if (/^[1-9]$/.test(ev.key)) {
        const idx = Number(ev.key) - 1;
        if (idx >= 0 && idx < choices.length) {
          ev.preventDefault();
          onChoice(choices[idx]);
        }
      }
      // Enter / Space on choice buttons is handled natively.
      return;
    }

    if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
      // Letting a focused non-choice button swallow Enter is fine.
      if (ev.target instanceof HTMLButtonElement) return;
      ev.preventDefault();
      advance();
    }
  }
  document.addEventListener('keydown', onKey);

  function onClick(ev) {
    if (isFromDevJumper(ev.target)) return;
    if (isFromChoiceButton(ev.target)) return; // the button's handler fires
    if (choicesShown) return;
    advance();
  }
  sceneEl.addEventListener('click', onClick);

  // --- kickoff --------------------------------------------------------
  if (dialogue.length > 0) {
    lineIndex = 0;
    startLine(0);
  } else {
    showChoices();
  }

  return {
    unmount() {
      document.removeEventListener('keydown', onKey);
      if (typingHandle && typeof typingHandle.skip === 'function') typingHandle.skip();
      typingHandle = null;
      while (root.firstChild) root.removeChild(root.firstChild);
    },
  };
}
