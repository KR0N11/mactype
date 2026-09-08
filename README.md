# mactype

A typing trainer for Mac users, built to train touch typing: eyes on the
screen, never on the keys.

## Run

```bash
npm install
npx http-server -p 8765     # or: python3 -m http.server 8765
open http://localhost:8765/index.html
```

A server is required. The code uses ES modules, and browsers refuse to load
modules over `file://`, so opening `index.html` directly gives a blank page.

```bash
npm test                    # suite plus the 90% coverage gate
```

## Design decisions

**There is no text box on the page.** macOS rewrites what you type inside
editable fields: smart quotes, text substitution, and the press-and-hold accent
popup. Those only fire where the system thinks you are editing text. Rather
than fight each one, the page has no editable field at all and reads key
presses off the document. `autocorrect="off"` would not have worked, because
the macOS substitutions sit underneath the browser and ignore it.

**Command and Control presses are handed back to the browser**, so Cmd+R still
reloads and Cmd+L still reaches the address bar.

**Three layers, and the middle one is pure.** `TypingSession` and
`computeStats` know nothing about the browser: time is passed in rather than
read from a clock, so a 90-second run can be tested in a millisecond.
`KeyboardInput` only reads keys, `SessionView` only draws, `TypingTrainer`
owns the run and decides when it is over.

**Hesitation is the metric that matters here.** A long pause between words is
you reading ahead. A long pause inside a word is you looking down at the
keyboard. Only the second one is counted, and that number is the one to drive
down.

**Raw speed counts every key you hit. Net speed counts what ended up right on
screen.** A mistake you backspaced away still counts against accuracy, because
otherwise deleting everything would score 100%.

## Assumptions

- English, single Mac keyboard layout. Dead keys do not compose, so Option-E
  then E gives two presses rather than one accented character.
- Desktop only. With no editable field there is no on-screen keyboard on iOS.
- One run per page load. Restart arrives with the text corpus, since a restart
  needs a new text to type.
- The target text is currently a single hardcoded sentence.

## What it does

- 11 lessons: home row, top row, bottom row, all letters, common words,
  capitals, punctuation, the number row, symbols, and code.
- Two modes: timed (15/30/60s) or a fixed number of words (10/25/50).
- Live countdown or word progress while you type, a score when you finish,
  and Tab to go again.
- Your runs are saved in the browser: personal best per lesson, a day streak,
  and the keys you miss most across every run.

## Why there is no login

Accounts need a server, a database and password handling, and none of it makes
you type faster. What an account would buy you here is remembered progress, and
the browser already does that: best scores, streak and weak keys all persist
with no sign-in and no network. Accounts would only start earning their cost if
you wanted the same history on a second device.
