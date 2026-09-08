import {
  InvalidTargetError,
  InvalidKeystrokeError,
  InvalidTimestampError,
  NothingToDeleteError,
  SessionCompleteError,
} from "./errors.js";

// One typing run over one target string. Pure: no DOM, no clock, no storage.
export class TypingSession {
  #target;
  #chars;
  #entries = [];
  #log = [];
  #lastAt = null;

  constructor(target) {
    if (typeof target !== "string" || target.length === 0) {
      throw new InvalidTargetError("target must be a non empty string");
    }
    this.#target = target;
    // Indexed by code point, so one press always maps to one target character.
    this.#chars = [...target];
  }

  get target() {
    return this.#target;
  }

  get cursor() {
    return this.#entries.length;
  }

  get isComplete() {
    return this.#entries.length === this.#chars.length;
  }

  // Null until the first accepted keystroke. The clock starts on typing, not on load.
  get startedAt() {
    return this.#log.length === 0 ? null : this.#log[0].at;
  }

  get lastAt() {
    return this.#lastAt;
  }

  get entries() {
    return this.#entries.map((entry) => ({ ...entry }));
  }

  // Append only history, keeps mistakes that were later backspaced away.
  get log() {
    return this.#log.map((event) => ({ ...event }));
  }

  press(char, at) {
    if (typeof char !== "string" || [...char].length !== 1) {
      throw new InvalidKeystrokeError("press takes exactly one character");
    }
    this.#assertTimestamp(at);
    if (this.isComplete) {
      throw new SessionCompleteError("the target is already fully typed");
    }
    const index = this.cursor;
    const expected = this.#chars[index];
    const correct = char === expected;
    this.#entries.push({ expected, actual: char, correct });
    this.#record({ type: "press", index, expected, actual: char, correct, at });
  }

  backspace(at) {
    this.#assertTimestamp(at);
    if (this.cursor === 0) {
      throw new NothingToDeleteError("nothing typed yet");
    }
    const removed = this.#entries.pop();
    this.#record({ type: "backspace", index: this.cursor, removed, at });
  }

  // Timestamps must be real and must not go backwards, or every duration lies.
  #assertTimestamp(at) {
    if (typeof at !== "number" || !Number.isFinite(at)) {
      throw new InvalidTimestampError("timestamp must be a finite number");
    }
    if (this.#lastAt !== null && at < this.#lastAt) {
      throw new InvalidTimestampError("timestamps must not move backwards");
    }
  }

  #record(event) {
    this.#log.push(event);
    this.#lastAt = event.at;
  }
}
