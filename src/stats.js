import { UnmeasurableSessionError } from "./errors.js";

const MS_PER_MINUTE = 60000;

// The typing world counts one word as five characters, so 250 characters is 50 words.
const CHARS_PER_WORD = 5;

// Turns one typing run into the numbers we show the user. Holds no state.
export function computeStats(session, { hesitationMs = 500 } = {}) {
  const log = session.log;
  const presses = log.filter((event) => event.type === "press");

  // Speed is characters divided by time. With one keystroke there is no gap to divide by,
  // so without this we would report Infinity words per minute and show it to the user.
  if (presses.length < 2) {
    throw new UnmeasurableSessionError("a run needs at least two keystrokes to measure");
  }

  const elapsedMs = session.lastAt - session.startedAt;

  // Same problem from the other side: if every keystroke carries the same timestamp,
  // for example a paste, dividing by zero time gives Infinity.
  if (elapsedMs === 0) {
    throw new UnmeasurableSessionError("no time passed between the first and last keystroke");
  }

  const minutes = elapsedMs / MS_PER_MINUTE;
  const correctPresses = presses.filter((press) => press.correct).length;
  const correctFinal = session.entries.filter((entry) => entry.correct).length;

  return {
    elapsedMs,
    totalPresses: presses.length,
    correctPresses,
    // Raw counts every key you hit, including mistakes you later deleted.
    rawWpm: presses.length / CHARS_PER_WORD / minutes,
    // Net counts only the characters that ended up right on screen.
    netWpm: correctFinal / CHARS_PER_WORD / minutes,
    accuracy: correctPresses / presses.length,
    ...rhythm(presses, hesitationMs),
    errorsByKey: countErrorsByKey(presses),
  };
}

// Measures how evenly you type and how often you stall in the middle of a word.
function rhythm(presses, hesitationMs) {
  const gaps = [];

  // Every pair of neighbouring keystrokes gives one gap, so five presses give four gaps.
  for (let i = 1; i < presses.length; i += 1) {
    gaps.push({
      ms: presses[i].at - presses[i - 1].at,
      expected: presses[i].expected,
      previous: presses[i - 1].expected,
    });
  }

  // A pause between words is normal reading, a pause inside a word is you hunting for the key.
  const hesitations = gaps.filter(
    (gap) => gap.ms >= hesitationMs && gap.expected !== " " && gap.previous !== " ",
  ).length;

  const mean = gaps.reduce((total, gap) => total + gap.ms, 0) / gaps.length;

  // If every gap is zero the average is zero, and dividing by it gives NaN, which
  // would then show up on screen as "consistency: NaN".
  if (mean === 0) {
    return { hesitations, consistency: 1 };
  }

  const variance = gaps.reduce((total, gap) => total + (gap.ms - mean) ** 2, 0) / gaps.length;
  const spread = Math.sqrt(variance) / mean;

  // 1 means a perfectly even rhythm. Very uneven typing can push spread above 1,
  // and a negative consistency would confuse the user, so it stops at 0.
  return { hesitations, consistency: Math.max(0, 1 - spread) };
}

// Counts how many times each intended character was mistyped.
function countErrorsByKey(presses) {
  // A Map, not a plain object, because a target character could be the word
  // "constructor", which already means something on a plain object.
  const errors = new Map();

  for (const press of presses) {
    // Correct presses tell us nothing about which key you struggle with.
    if (!press.correct) {
      errors.set(press.expected, (errors.get(press.expected) ?? 0) + 1);
    }
  }

  return errors;
}
