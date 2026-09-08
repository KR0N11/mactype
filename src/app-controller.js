import { buildText } from "./lessons.js";
import { TypingTrainer } from "./typing-trainer.js";

// Words per second a very fast typist manages, used to make sure a timed run
// never runs out of text before the clock runs out.
const FAST_WORDS_PER_SECOND = 4;

// Owns what you picked, starts each run, and decides what happens when one ends.
export class AppController {
  #views;
  #history;
  #clock;
  #random;
  #config;
  #trainer = null;

  constructor({ views, history, clock, random = Math.random, config }) {
    this.#views = views;
    this.#history = history;
    this.#clock = clock;
    this.#random = random;
    this.#config = config;
  }

  get config() {
    return { ...this.#config };
  }

  get trainer() {
    return this.#trainer;
  }

  // Applies one changed setting and starts a fresh run with it.
  change(change) {
    this.#config = { ...this.#config, ...change };
    this.start();
  }

  // Begins a new run using the current settings.
  start() {
    this.#clock.stop();
    const wordCount = this.#config.mode === "time"
      ? this.#config.seconds * FAST_WORDS_PER_SECOND
      : this.#config.wordCount;

    this.#trainer = new TypingTrainer(buildText(this.#config.lessonId, wordCount, this.#random), {
      onProgress: (session) => this.#onProgress(session),
      onFinish: (result) => this.#onFinish(result),
    });

    this.#views.menu.render(this.#config);
    this.#views.results.hide();
    this.#views.session.render(this.#trainer.session);
    this.#views.history.render(this.#history);
    this.#showRemaining(this.#config.seconds * 1000);
  }

  press(char, at) {
    // The clock starts on the first keystroke, not when the page loads, so that
    // reading the text first does not eat into your time.
    if (this.#config.mode === "time" && this.#trainer.session.cursor === 0) {
      this.#clock.start(this.#config.seconds * 1000);
    }

    this.#trainer.press(char, at);
  }

  backspace(at) {
    this.#trainer.backspace(at);
  }

  #onProgress(session) {
    this.#views.session.render(session);

    // A timed run shows the clock instead, and the clock updates itself.
    if (this.#config.mode === "words") {
      this.#views.hud.showProgress(session);
    }
  }

  #onFinish(result) {
    this.#clock.stop();

    if (!result.scored) {
      this.#views.results.showUnscored();
      return;
    }

    const best = this.#history.best(this.#config.lessonId);
    this.#views.results.show(result.stats, best);
    this.#history.record(this.#run(result.stats));
    this.#views.history.render(this.#history);
  }

  // Turns a finished run into the small record we keep in the browser.
  #run(stats) {
    return {
      at: Date.now(),
      lessonId: this.#config.lessonId,
      mode: this.#config.mode,
      netWpm: stats.netWpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      consistency: stats.consistency,
      hesitations: stats.hesitations,
      // A Map cannot be saved as JSON, so the counts are stored as pairs.
      errors: [...stats.errorsByKey.entries()],
    };
  }

  #showRemaining(remainingMs) {
    if (this.#config.mode === "time") {
      this.#views.hud.showTime(remainingMs);
    } else {
      this.#views.hud.showProgress(this.#trainer.session);
    }
  }

  // Called by the countdown on every tick.
  tick(remainingMs) {
    this.#showRemaining(remainingMs);
  }

  // Called by the countdown when the run is out of time.
  expire() {
    this.#trainer.finish();
  }
}
