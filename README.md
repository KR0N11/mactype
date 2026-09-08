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

## Status

Session state machine, run scoring, and the browser layer are done and tested.
Text corpus and saved run history are not built yet.
