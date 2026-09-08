# CLAUDE.md

## Task
A Monkeytype-style typing trainer tailored for Mac users, training touch typing:
eyes on the screen, never on the keys.

## Decisions
Answered by me, delegated by the driver on 2026-09-07. Reopen any of these.

- D1 Screentyping means touch typing. The product goal is keeping the eyes on
  screen, so the metrics must expose look-down behaviour, not just speed.
- D2 Mac tailoring means three things: the Mac keyboard shape (no numpad,
  ANSI vs ISO backtick), suppressing macOS input interference during a test
  (smart quotes, text substitution, press-and-hold accent popup), and modifier
  chord drills as content.
- D3 Browser app, plain JavaScript, no framework, no build step. Chosen because
  D1 is about the alphanumeric block, not shortcuts. If chord drills become
  core, this is the wrong call and we move to SwiftUI.
- D4 Text comes from bundled JSON corpora plus paste-your-own. No OCR.
- D5 Metrics: net WPM, raw WPM, accuracy, per key error counts, consistency,
  and hesitation (long pause mid word) as the look-down proxy.
- D6 Persistence is localStorage, last N runs, no accounts.

## Stack
- Plain ES modules, no framework
- vitest as test runner, v8 coverage
- No runtime dependencies

## Commands
- `npm test` runs the suite and enforces the coverage gate

## Conventions
- No abstraction the stated requirements do not need
- No service, repository, or factory layer unless the spec demands it
- One class or module per file
- Comments: one short line above each major block, never inline
- No em dashes
- Domain modules never touch the DOM, the clock, or storage

## Acceptance Criteria

### Part 1 typing session state machine
- AC1.1 A session is built from a non empty target string and starts at cursor 0
- AC1.2 An empty or non string target is rejected
- AC1.3 Pressing the expected character advances the cursor and records a correct entry
- AC1.4 Pressing a wrong character advances the cursor and records an incorrect entry
- AC1.5 Backspace moves the cursor back one and drops the last entry
- AC1.6 Backspace at cursor 0 is rejected and leaves state unchanged
- AC1.7 A press once the target is fully typed is rejected and leaves state unchanged
- AC1.8 A keystroke that is not a single character is rejected
- AC1.9 A timestamp that is not finite is rejected
- AC1.10 A timestamp earlier than the previous keystroke is rejected
- AC1.11 The clock starts on the first keystroke, not on construction
- AC1.12 The keystroke log keeps corrected mistakes after a backspace

### Part 2 scoring a run
- AC2.1 A perfect run reports the same net and raw speed, and accuracy 1
- AC2.2 A wrong character lowers net speed and accuracy, raw speed is unchanged
- AC2.3 A mistake that was backspaced away still counts against accuracy
- AC2.4 Errors are counted against the character that was meant to be typed
- AC2.5 A target character that collides with an object field is still counted
- AC2.6 An even rhythm scores consistency 1, an uneven one scores lower
- AC2.7 Consistency never goes below 0
- AC2.8 A long pause inside a word counts as a hesitation
- AC2.9 A long pause either side of a space does not count as a hesitation
- AC2.10 The hesitation threshold is caller controlled, and the boundary counts
- AC2.11 A run with fewer than two keystrokes is refused, state unchanged
- AC2.12 A run where no time passed is refused, state unchanged
- AC2.13 Gaps of zero give a real consistency number, never NaN

## Quality Gates
- Acceptance criteria: 100 percent. An AC without a passing test counts as failed.
- Code coverage: 90 percent minimum on the source directory.
- Do not lower a threshold, skip a test, or add assertion-free tests.
