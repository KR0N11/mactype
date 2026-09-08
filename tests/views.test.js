// @vitest-environment jsdom
import { test, expect, beforeEach } from "vitest";
import { SessionView } from "../src/session-view.js";
import { HudView } from "../src/hud-view.js";
import { ResultsView } from "../src/results-view.js";
import { MenuView } from "../src/menu-view.js";
import { HistoryView } from "../src/history-view.js";
import { TypingSession } from "../src/session.js";

let element;

beforeEach(() => {
  element = document.createElement("div");
});

// A finished run's numbers, as computeStats would report them.
function stats(overrides = {}) {
  return { netWpm: 61.4, rawWpm: 72.6, accuracy: 0.846, consistency: 0.911, hesitations: 2, errorsByKey: new Map(), ...overrides };
}

// Reads back what is drawn as "character:class" pairs.
function painted(view) {
  return [...element.querySelector(".line").children].map((span) => `${span.textContent}:${span.className}`);
}

// Proves an untouched run shows every character dim with the marker at the front.
test("AC11.1 a fresh run is all pending with the cursor first", () => {
  const view = new SessionView(element);
  view.render(new TypingSession("cat"));
  expect(painted(view)).toEqual(["c:pending cursor", "a:pending", "t:pending"]);
});

// Proves right and wrong characters are coloured differently as you go.
test("AC11.2 typed characters are marked right or wrong and the cursor moves", () => {
  const session = new TypingSession("cat");
  session.press("c", 0);
  session.press("x", 100);
  const view = new SessionView(element);
  view.render(session);
  expect(painted(view)).toEqual(["c:correct", "a:wrong", "t:pending cursor"]);
});

// Proves redrawing replaces the text instead of piling characters up.
test("AC11.3 redrawing replaces the old characters", () => {
  const session = new TypingSession("cat");
  const view = new SessionView(element);
  view.render(session);
  session.press("c", 0);
  view.render(session);
  expect(element.querySelector(".line").children).toHaveLength(3);
});

// Proves practice text is shown as text, never run as page code.
test("AC11.4 angle brackets in the text are shown, not executed", () => {
  new SessionView(element).render(new TypingSession("<b>"));
  expect(element.querySelector("b")).toBe(null);
  expect(element.textContent).toBe("<b>");
});

// Proves the countdown is shown in whole seconds, rounded up so it never reads 0 early.
test("AC11.5 the clock shows whole seconds", () => {
  const hud = new HudView(element);
  hud.showTime(29400);
  expect(element.textContent).toBe("30s");
  hud.showTime(0);
  expect(element.textContent).toBe("0s");
});

// Proves a fixed length run shows which word you are on.
test("AC11.6 a word run shows the word you are on", () => {
  const session = new TypingSession("one two three");
  const hud = new HudView(element);
  hud.showProgress(session);
  expect(element.textContent).toBe("1 / 3");
  [..."one "].forEach((char, i) => session.press(char, i * 10));
  hud.showProgress(session);
  expect(element.textContent).toBe("2 / 3");
});

// Proves a first run says so rather than comparing against nothing.
test("AC11.7 a first run on a lesson says it is the first", () => {
  new ResultsView(element, { onAgain: () => {} }).show(stats(), null);
  expect(element.textContent).toContain("First run on this lesson");
  expect(element.hidden).toBe(false);
});

// Proves beating your record is called out, since that is the reason to come back.
test("AC11.8 beating your best is called out", () => {
  new ResultsView(element, { onAgain: () => {} }).show(stats({ netWpm: 80 }), { netWpm: 60 });
  expect(element.textContent).toContain("New best, up from 60 wpm");
  expect(element.querySelector(".best")).not.toBe(null);
});

// Proves a slower run shows the record you are chasing.
test("AC11.9 a slower run shows the best you are chasing", () => {
  new ResultsView(element, { onAgain: () => {} }).show(stats({ netWpm: 40 }), { netWpm: 60 });
  expect(element.textContent).toContain("Your best on this lesson is 60 wpm");
  expect(element.querySelector(".best")).toBe(null);
});

