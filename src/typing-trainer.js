import { TypingSession } from "./session.js";
import { computeStats } from "./stats.js";
import { UnmeasurableSessionError } from "./errors.js";

// Runs one typing test. Reports what happens through callbacks, so it never
// touches the screen and can be tested without a browser.
export class TypingTrainer {
  #session;
  #hesitationMs;
  #onProgress;
  #onFinish;
  #finished = false;

  constructor(target, { hesitationMs = 500, onProgress = () => {}, onFinish = () => {} } = {}) {
    this.#session = new TypingSession(target);
    this.#hesitationMs = hesitationMs;
    this.#onProgress = onProgress;
    this.#onFinish = onFinish;
  }

  get session() {
    return this.#session;
  }

  get isFinished() {
    return this.#finished;
  }

  // Records one typed character.
  press(char, at) {
    // Typing past the end, or after the clock ran out, is a normal thing a person
    // does. The session would throw, and an uncaught throw freezes the page.
    if (this.#finished || this.#session.isComplete) {
      return;
    }

    this.#session.press(char, at);
    this.#onProgress(this.#session);

    if (this.#session.isComplete) {
      this.finish();
    }
  }

  // Undoes the last character.
  backspace(at) {
    // Delete at the very start is a normal reflex, so do nothing rather than throw.
    if (this.#finished || this.#session.cursor === 0) {
      return;
    }

    this.#session.backspace(at);
    this.#onProgress(this.#session);
  }

  // Ends the run and reports the score. Called by the clock running out too.
  finish() {
    // The clock and the last keystroke can both end a run in the same instant,
    // and scoring twice would save the run to history twice.
    if (this.#finished) {
      return;
    }

    this.#finished = true;
    this.#onFinish(this.#score());
  }

  // Works out the score, or says the run was too short to score.
  #score() {
    try {
      return { scored: true, stats: computeStats(this.#session, { hesitationMs: this.#hesitationMs }) };
    } catch (error) {
      // The rule for "too short to score" lives in computeStats. Repeating it here
      // would mean changing the same rule in two files.
      if (!(error instanceof UnmeasurableSessionError)) {
        throw error;
      }

      return { scored: false };
    }
  }
}
