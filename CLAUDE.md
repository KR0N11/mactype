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

### Part 3 reading the keyboard
- AC3.1 A printable key becomes a press and the browser default is stopped
- AC3.2 Space types a space instead of scrolling the page
- AC3.3 Backspace becomes a delete and cannot navigate away from the page
- AC3.4 Keys that produce no character are ignored
- AC3.5 Command and Control shortcuts are left to the browser
- AC3.6 An Option produced character such as e acute still types
- AC3.7 stop detaches the listener
- AC3.8 With no clock passed in, the time comes from the key event itself

### Part 4 drawing the run
- AC4.1 A fresh run is all pending with the cursor on the first character
- AC4.2 Typed characters are marked right or wrong and the cursor moves
- AC4.3 A finished run shows no cursor
- AC4.4 Redrawing replaces the old characters instead of adding more
- AC4.5 Angle brackets in the target are shown as text, never run as page code
- AC4.6 A space is drawn as its own character
- AC4.7 Stats are rounded on screen and the worst keys are listed
- AC4.8 A run with no mistakes shows no worst key line
- AC4.9 A mistyped space is named "space" in the worst keys
- AC4.10 A message replaces whatever was in the stats area

### Part 5 running the test
- AC5.1 The run is drawn on screen the moment it starts
- AC5.2 Each press redraws the screen
- AC5.3 Finishing the target shows the score without being asked
- AC5.4 Typing past the end changes nothing
- AC5.5 Delete at the start changes nothing
- AC5.6 Delete removes the last character
- AC5.7 A run too short to score says so instead of showing broken numbers
- AC5.8 A run where no time passed says so rather than reporting Infinity
- AC5.9 An unexpected failure while scoring is not hidden
- AC5.10 The hesitation threshold set on the trainer reaches the scoring

### Part 6 the page end to end
- AC6.1 Typing the whole target on the page produces a score
- AC6.2 A mistake is marked on the page and delete undoes it
- AC6.3 The page has no editable field for macOS to autocorrect

## Quality Gates
- Acceptance criteria: 100 percent. An AC without a passing test counts as failed.
- Code coverage: 90 percent minimum on the source directory.
- Do not lower a threshold, skip a test, or add assertion-free tests.
