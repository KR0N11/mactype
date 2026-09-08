// @vitest-environment jsdom
import { test, expect, beforeEach } from "vitest";
import { startApp } from "../src/app.js";

let clock;

beforeEach(() => {
  clock = 0;
  document.body.innerHTML = '<div id="text"></div><div id="stats"></div>';
});

// Sends one key press to the page, as a real Mac keyboard would.
function key(name, modifiers = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: name, cancelable: true, ...modifiers }));
}

// Proves typing on the page really drives the run from end to end.
test("AC6.1 typing the whole target on the page produces a score", () => {
  const app = startApp(document, "go", { now: () => (clock += 100) });
  key("g");
  key("o");
  expect(app.trainer.session.isComplete).toBe(true);
  expect(document.getElementById("stats").textContent).toContain("wpm");
  app.input.stop();
});

// Proves a mistake shows up on the page in red, then can be deleted.
test("AC6.2 a mistake is marked on the page and delete undoes it", () => {
  const app = startApp(document, "go", { now: () => (clock += 100) });
  key("x");
  expect(document.querySelector("#text .wrong")).not.toBe(null);
  key("Backspace");
  expect(document.querySelector("#text .wrong")).toBe(null);
  app.input.stop();
});

// Proves the page has no text box, which is what keeps macOS out of the way.
test("AC6.3 the page has no editable field for macOS to autocorrect", () => {
  const app = startApp(document, "go", { now: () => (clock += 100) });
  expect(document.querySelector("input, textarea, [contenteditable]")).toBe(null);
  app.input.stop();
});
