import { test, expect, beforeEach } from "vitest";
import { RunHistory } from "../src/history.js";

let storage;
let history;

// A stand in for the browser's localStorage, so these tests need no browser.
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = value; },
    removeItem: (key) => { delete data[key]; },
  };
}

// Builds one saved run.
function run(overrides = {}) {
  return { at: Date.UTC(2026, 8, 8, 12), lessonId: "common", netWpm: 60, errors: [], ...overrides };
}

beforeEach(() => {
  storage = fakeStorage();
  history = new RunHistory(storage);
});

// Proves a first visit shows nothing rather than crashing on missing data.
test("AC8.1 an empty history reads as no runs", () => {
  expect(history.all()).toEqual([]);
  expect(history.best("common")).toBe(null);
  expect(history.worstKeys()).toEqual([]);
  expect(history.streak()).toBe(0);
});

// Proves a saved run comes back, and the newest run is first.
test("AC8.2 runs are saved newest first", () => {
  history.record(run({ netWpm: 50 }));
  history.record(run({ netWpm: 70 }));
  expect(history.all().map((entry) => entry.netWpm)).toEqual([70, 50]);
});

// Proves history stops growing forever and quietly eating the browser's storage.
test("AC8.3 only the most recent runs are kept", () => {
  const small = new RunHistory(storage, 3);
  for (let i = 0; i < 6; i += 1) {
    small.record(run({ netWpm: i }));
  }
  expect(small.all().map((entry) => entry.netWpm)).toEqual([5, 4, 3]);
});

// Proves your best is per lesson, so a fast drill does not hide a slow one.
test("AC8.4 the best run is tracked per lesson", () => {
  history.record(run({ lessonId: "common", netWpm: 60 }));
  history.record(run({ lessonId: "common", netWpm: 80 }));
  history.record(run({ lessonId: "home", netWpm: 95 }));
  expect(history.best("common").netWpm).toBe(80);
  expect(history.best("home").netWpm).toBe(95);
  expect(history.best("code")).toBe(null);
});

// Proves the keys you miss are added up across runs, not just the last one.
test("AC8.5 missed keys are totalled across every run", () => {
  history.record(run({ errors: [["a", 2], ["s", 1]] }));
  history.record(run({ errors: [["a", 3]] }));
  expect(history.worstKeys(2)).toEqual([["a", 5], ["s", 1]]);
});

// Proves practising on consecutive days builds a streak and a gap breaks it.
test("AC8.6 a streak counts consecutive days and stops at a gap", () => {
  const day = 86400000;
  const today = Date.UTC(2026, 8, 8, 12);
  history.record(run({ at: today }));
  history.record(run({ at: today - day }));
  history.record(run({ at: today - day * 2 }));
  expect(history.streak()).toBe(3);

  history.record(run({ at: today - day * 5 }));
  expect(history.streak()).toBe(3);
});

// Proves two runs on the same day count as one day, not two.
test("AC8.7 two runs on one day count as one day", () => {
  const today = Date.UTC(2026, 8, 8, 12);
  history.record(run({ at: today }));
  history.record(run({ at: today + 3600000 }));
  expect(history.streak()).toBe(1);
});

// Proves damaged saved data cannot stop the app from opening.
test("AC8.8 unreadable saved data is thrown away, not crashed on", () => {
  for (const junk of ["not json at all", '{"not":"a list"}', '[{"at":"yesterday"}]', "[null]"]) {
    const broken = new RunHistory(fakeStorage({ "mactype.runs": junk }));
    expect(broken.all()).toEqual([]);
    expect(broken.streak()).toBe(0);
  }
});

// Proves a good run survives even when a broken one sits next to it.
test("AC8.9 a broken entry is dropped and the good ones are kept", () => {
  const mixed = new RunHistory(fakeStorage({
    "mactype.runs": JSON.stringify([run({ netWpm: 42 }), { at: "nope" }]),
  }));
  expect(mixed.all()).toHaveLength(1);
  expect(mixed.all()[0].netWpm).toBe(42);
});

// Proves clearing really empties the saved runs.
test("AC8.10 clear removes every saved run", () => {
  history.record(run());
  history.clear();
  expect(history.all()).toEqual([]);
});
