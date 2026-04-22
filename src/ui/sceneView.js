/**
 * @file src/ui/sceneView.js — placeholder scene view for "Subscribed".
 *
 * Slice A: mounts the scene container (bg slot, character slot,
 * dialogue box, choices stack) with a "Scene rendering coming in
 * Slice C" placeholder message. The class names used here are
 * forward-compatible with the ORCHESTRATION §3.3 contract so Slice C
 * can wire the engine in without rewriting the HTML.
 */

/**
 * Mount the scene view into `root`, replacing any previous content.
 *
 * @param {HTMLElement} root — element to render into (e.g. #app).
 * @returns {{unmount: () => void}}
 */
export function mountSceneView(root) {
  if (!root) throw new Error("mountSceneView: root element is required.");

  while (root.firstChild) root.removeChild(root.firstChild);

  const scene = document.createElement("main");
  scene.className = "scene";
  scene.dataset.scene = "placeholder";

  const stage = document.createElement("div");
  stage.className = "scene__stage";

  const bg = document.createElement("img");
  bg.className = "scene__bg";
  bg.setAttribute("src", "");
  bg.setAttribute("alt", "");
  bg.setAttribute("aria-hidden", "true");

  const char = document.createElement("img");
  char.className = "scene__char is-hidden";
  char.setAttribute("src", "");
  char.setAttribute("alt", "");
  char.setAttribute("data-pose", "idle");

  stage.append(bg, char);

  const dialogue = document.createElement("section");
  dialogue.className = "scene__dialogue";
  dialogue.setAttribute("aria-live", "polite");

  const placeholder = document.createElement("p");
  placeholder.className = "scene__placeholder";
  // Authored for Slice A — not part of story_spec.md.
  placeholder.textContent = "Scene rendering coming in Slice C.";

  const hint = document.createElement("p");
  hint.className = "scene__placeholder";
  hint.textContent =
    "Engine stubs are wired. Populate STORY in src/story.js (Slice B) and wire renderScene() in src/engine.js (Slice C) to bring this to life.";

  dialogue.append(placeholder, hint);

  const choices = document.createElement("section");
  choices.className = "scene__choices is-hidden";
  choices.setAttribute("aria-label", "Choices");

  scene.append(stage, dialogue, choices);
  root.appendChild(scene);

  return {
    unmount() {
      while (root.firstChild) root.removeChild(root.firstChild);
    },
  };
}
