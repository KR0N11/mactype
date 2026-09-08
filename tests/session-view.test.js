// @vitest-environment jsdom
import { test, expect, beforeEach } from "vitest";
import { SessionView } from "../src/session-view.js";
import { TypingSession } from "../src/session.js";

let textElement;
let statsElement;
let view;

beforeEach(() => {
  textElement = document.createElement("div");
  statsElement = document.createElement("div");
  view = new SessionView(textElement, statsElement);
});

// Reads back what is on screen as a list of "character:class" pairs.
function painted() {
  return [...textElement.children].map((span) => `${span.textContent}:${span.className}`);
}

// Proves an untouched run shows every character grey with the marker at the front.
test("AC4.1 a fresh run is all pending with the cursor on the first character", () => {
  view.render(new TypingSession("cat"));
  expect(painted()).toEqual(["c:pending cursor", "a:pending", "t:pending"]);
});

// Proves right and wrong characters are coloured differently as you go.
test("AC4.2 typed characters are marked right or wrong and the cursor moves", () => {
  const session = new TypingSession("cat");
  session.press("c", 0);
  session.press("x", 100);
  view.render(session);
  expect(painted()).toEqual(["c:correct", "a:wrong", "t:pending cursor"]);
});

// Proves a finished run has no cursor left to draw.
test("AC4.3 a finished run shows no cursor", () => {
  const session = new TypingSession("cat");
  [..."cat"].forEach((char, i) => session.press(char, i * 100));
  view.render(session);
  expect(painted()).toEqual(["c:correct", "a:correct", "t:correct"]);
});

// Proves the screen is redrawn, not appended to, so characters do not pile up.
test("AC4.4 redrawing replaces the old characters instead of adding more", () => {
  const session = new TypingSession("cat");
  view.render(session);
  session.press("c", 0);
  view.render(session);
  expect(textElement.children).toHaveLength(3);
});

// Proves pasted practice text is shown as text, never run as page code.
test("AC4.5 angle brackets in the target are shown, not executed", () => {
  view.render(new TypingSession("<b>"));
  expect(textElement.querySelector("b")).toBe(null);
  expect(textElement.textContent).toBe("<b>");
});

// Proves the spaces in the target survive, so word gaps stay one character wide.
test("AC4.6 a space is drawn as its own character", () => {
  view.render(new TypingSession("a b"));
  expect(painted()).toEqual(["a:pending cursor", " :pending", "b:pending"]);
});

// Proves the numbers are rounded for the screen and the worst keys are named.
test("AC4.7 stats are rounded on screen and the worst keys are listed", () => {
  view.showStats({
    netWpm: 61.4,
    rawWpm: 72.6,
    accuracy: 0.846,
    consistency: 0.911,
    hesitations: 2,
    errorsByKey: new Map([["a", 1], ["s", 4], ["d", 2]]),
  });
  expect(statsElement.textContent).toBe(
    "61 wpm  ·  73 raw  ·  85% accurate  ·  91% even  ·  2 look-downs  ·  worst: s x4, d x2, a x1",
  );
});

// Proves a clean run does not show an empty "worst keys" line.
test("AC4.8 a run with no mistakes shows no worst key line", () => {
  view.showStats({
    netWpm: 60,
    rawWpm: 60,
    accuracy: 1,
    consistency: 1,
    hesitations: 0,
    errorsByKey: new Map(),
  });
  expect(statsElement.textContent).toBe("60 wpm  ·  60 raw  ·  100% accurate  ·  100% even  ·  0 look-downs");
});

// Proves a mistyped space is named rather than shown as an invisible gap.
test("AC4.9 a mistyped space is named 'space' in the worst keys", () => {
  view.showStats({
    netWpm: 1, rawWpm: 1, accuracy: 1, consistency: 1, hesitations: 0,
    errorsByKey: new Map([[" ", 3]]),
  });
  expect(statsElement.textContent).toContain("worst: space x3");
});

// Proves a plain sentence can replace the numbers when there is nothing to score.
test("AC4.10 a message replaces whatever was in the stats area", () => {
  view.showMessage("Not enough typing to score that run.");
  expect(statsElement.textContent).toBe("Not enough typing to score that run.");
});
