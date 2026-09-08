import { test, expect, beforeEach } from "vitest";
import { RunClock } from "../src/run-clock.js";

let ticks;
let expired;
let now;
let scheduled;
let cancelled;

beforeEach(() => {
  ticks = [];
  expired = 0;
  now = 0;
  scheduled = [];
  cancelled = [];
});

// Builds a clock with time and timers we control, so a 30 second run takes no time.
function makeClock() {
  return new RunClock({
    onTick: (remaining) => ticks.push(remaining),
    onExpire: () => { expired += 1; },
    now: () => now,
    schedule: (fn) => { scheduled.push(fn); return scheduled.length; },
    cancel: (handle) => cancelled.push(handle),
  });
}

// Runs one timer tick after moving time forward.
function advance(clock, ms) {
  now += ms;
  scheduled[scheduled.length - 1]();
  return clock;
}

// Proves starting a countdown immediately shows the full time.
test("AC10.1 starting shows the full time straight away", () => {
  const clock = makeClock();
  clock.start(30000);
  expect(ticks).toEqual([30000]);
  expect(clock.remainingMs).toBe(30000);
});

// Proves the time left goes down as real time passes.
test("AC10.2 the time left counts down", () => {
  const clock = makeClock();
  clock.start(30000);
  advance(clock, 1000);
  advance(clock, 1000);
  expect(ticks).toEqual([30000, 29000, 28000]);
});

// Proves the run ends exactly once when the time is up.
test("AC10.3 running out of time ends the run once", () => {
  const clock = makeClock();
  clock.start(1000);
  advance(clock, 1000);
  expect(expired).toBe(1);
  expect(clock.remainingMs).toBe(0);
  expect(cancelled).toHaveLength(1);
});

// Proves the time left never goes negative, which would show as "-3s" on screen.
test("AC10.4 overshooting the end still reads as zero", () => {
  const clock = makeClock();
  clock.start(1000);
  advance(clock, 5000);
  expect(clock.remainingMs).toBe(0);
  expect(ticks.at(-1)).toBe(0);
});

// Proves restarting throws away the old countdown, so two timers cannot run at once.
test("AC10.5 starting again cancels the previous countdown", () => {
  const clock = makeClock();
  clock.start(30000);
  clock.start(15000);
  expect(cancelled).toHaveLength(1);
  expect(clock.remainingMs).toBe(15000);
});

// Proves stopping a clock that was never started does not fail.
test("AC10.6 stopping an idle clock is safe", () => {
  const clock = makeClock();
  clock.stop();
  clock.stop();
  expect(cancelled).toEqual([]);
});
