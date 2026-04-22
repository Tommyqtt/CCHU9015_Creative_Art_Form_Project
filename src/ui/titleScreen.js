/**
 * @file src/ui/titleScreen.js — renders the "SUBSCRIBED" title card.
 *
 * A small UI module. Mounts into a root element, wires Start + About
 * buttons, and lets the caller decide what "Start" means (Slice A:
 * swap to the scene-view placeholder). Enter on the document also
 * triggers Start while this screen is mounted, so the piece can be
 * played one-handed if needed.
 *
 * Copy here is authored for Slice A — it is *not* in story_spec.md —
 * so keep it tonal: melancholic, self-aware, never preachy.
 */

/**
 * Mount the title screen into `root`, replacing any previous content.
 *
 * @param {HTMLElement} root — element to render into (e.g. #app).
 * @param {{onStart: () => void, onAbout?: () => void}} handlers
 * @returns {{unmount: () => void}} call unmount() before mounting a
 *   different screen, so the Enter-to-start listener is cleaned up.
 */
export function mountTitleScreen(root, handlers) {
  if (!root) throw new Error("mountTitleScreen: root element is required.");
  const onStart = typeof handlers?.onStart === "function"
    ? handlers.onStart
    : () => {};
  const onAbout = typeof handlers?.onAbout === "function"
    ? handlers.onAbout
    : () => {
        // Slice A: About is a placeholder. Keep the interaction visible
        // so players on preview day know it exists, without blocking
        // the primary flow.
        // eslint-disable-next-line no-alert
        alert(
          'Subscribed\n\n' +
          'A narrative piece on parasocial intimacy and the\n' +
          'transactional shape of modern online connection.\n\n' +
          'Credits & sources — see docs/story_spec.md.\n' +
          'HKU CCHU9015, 2026.',
        );
      };

  // Wipe the root and build our DOM without using innerHTML. textContent
  // on every user-visible node per the rendering rules in .cursorrules.
  while (root.firstChild) root.removeChild(root.firstChild);

  const section = document.createElement("section");
  section.className = "title";
  section.setAttribute("aria-labelledby", "title-logo");

  const logo = document.createElement("h1");
  logo.className = "title__logo";
  logo.id = "title-logo";
  logo.textContent = "SUBSCRIBED";

  const subtitle = document.createElement("p");
  subtitle.className = "title__subtitle";
  subtitle.textContent = "A Story About Modern Intimacy";

  const tagline = document.createElement("p");
  tagline.className = "title__tagline";
  tagline.textContent =
    "One subscriber. One creator. One transaction that starts to feel like something else.";

  const menu = document.createElement("div");
  menu.className = "title__menu";
  menu.setAttribute("role", "group");
  menu.setAttribute("aria-label", "Main menu");

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "btn btn--primary";
  startBtn.dataset.action = "start";
  startBtn.textContent = "Start";
  startBtn.addEventListener("click", () => onStart());

  const aboutBtn = document.createElement("button");
  aboutBtn.type = "button";
  aboutBtn.className = "btn";
  aboutBtn.dataset.action = "about";
  aboutBtn.textContent = "About";
  aboutBtn.addEventListener("click", () => onAbout());

  menu.append(startBtn, aboutBtn);

  const hint = document.createElement("p");
  hint.className = "title__hint";
  hint.textContent = "Press Enter to begin.";

  const course = document.createElement("p");
  course.className = "title__course";
  course.textContent = "HKU CCHU9015 — Sex and Intimacy in Modern Times";

  section.append(logo, subtitle, tagline, menu, hint, course);
  root.appendChild(section);

  // Focus Start so keyboard users can just hit Enter.
  // Defer to next tick to avoid a Chrome quirk where focus() inside a
  // fresh mount is sometimes lost to the synthetic click that mounted us.
  queueMicrotask(() => startBtn.focus());

  /**
   * Enter / NumpadEnter anywhere on the page starts the game, unless
   * focus is on a button that already handles its own activation (in
   * which case the button's click handler fires and we do nothing).
   */
  const onKeyDown = (event) => {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key !== "Enter" && event.key !== "NumpadEnter") return;

    const tgt = event.target;
    if (tgt instanceof HTMLButtonElement) return;   // let the button click itself
    if (tgt instanceof HTMLInputElement)  return;
    if (tgt instanceof HTMLTextAreaElement) return;

    event.preventDefault();
    onStart();
  };
  document.addEventListener("keydown", onKeyDown);

  return {
    unmount() {
      document.removeEventListener("keydown", onKeyDown);
      while (root.firstChild) root.removeChild(root.firstChild);
    },
  };
}
