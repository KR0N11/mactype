import { test, expect, beforeEach } from "vitest";
import { TypingTrainer } from "../src/typing-trainer.js";

let renders;
let shown;
let messages;
let view;

beforeEach(() => {
  renders = [];
  shown = [];
  messages = [];
  // A stand in for the screen, so these tests never need a browser.
  view = {
    render: (session) => renders.push(session.cursor),
    showStats: (stats) => shown.push(stats),
    showMessage: (text) => messages.push(text),
  };
});

// Types the whole target correctly, one press every 100ms.
function typeAll(trainer, text) {
  [...text].forEach((char, i) => trainer.press(char, i * 100));
}

// Proves the screen is drawn once as soon as the run exists, before any typing.
test("AC5.1 the run is drawn on screen the moment it starts", () => {
  new TypingTrainer(view, "cat");
  expect(renders).toEqual([0]);
});

// Proves every keystroke redraws the screen.
test("AC5.2 each press redraws the screen", () => {
  const trainer = new TypingTrainer(view, "cat");
  trainer.press("c", 0);
  trainer.press("x", 100);
  expect(renders).toEqual([0, 1, 2]);
});

// Proves the score appears by itself once the last character is typed.
test("AC5.3 finishing the target shows the score without being asked", () => {
  const trainer = new TypingTrainer(view, "cat");
  typeAll(trainer, "cat");
  expect(shown).toHaveLength(1);
  expect(shown[0].accuracy).toBe(1);
  expect(messages).toEqual([]);
});

// Proves typing past the end is quietly ignored instead of stopping the page.
test("AC5.4 typing past the end changes nothing", () => {
  const trainer = new TypingTrainer(view, "cat");
  typeAll(trainer, "cat");
  const rendersAfterFinish = renders.length;
  trainer.press("s", 400);
  expect(trainer.session.cursor).toBe(3);
  expect(renders).toHaveLength(rendersAfterFinish);
  expect(shown).toHaveLength(1);
});

// Proves delete at the very start is quietly ignored instead of stopping the page.
test("AC5.5 delete at the start changes nothing", () => {
  const trainer = new TypingTrainer(view, "cat");
  trainer.backspace(0);
  expect(trainer.session.cursor).toBe(0);
  expect(trainer.session.log).toEqual([]);
  expect(renders).toEqual([0]);
});

// Proves delete undoes the last character and redraws.
test("AC5.6 delete removes the last character", () => {
  const trainer = new TypingTrainer(view, "cat");
  trainer.press("c", 0);
  trainer.backspace(100);
  expect(trainer.session.cursor).toBe(0);
  expect(renders).toEqual([0, 1, 0]);
});

// Proves a run too short to score says so instead of showing broken numbers.
test("AC5.7 a one character run says it could not be scored", () => {
  const trainer = new TypingTrainer(view, "a");
  trainer.press("a", 0);
  expect(shown).toEqual([]);
  expect(messages).toEqual(["Not enough typing to score that run."]);
});

// Proves a run where no time passed says so rather than reporting Infinity.
test("AC5.8 a run with no time between keystrokes says it could not be scored", () => {
  const trainer = new TypingTrainer(view, "cat");
  typeAll(trainer, "cat");
  const instant = new TypingTrainer(view, "cat");
  [..."cat"].forEach((char) => instant.press(char, 0));
  expect(messages).toEqual(["Not enough typing to score that run."]);
});

// Proves a real fault is not swallowed by the "too short to score" handling.
test("AC5.9 an unexpected failure while scoring is not hidden", () => {
  const broken = { ...view, showStats: () => { throw new RangeError("boom"); } };
  const trainer = new TypingTrainer(broken, "cat");
  expect(() => typeAll(trainer, "cat")).toThrow(RangeError);
});

// Proves the pause threshold set on the trainer reaches the scoring.
test("AC5.10 the hesitation threshold reaches the score", () => {
  const trainer = new TypingTrainer(view, "cat", { hesitationMs: 50 });
  typeAll(trainer, "cat");
  expect(shown[0].hesitations).toBe(2);
});
