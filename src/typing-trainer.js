import { TypingSession } from "./session.js";
import { computeStats } from "./stats.js";
import { UnmeasurableSessionError } from "./errors.js";

// Runs one typing test: holds the session, updates the screen, scores the finish.
export class TypingTrainer {
  #view;
  #hesitationMs;
  #session;

  constructor(view, target, { hesitationMs = 500 } = {}) {
    this.#view = view;
    this.#hesitationMs = hesitationMs;
    // Built here rather than in a later start() call, so there is never a moment
    // where the trainer exists with no run to type into.
    this.#session = new TypingSession(target);
    this.#view.render(this.#session);
  }

  get session() {
    return this.#session;
  }

  // Records one typed character and redraws.
  press(char, at) {
    // Typing past the last character is a normal thing a person does, not a bug.
    // The session would throw, and an uncaught throw stops the page updating at all.
    if (this.#session.isComplete) {
      return;
    }

    this.#session.press(char, at);
    this.#view.render(this.#session);

    if (this.#session.isComplete) {
      this.#finish();
    }
  }

  // Undoes the last character and redraws.
  backspace(at) {
    // Same reason: hitting delete at the very start is a normal reflex, so we
    // do nothing rather than let the session's error stop the page.
    if (this.#session.cursor === 0) {
      return;
    }

    this.#session.backspace(at);
    this.#view.render(this.#session);
  }

  // Works out the score and shows it, or says why the run could not be scored.
  #finish() {
    try {
      this.#view.showStats(computeStats(this.#session, { hesitationMs: this.#hesitationMs }));
    } catch (error) {
      // The rules for "too short to score" live in one place, in computeStats.
      // Copying them here would mean changing the same rule in two files.
      if (!(error instanceof UnmeasurableSessionError)) {
        throw error;
      }

      this.#view.showMessage("Not enough typing to score that run.");
    }
  }
}
