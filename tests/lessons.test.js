import { test, expect } from "vitest";
import { LESSONS, findLesson, buildText } from "../src/lessons.js";

// Always picks the first item, so generated text is predictable.
const first = () => 0;

// Proves every lesson can actually produce text, so no lesson is a dead button.
test("AC7.1 every lesson produces the number of words asked for", () => {
  for (const lesson of LESSONS) {
    const text = buildText(lesson.id, 8, first);
    expect(text.split(" ")).toHaveLength(8);
    expect(text.trim()).not.toBe("");
  }
});

// Proves a key drill only ever asks for the keys that lesson is teaching.
test("AC7.2 a key drill uses only the keys of that lesson", () => {
  const allowed = new Set([..."asdfjkl;", " "]);
  for (const char of buildText("home", 20, Math.random)) {
    expect(allowed.has(char)).toBe(true);
  }
});

// Proves drill words stay inside the length range the lesson sets.
test("AC7.3 drill words respect the lesson's length range", () => {
  for (const word of buildText("home", 40, Math.random).split(" ")) {
    expect(word.length).toBeGreaterThanOrEqual(3);
    expect(word.length).toBeLessThanOrEqual(5);
  }
});

// Proves a word lesson uses real words from its own pool, not random letters.
test("AC7.4 a word lesson draws from its own pool", () => {
  const lesson = findLesson("common");
  for (const word of buildText("common", 15, Math.random).split(" ")) {
    expect(lesson.pool).toContain(word);
  }
});

// Proves a typo in a lesson id is reported instead of showing a blank page.
test("AC7.5 an unknown lesson id is refused", () => {
  expect(() => findLesson("nope")).toThrow(/no lesson called/);
  expect(() => buildText("nope", 5)).toThrow(/no lesson called/);
});

// Proves lesson ids are unique, since two lessons sharing an id makes one unreachable.
test("AC7.6 lesson ids are unique", () => {
  const ids = LESSONS.map((lesson) => lesson.id);
  expect(new Set(ids).size).toBe(ids.length);
});
