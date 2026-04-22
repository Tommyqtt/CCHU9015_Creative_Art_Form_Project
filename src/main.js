/**
 * @file src/main.js — app entry for "Subscribed".
 *
 * Boots on DOMContentLoaded, mounts the title screen, and swaps to the
 * scene-view placeholder when the player starts. Keeps imports small
 * on purpose — the entry module is glue, never story or DOM logic.
 *
 * Slice A does not yet call into engine.js. Slice C will add the
 * renderScene("S1") call after mountSceneView().
 */

import { reset } from "./state.js";
import { mountTitleScreen } from "./ui/titleScreen.js";
import { mountSceneView } from "./ui/sceneView.js";

const APP_ROOT_SELECTOR = "#app";

/** Handle to the currently-mounted screen so we can unmount cleanly. */
let currentScreen = null;

/** Swap the app root to the title screen. */
function showTitleScreen() {
  const root = document.querySelector(APP_ROOT_SELECTOR);
  if (!root) {
    console.error(`main: ${APP_ROOT_SELECTOR} not found in DOM.`);
    return;
  }
  if (currentScreen && typeof currentScreen.unmount === "function") {
    currentScreen.unmount();
  }
  reset();
  currentScreen = mountTitleScreen(root, {
    onStart: showSceneView,
  });
}

/** Swap the app root to the scene view (placeholder for Slice A). */
function showSceneView() {
  const root = document.querySelector(APP_ROOT_SELECTOR);
  if (!root) {
    console.error(`main: ${APP_ROOT_SELECTOR} not found in DOM.`);
    return;
  }
  if (currentScreen && typeof currentScreen.unmount === "function") {
    currentScreen.unmount();
  }
  currentScreen = mountSceneView(root);
}

document.addEventListener("DOMContentLoaded", showTitleScreen);
