import { test, expect, beforeEach } from "vitest";
import { TypingTrainer } from "../src/typing-trainer.js";

let progress;
let finishes;

beforeEach(() => {
  progress = [];
  finishes = [];
});

// Builds a trainer that records what it reports, instead of drawing anything.
function makeTrainer(target, options = {}) {
  return new TypingTrainer(target, {
    onProgress: (session) => progress.push(session.cursor),
    onFinish: (result) => finishes.push(result),
    ...options,
  });
}

// Types the whole target correctly, one press every 100ms.
function typeAll(trainer, text) {
  [...text].forEach((char, i) => trainer.press(char, i * 100));
}

// Proves every keystroke reports progress so the screen can follow along.
test("AC9.1 each press reports progress", () => {
  const trainer = makeTrainer("cat");
  trainer.press("c", 0);
  trainer.press("x", 100);
  expect(progress).toEqual([1, 2]);
});

// Proves the score arrives by itself once the last character is typed.
test("AC9.2 finishing the text reports a score without being asked", () => {
  const trainer = makeTrainer("cat");
  typeAll(trainer, "cat");
  expect(finishes).toHaveLength(1);
  expect(finishes[0].scored).toBe(true);
  expect(finishes[0].stats.accuracy).toBe(1);
  expect(trainer.isFinished).toBe(true);
});

// Proves the clock running out ends the run and scores what you managed.
test("AC9.3 finishing early scores the part you typed", () => {
  const trainer = makeTrainer("cat and dog");
  trainer.press("c", 0);
  trainer.press("a", 100);
  trainer.finish();
  expect(finishes[0].scored).toBe(true);
  expect(finishes[0].stats.totalPresses).toBe(2);
});

// Proves a run cannot be scored twice, which would save it to history twice.
test("AC9.4 a run is only scored once", () => {
  const trainer = makeTrainer("cat");
  typeAll(trainer, "cat");
  trainer.finish();
  trainer.finish();
  expect(finishes).toHaveLength(1);
});

// Proves keys pressed after the clock ran out are ignored, not recorded.
test("AC9.5 typing after the run ends changes nothing", () => {
  const trainer = makeTrainer("cat and dog");
  trainer.press("c", 0);
  trainer.press("a", 100);
  trainer.finish();
  trainer.press("t", 200);
  trainer.backspace(300);
  expect(trainer.session.cursor).toBe(2);
  expect(progress).toEqual([1, 2]);
});

// Proves delete at the very start is ignored rather than stopping the page.
test("AC9.6 delete at the start changes nothing", () => {
  const trainer = makeTrainer("cat");
  trainer.backspace(0);
  expect(trainer.session.cursor).toBe(0);
  expect(progress).toEqual([]);
});

// Proves delete undoes the last character and reports the new position.
test("AC9.7 delete removes the last character", () => {
  const trainer = makeTrainer("cat");
  trainer.press("c", 0);
  trainer.backspace(100);
  expect(progress).toEqual([1, 0]);
});

// Proves a run too short to score says so rather than showing broken numbers.
test("AC9.8 a run too short to score is reported as unscored", () => {
  const trainer = makeTrainer("a");
  trainer.press("a", 0);
  expect(finishes).toEqual([{ scored: false }]);
});

// Proves a real fault is not hidden by the "too short to score" handling.
test("AC9.9 an unexpected failure while scoring is not swallowed", () => {
  const trainer = makeTrainer("cat", { onFinish: () => { throw new RangeError("boom"); } });
  expect(() => typeAll(trainer, "cat")).toThrow(RangeError);
});

// Proves the pause threshold reaches the scoring.
test("AC9.10 the hesitation threshold reaches the score", () => {
  const trainer = makeTrainer("cat", { hesitationMs: 50 });
  typeAll(trainer, "cat");
  expect(finishes[0].stats.hesitations).toBe(2);
});
