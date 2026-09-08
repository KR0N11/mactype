import { test, expect } from "vitest";
import { TypingSession } from "../src/session.js";
import { computeStats } from "../src/stats.js";
import { UnmeasurableSessionError } from "../src/errors.js";

// Types the given characters, one press every `stepMs` milliseconds.
function typeSteadily(target, typed, stepMs) {
  const session = new TypingSession(target);
  [...typed].forEach((char, i) => session.press(char, i * stepMs));
  return session;
}

// Proves a perfect run reports the speed the stopwatch says it should.
test("AC2.1 a perfect run reports the same net and raw speed", () => {
  const session = typeSteadily("the cat", "the cat", 100);
  const stats = computeStats(session);
  // 7 presses, first at 0ms and last at 600ms, so 0.01 minutes.
  expect(stats.elapsedMs).toBe(600);
  expect(stats.rawWpm).toBeCloseTo(7 / 5 / 0.01, 10);
  expect(stats.netWpm).toBe(stats.rawWpm);
  expect(stats.accuracy).toBe(1);
});

// Proves a mistake lowers net speed and accuracy but not raw speed.
test("AC2.2 a wrong character lowers net speed and accuracy, raw speed is unchanged", () => {
  const session = typeSteadily("cat", "cxt", 100);
  const stats = computeStats(session);
  expect(stats.totalPresses).toBe(3);
  expect(stats.correctPresses).toBe(2);
  expect(stats.rawWpm).toBeCloseTo(3 / 5 / (200 / 60000), 10);
  expect(stats.netWpm).toBeCloseTo(2 / 5 / (200 / 60000), 10);
  expect(stats.accuracy).toBeCloseTo(2 / 3, 10);
});

// Proves a mistake you deleted still counts against your accuracy.
test("AC2.3 a corrected mistake still counts against accuracy", () => {
  const session = new TypingSession("cat");
  session.press("x", 0);
  session.backspace(100);
  session.press("c", 200);
  session.press("a", 300);
  session.press("t", 400);
  const stats = computeStats(session);
  expect(stats.totalPresses).toBe(4);
  expect(stats.accuracy).toBeCloseTo(3 / 4, 10);
  // All three characters ended up right on screen, so net speed is the full word.
  expect(stats.netWpm).toBeCloseTo(3 / 5 / (400 / 60000), 10);
});

// Proves we can tell the user which specific key they keep missing.
test("AC2.4 errors are counted against the key that was meant to be hit", () => {
  const session = typeSteadily("aaa b", "qqa b", 100);
  const stats = computeStats(session);
  expect(stats.errorsByKey.get("a")).toBe(2);
  expect(stats.errorsByKey.has("b")).toBe(false);
});

// Proves a key literally named "constructor" is counted, not swallowed.
test("AC2.5 a target character that collides with an object field is still counted", () => {
  const session = new TypingSession("constructor");
  [..."xonstructor"].forEach((char, i) => session.press(char, i * 100));
  const stats = computeStats(session);
  expect(stats.errorsByKey.get("c")).toBe(1);
});

// Proves an even rhythm scores 1 and a jerky rhythm scores lower.
test("AC2.6 an even rhythm scores 1, an uneven one scores lower", () => {
  const even = computeStats(typeSteadily("abcd", "abcd", 100));
  expect(even.consistency).toBe(1);

  const jerky = new TypingSession("abcd");
  jerky.press("a", 0);
  jerky.press("b", 10);
  jerky.press("c", 900);
  jerky.press("d", 910);
  const stats = computeStats(jerky);
  expect(stats.consistency).toBeLessThan(1);
  expect(stats.consistency).toBeGreaterThanOrEqual(0);
});

// Proves consistency never goes negative, which would make no sense on screen.
test("AC2.7 a wildly uneven rhythm floors consistency at 0", () => {
  const session = new TypingSession("abcd");
  session.press("a", 0);
  session.press("b", 1);
  session.press("c", 2);
  session.press("d", 100000);
  expect(computeStats(session).consistency).toBe(0);
});

// Proves a long stall inside a word is counted as looking down at the keys.
test("AC2.8 a long pause inside a word counts as a hesitation", () => {
  const session = new TypingSession("abc");
  session.press("a", 0);
  session.press("b", 800);
  session.press("c", 900);
  expect(computeStats(session).hesitations).toBe(1);
});

// Proves a long pause between words is normal reading, not looking down.
test("AC2.9 a long pause across a space is not a hesitation", () => {
  const session = new TypingSession("ab cd");
  session.press("a", 0);
  session.press("b", 100);
  session.press(" ", 900);
  session.press("c", 1700);
  session.press("d", 1800);
  expect(computeStats(session).hesitations).toBe(0);
});

// Proves the pause threshold is a knob the caller can turn.
test("AC2.10 the hesitation threshold is caller controlled", () => {
  const session = new TypingSession("abc");
  session.press("a", 0);
  session.press("b", 300);
  session.press("c", 600);
  expect(computeStats(session).hesitations).toBe(0);
  expect(computeStats(session, { hesitationMs: 250 }).hesitations).toBe(2);
});

// Proves the boundary: a pause exactly at the threshold counts.
test("AC2.10 a pause exactly at the threshold counts as a hesitation", () => {
  const session = new TypingSession("abc");
  session.press("a", 0);
  session.press("b", 500);
  session.press("c", 600);
  expect(computeStats(session).hesitations).toBe(1);
});

// Proves we refuse to report speed for a run with nothing to measure, and change nothing.
test("AC2.11 a run with fewer than two keystrokes is refused and the session is untouched", () => {
  const empty = new TypingSession("cat");
  expect(() => computeStats(empty)).toThrow(UnmeasurableSessionError);
  expect(empty.cursor).toBe(0);
  expect(empty.log).toEqual([]);

  const one = new TypingSession("cat");
  one.press("c", 0);
  expect(() => computeStats(one)).toThrow(UnmeasurableSessionError);
  expect(one.cursor).toBe(1);
  expect(one.log).toHaveLength(1);
});

// Proves we refuse a run where no time passed, instead of reporting Infinity.
test("AC2.12 a run with no elapsed time is refused and the session is untouched", () => {
  const session = new TypingSession("cat");
  session.press("c", 0);
  session.press("a", 0);
  expect(() => computeStats(session)).toThrow(UnmeasurableSessionError);
  expect(session.cursor).toBe(2);
  expect(session.log).toHaveLength(2);
});

// Proves that when every gap is zero we report an even rhythm, not NaN.
test("AC2.13 keystrokes sharing a timestamp still give a real consistency number", () => {
  const session = new TypingSession("abc");
  session.press("a", 0);
  session.press("b", 0);
  session.backspace(100);
  const stats = computeStats(session);
  // Two presses at the same moment give one gap of zero, so the average gap is zero.
  expect(Number.isNaN(stats.consistency)).toBe(false);
  expect(stats.consistency).toBe(1);
  expect(stats.elapsedMs).toBe(100);
});
