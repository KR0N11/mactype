// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { startApp } from "../src/app.js";

let clock;
let now;
let scheduled;
let running;

// A stand in for the browser's saved data.
function fakeStorage() {
  const data = {};
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = value; },
    removeItem: (key) => { delete data[key]; },
  };
}

beforeEach(() => {
  clock = 0;
  now = 0;
  scheduled = [];
  running = [];
  document.body.innerHTML = '<nav id="menu"></nav><div id="hud"></div><div id="text"></div><section id="results" hidden></section><footer id="history"></footer>';
});

// Every app attaches a key listener to the page. One left attached would feed
// keystrokes into a finished test's app, so they are all detached afterwards.
afterEach(() => {
  for (const app of running) {
    app.input.stop();
  }
});

// Starts the app with time, timers and randomness all under our control.
function launch(config = {}, storage = fakeStorage()) {
  const app = startApp(document, {
    storage,
    config: { lessonId: "common", mode: "words", wordCount: 10, seconds: 15, ...config },
    random: () => 0,
    now: () => (clock += 100),
    clock: { now: () => now, schedule: (fn) => { scheduled.push(fn); return scheduled.length; }, cancel: () => {} },
  });

  running.push(app);
  return app;
}

// Sends one key press to the page, as a real Mac keyboard would.
function key(name, modifiers = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: name, cancelable: true, ...modifiers }));
}

// Types the whole of the current run's text.
function typeRun(app) {
  for (const char of app.controller.trainer.session.target) {
    key(char);
  }
}

// Proves the app opens with text to type and controls to change it.
test("AC12.1 the app opens ready to type", () => {
  const app = launch();
  expect(document.querySelector("#text .line").children.length).toBeGreaterThan(0);
  expect(document.querySelectorAll("#menu button.on")).toHaveLength(3);
  expect(document.getElementById("hud").textContent).toBe("1 / 10");
});

// Proves typing the whole text ends the run and shows a real score.
test("AC12.2 finishing a run shows the score", () => {
  const app = launch();
  typeRun(app);
  const results = document.getElementById("results");
  expect(results.hidden).toBe(false);
  expect(results.querySelector(".figures").textContent).toContain("wpm");
});

// Proves a finished run is remembered, which is what replaces having an account.
test("AC12.3 a finished run is saved and shown in the history strip", () => {
  const storage = fakeStorage();
  const app = launch({}, storage);
  typeRun(app);
  expect(app.history.all()).toHaveLength(1);
  expect(app.history.all()[0].lessonId).toBe("common");
  expect(document.getElementById("history").textContent).toContain("1 day streak");
});

// Proves your best carries across runs, so the second run can beat the first.
test("AC12.4 a second run is compared against your best", () => {
  const storage = fakeStorage();
  const first = launch({}, storage);
  typeRun(first);

  const second = launch({}, storage);
  typeRun(second);
  expect(document.getElementById("results").textContent).toMatch(/best/);
  expect(second.history.all()).toHaveLength(2);
});

// Proves Tab starts a fresh run instead of moving focus off the page.
test("AC12.5 Tab restarts with a clean run", () => {
  const app = launch();
  key("a");
  expect(app.controller.trainer.session.cursor).toBe(1);
  key("Tab");
  expect(app.controller.trainer.session.cursor).toBe(0);
  expect(document.getElementById("results").hidden).toBe(true);
});

// Proves clicking a lesson really changes what you are asked to type.
test("AC12.6 picking a lesson changes the text", () => {
  const app = launch();
  const before = app.controller.trainer.session.target;
  [...document.querySelectorAll("#menu .lessons button")].find((button) => button.textContent === "Home row").click();
  expect(app.controller.config.lessonId).toBe("home");
  expect(app.controller.trainer.session.target).not.toBe(before);
  expect([...app.controller.trainer.session.target].every((char) => "asdfjkl; ".includes(char))).toBe(true);
});

// Proves switching to a timed run puts a countdown on screen.
test("AC12.7 switching to a timed run shows a countdown", () => {
  const app = launch();
  [...document.querySelectorAll("#menu .modes button")].find((button) => button.textContent === "time").click();
  expect(document.getElementById("hud").textContent).toBe("15s");
});

// Proves the clock only starts once you type, so reading the text is free.
test("AC12.8 the countdown starts on the first keystroke, not on load", () => {
  const app = launch({ mode: "time", seconds: 15 });
  expect(scheduled).toHaveLength(0);
  key("t");
  expect(scheduled).toHaveLength(1);
});

// Proves running out of time ends the run and scores what you managed.
test("AC12.9 running out of time ends the run and scores it", () => {
  const app = launch({ mode: "time", seconds: 15 });
  key("t");
  key("h");
  key("e");
  now += 15000;
  scheduled[0]();
  expect(app.controller.trainer.isFinished).toBe(true);
  expect(document.getElementById("results").hidden).toBe(false);
  expect(app.history.all()).toHaveLength(1);
});

// Proves a timed run has more text than anyone could type in the time.
test("AC12.10 a timed run never runs out of text", () => {
  const app = launch({ mode: "time", seconds: 60 });
  const words = app.controller.trainer.session.target.split(" ").length;
  expect(words).toBeGreaterThanOrEqual(240);
});

// Proves a run you barely started is not saved as a real result.
test("AC12.11 a run too short to score is not saved to history", () => {
  const app = launch({ wordCount: 1, lessonId: "home" });
  key(app.controller.trainer.session.target[0]);
  key("Tab");
  expect(app.history.all()).toEqual([]);
});

// Proves Cmd shortcuts still reach the browser, so Cmd+R still reloads.
test("AC12.12 Command shortcuts are left to the browser", () => {
  const app = launch();
  const event = new KeyboardEvent("keydown", { key: "r", metaKey: true, cancelable: true });
  document.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  expect(app.controller.trainer.session.cursor).toBe(0);
});

// Proves the page has no text box, which is what keeps macOS out of the way.
test("AC12.13 the page has no editable field for macOS to autocorrect", () => {
  const app = launch();
  expect(document.querySelector("input, textarea, [contenteditable]")).toBe(null);
});
