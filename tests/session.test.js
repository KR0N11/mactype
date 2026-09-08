import { test, expect } from "vitest";
import { TypingSession } from "../src/session.js";
import {
  InvalidTargetError,
  InvalidKeystrokeError,
  InvalidTimestampError,
  NothingToDeleteError,
  SessionCompleteError,
} from "../src/errors.js";

// Types the whole target correctly, one millisecond apart.
function typeAll(session, text) {
  [...text].forEach((char, i) => session.press(char, i));
  return session;
}

test("AC1.1 a session starts at cursor 0 with the given target", () => {
  const session = new TypingSession("cat");
  expect(session.target).toBe("cat");
  expect(session.cursor).toBe(0);
  expect(session.entries).toEqual([]);
  expect(session.isComplete).toBe(false);
});

test("AC1.2 an empty or non string target is rejected", () => {
  for (const bad of ["", null, undefined, 7, {}, ["c"], NaN]) {
    expect(() => new TypingSession(bad)).toThrow(InvalidTargetError);
  }
});

test("AC1.3 a correct press advances the cursor and records a correct entry", () => {
  const session = new TypingSession("cat");
  session.press("c", 0);
  expect(session.cursor).toBe(1);
  expect(session.entries).toEqual([{ expected: "c", actual: "c", correct: true }]);
});

test("AC1.4 a wrong press advances the cursor and records an incorrect entry", () => {
  const session = new TypingSession("cat");
  session.press("x", 0);
  expect(session.cursor).toBe(1);
  expect(session.entries).toEqual([{ expected: "c", actual: "x", correct: false }]);
});

test("AC1.5 backspace moves the cursor back one and drops the last entry", () => {
  const session = new TypingSession("cat");
  session.press("c", 0);
  session.press("x", 1);
  session.backspace(2);
  expect(session.cursor).toBe(1);
  expect(session.entries).toEqual([{ expected: "c", actual: "c", correct: true }]);
});

test("AC1.6 backspace at cursor 0 is rejected and leaves state unchanged", () => {
  const session = new TypingSession("cat");
  expect(() => session.backspace(0)).toThrow(NothingToDeleteError);
  expect(session.cursor).toBe(0);
  expect(session.entries).toEqual([]);
  expect(session.log).toEqual([]);
  expect(session.startedAt).toBe(null);
  expect(session.lastAt).toBe(null);
});

test("AC1.7 a press after the target is complete is rejected and leaves state unchanged", () => {
  const session = typeAll(new TypingSession("cat"), "cat");
  expect(session.isComplete).toBe(true);
  const before = session.entries;
  expect(() => session.press("s", 9)).toThrow(SessionCompleteError);
  expect(session.entries).toEqual(before);
  expect(session.cursor).toBe(3);
  expect(session.log).toHaveLength(3);
  expect(session.lastAt).toBe(2);
});

test("AC1.8 a keystroke that is not a single character is rejected", () => {
  const session = new TypingSession("cat");
  for (const bad of ["", "ab", null, undefined, 3, {}, ["c"]]) {
    expect(() => session.press(bad, 0)).toThrow(InvalidKeystrokeError);
  }
  expect(session.cursor).toBe(0);
  expect(session.log).toEqual([]);
});

test("AC1.8 an astral character counts as one keystroke", () => {
  const session = new TypingSession("\u{1F642}k");
  session.press("\u{1F642}", 0);
  expect(session.cursor).toBe(1);
  expect(session.entries[0].correct).toBe(true);
});

test("AC1.9 a timestamp that is not finite is rejected", () => {
  const session = new TypingSession("cat");
  for (const bad of [NaN, Infinity, -Infinity, "0", null, undefined]) {
    expect(() => session.press("c", bad)).toThrow(InvalidTimestampError);
    expect(() => session.backspace(bad)).toThrow(InvalidTimestampError);
  }
  expect(session.cursor).toBe(0);
  expect(session.log).toEqual([]);
});

test("AC1.9 zero and negative timestamps are accepted", () => {
  const session = new TypingSession("cat");
  session.press("c", -5);
  session.press("a", 0);
  expect(session.cursor).toBe(2);
  expect(session.startedAt).toBe(-5);
});

test("AC1.10 a timestamp earlier than the previous keystroke is rejected", () => {
  const session = new TypingSession("cat");
  session.press("c", 100);
  expect(() => session.press("a", 99)).toThrow(InvalidTimestampError);
  expect(session.cursor).toBe(1);
  expect(session.lastAt).toBe(100);
  session.press("a", 100);
  expect(session.cursor).toBe(2);
});

test("AC1.11 the clock starts on the first keystroke, not on construction", () => {
  const session = new TypingSession("cat");
  expect(session.startedAt).toBe(null);
  session.press("c", 42);
  expect(session.startedAt).toBe(42);
  session.press("a", 50);
  expect(session.startedAt).toBe(42);
});

test("AC1.12 the log keeps a mistake that was backspaced away", () => {
  const session = new TypingSession("cat");
  session.press("x", 0);
  session.backspace(1);
  session.press("c", 2);
  expect(session.entries).toEqual([{ expected: "c", actual: "c", correct: true }]);
  expect(session.log.map((e) => e.type)).toEqual(["press", "backspace", "press"]);
  expect(session.log[0]).toMatchObject({ actual: "x", correct: false });
  expect(session.log[1].removed).toEqual({ expected: "c", actual: "x", correct: false });
});

test("entries and log are copies, so callers cannot mutate session state", () => {
  const session = new TypingSession("cat");
  session.press("c", 0);
  session.entries.push({ expected: "z", actual: "z", correct: true });
  session.log[0].actual = "z";
  expect(session.cursor).toBe(1);
  expect(session.entries).toEqual([{ expected: "c", actual: "c", correct: true }]);
  expect(session.log[0].actual).toBe("c");
});
