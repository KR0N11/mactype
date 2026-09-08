// Counts a run down to zero. The timer functions are passed in so tests can
// run a 60 second countdown instantly.
export class RunClock {
  #onTick;
  #onExpire;
  #now;
  #schedule;
  #cancel;
  #handle = null;
  #endsAt = 0;

  constructor({ onTick = () => {}, onExpire = () => {}, now = () => Date.now(), schedule = setInterval, cancel = clearInterval } = {}) {
    this.#onTick = onTick;
    this.#onExpire = onExpire;
    this.#now = now;
    this.#schedule = schedule;
    this.#cancel = cancel;
  }

  get remainingMs() {
    return Math.max(0, this.#endsAt - this.#now());
  }

  // Starts a fresh countdown, throwing away any countdown already running.
  start(durationMs, tickMs = 100) {
    this.stop();
    this.#endsAt = this.#now() + durationMs;
    this.#onTick(this.remainingMs);
    this.#handle = this.#schedule(() => this.#tick(), tickMs);
  }

  // Stops the countdown. Safe to call when nothing is running.
  stop() {
    if (this.#handle !== null) {
      this.#cancel(this.#handle);
      this.#handle = null;
    }
  }

  #tick() {
    this.#onTick(this.remainingMs);

    // Without stopping here the timer keeps firing after the run is over and
    // the score would be recalculated forever.
    if (this.remainingMs === 0) {
      this.stop();
      this.#onExpire();
    }
  }
}
