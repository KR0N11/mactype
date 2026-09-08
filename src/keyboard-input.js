// Turns raw browser key presses into simple calls: press, backspace, or restart.
export class KeyboardInput {
  #eventTarget;
  #onPress;
  #onBackspace;
  #onRestart;
  #now;
  #handler;

  constructor(eventTarget, { onPress, onBackspace, onRestart = () => {}, now = (event) => event.timeStamp }) {
    this.#eventTarget = eventTarget;
    this.#onPress = onPress;
    this.#onBackspace = onBackspace;
    this.#onRestart = onRestart;
    this.#now = now;
    this.#handler = (event) => this.#handle(event);
  }

  // Begins listening for keys anywhere on the page.
  start() {
    this.#eventTarget.addEventListener("keydown", this.#handler);
  }

  // Stops listening, so a finished run does not keep eating keys.
  stop() {
    this.#eventTarget.removeEventListener("keydown", this.#handler);
  }

  // Decides whether one key press is typing, deleting, restarting, or none of our business.
  #handle(event) {
    // Command and Control belong to the browser and the Mac. If we swallowed them,
    // Cmd+R would type an "r" instead of reloading the page.
    if (event.metaKey || event.ctrlKey) {
      return;
    }

    if (event.key === "Tab") {
      // Without this, Tab moves focus to the browser toolbar and typing stops working.
      event.preventDefault();
      this.#onRestart();
      return;
    }

    if (event.key === "Backspace") {
      // Without this, older browsers treat Backspace as the back button and leave the page.
      event.preventDefault();
      this.#onBackspace(this.#now(event));
      return;
    }

    // event.key is a single character only for keys that produce text. Shift and
    // the arrows give multi character names like "ArrowLeft", so this filters them out.
    if ([...event.key].length === 1) {
      // Without this, pressing space scrolls the page down on every word.
      event.preventDefault();
      this.#onPress(event.key, this.#now(event));
    }
  }
}
