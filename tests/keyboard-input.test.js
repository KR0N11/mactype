// @vitest-environment jsdom
import { test, expect, beforeEach } from "vitest";
import { KeyboardInput } from "../src/keyboard-input.js";

let pressed;
let deleted;
let clock;
let page;

beforeEach(() => {
  pressed = [];
  deleted = [];
  clock = 0;
  // A fresh element per test, so a listener left attached by one test cannot
  // add phantom keystrokes to the next one.
  page = document.createElement("div");
});

// Builds an input wired to plain arrays, with a clock we control.
function makeInput(eventTarget = page) {
  return new KeyboardInput(eventTarget, {
    onPress: (char, at) => pressed.push([char, at]),
    onBackspace: (at) => deleted.push(at),
    now: () => (clock += 100),
  });
}

// Sends one key press to the page.
function key(name, modifiers = {}) {
  const event = new KeyboardEvent("keydown", { key: name, cancelable: true, ...modifiers });
  page.dispatchEvent(event);
  return event;
}

// Proves a letter reaches the trainer as a press, and the page does not act on it.
test("AC3.1 a printable key becomes a press and the browser default is stopped", () => {
  makeInput().start();
  const event = key("a");
  expect(pressed).toEqual([["a", 100]]);
  expect(event.defaultPrevented).toBe(true);
});

// Proves space is treated as a character, not as scroll the page.
test("AC3.2 space is a character, not a scroll", () => {
  makeInput().start();
  const event = key(" ");
  expect(pressed).toEqual([[" ", 100]]);
  expect(event.defaultPrevented).toBe(true);
});

// Proves delete is routed to backspace and cannot navigate away from the page.
test("AC3.3 Backspace becomes a delete and the browser default is stopped", () => {
  makeInput().start();
  const event = key("Backspace");
  expect(deleted).toEqual([100]);
  expect(pressed).toEqual([]);
  expect(event.defaultPrevented).toBe(true);
});

// Proves keys that produce no text are ignored instead of typed.
test("AC3.4 keys with no character are ignored", () => {
  makeInput().start();
  for (const name of ["Shift", "Tab", "ArrowLeft", "Escape", "Enter", "CapsLock", "F5"]) {
    key(name);
  }
  expect(pressed).toEqual([]);
  expect(deleted).toEqual([]);
});

// Proves Cmd and Ctrl shortcuts still belong to the browser, so Cmd+R still reloads.
test("AC3.5 Command and Control shortcuts are left alone", () => {
  makeInput().start();
  const meta = key("r", { metaKey: true });
  const ctrl = key("r", { ctrlKey: true });
  expect(pressed).toEqual([]);
  expect(meta.defaultPrevented).toBe(false);
  expect(ctrl.defaultPrevented).toBe(false);
});

// Proves Option-accented characters still type, since Option is a normal Mac letter key.
test("AC3.6 an Option produced character still types", () => {
  makeInput().start();
  key("é", { altKey: true });
  expect(pressed).toEqual([["é", 100]]);
});

// Proves a stopped input no longer eats keys.
test("AC3.7 stop detaches the listener", () => {
  const input = makeInput();
  input.start();
  key("a");
  input.stop();
  const event = key("b");
  expect(pressed).toEqual([["a", 100]]);
  expect(event.defaultPrevented).toBe(false);
});

// Proves the real page reads the time off the key press itself, with no clock passed in.
test("AC3.8 without a clock the time comes from the event", () => {
  const input = new KeyboardInput(page, {
    onPress: (char, at) => pressed.push([char, at]),
    onBackspace: (at) => deleted.push(at),
  });
  input.start();
  const event = key("a");
  expect(pressed).toEqual([["a", event.timeStamp]]);
  expect(typeof event.timeStamp).toBe("number");
  input.stop();
});