// Proves the numbers are rounded for the screen.
test("AC11.10 the score is rounded on screen", () => {
  new ResultsView(element, { onAgain: () => {} }).show(stats(), null);
  const shown = [...element.querySelectorAll(".figures strong")].map((cell) => cell.textContent);
  expect(shown).toEqual(["61", "73", "85%", "91%", "2"]);
});

// Proves a clean run does not show an empty "missed" line.
test("AC11.11 a run with no mistakes shows no missed keys line", () => {
  new ResultsView(element, { onAgain: () => {} }).show(stats(), null);
  expect(element.querySelector(".worst")).toBe(null);
});

// Proves a mistyped space is named rather than shown as an invisible gap.
test("AC11.12 a mistyped space is named in the missed keys", () => {
  new ResultsView(element, { onAgain: () => {} }).show(stats({ errorsByKey: new Map([[" ", 3]]) }), null);
  expect(element.querySelector(".worst").textContent).toContain("space x3");
});

// Proves the again button really restarts, so the mouse works as well as Tab.
test("AC11.13 the again button starts another run", () => {
  let again = 0;
  const view = new ResultsView(element, { onAgain: () => { again += 1; } });
  view.show(stats(), null);
  element.querySelector(".again").click();
  expect(again).toBe(1);
});

// Proves a run too short to score explains itself instead of showing nothing.
test("AC11.14 an unscored run explains why", () => {
  const view = new ResultsView(element, { onAgain: () => {} });
  view.showUnscored();
  expect(element.textContent).toContain("Too short to score");
  expect(element.querySelector(".again")).not.toBe(null);
});

// Proves the panel gets out of the way when the next run starts.
test("AC11.15 hiding clears the panel", () => {
  const view = new ResultsView(element, { onAgain: () => {} });
  view.show(stats(), null);
  view.hide();
  expect(element.hidden).toBe(true);
  expect(element.textContent).toBe("");
});

// Proves the controls show what you currently have selected.
test("AC11.16 the menu marks the current choices", () => {
  new MenuView(element, { onChange: () => {} }).render({ lessonId: "home", mode: "time", seconds: 30, wordCount: 25 });
  const on = [...element.querySelectorAll("button.on")].map((button) => button.textContent);
  expect(on).toEqual(["Home row", "time", "30"]);
});

// Proves picking words mode offers word counts instead of seconds.
test("AC11.17 word mode offers word counts, not seconds", () => {
  new MenuView(element, { onChange: () => {} }).render({ lessonId: "home", mode: "words", seconds: 30, wordCount: 25 });
  const amounts = [...element.querySelectorAll(".amounts button")].map((button) => button.textContent);
  expect(amounts).toEqual(["10", "25", "50"]);
});

// Proves a control reports only the one setting it changes.
test("AC11.18 a control reports only what it changes", () => {
  const changes = [];
  new MenuView(element, { onChange: (change) => changes.push(change) }).render({ lessonId: "home", mode: "time", seconds: 30, wordCount: 25 });
  element.querySelector(".modes button:last-child").click();
  element.querySelector(".amounts button").click();
  expect(changes).toEqual([{ mode: "words" }, { seconds: 15 }]);
});

// Proves a first visit is told what to do, not shown an empty strip.
test("AC11.19 an empty history says so", () => {
  new HistoryView(element).render({ all: () => [], streak: () => 0, worstKeys: () => [] });
  expect(element.textContent).toContain("No runs saved yet");
});

// Proves your streak and recent speeds are shown once you have run something.
test("AC11.20 a used history shows the streak, recent runs and weak keys", () => {
  new HistoryView(element).render({
    all: () => [{ netWpm: 61.6 }, { netWpm: 55 }],
    streak: () => 4,
    worstKeys: () => [["a", 7], [" ", 2]],
  });
  expect(element.textContent).toBe("4 day streak   ·   last 2: 62 55   ·   weakest: a x7 space x2");
});
