// The strip above the text: how much of the run is left, and how fast you are going.
export class HudView {
  #element;

  constructor(element) {
    this.#element = element;
  }

  // Shows the seconds left in a timed run.
  showTime(remainingMs) {
    this.#write(`${Math.ceil(remainingMs / 1000)}s`);
  }

  // Shows how many words of a fixed length run are done.
  showProgress(session) {
    const done = [...session.target].slice(0, session.cursor).filter((char) => char === " ").length;
    const total = [...session.target].filter((char) => char === " ").length + 1;
    this.#write(`${Math.min(done + 1, total)} / ${total}`);
  }

  #write(text) {
    this.#element.textContent = text;
  }
}
