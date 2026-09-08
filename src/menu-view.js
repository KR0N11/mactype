import { LESSONS } from "./lessons.js";

const SECONDS = [15, 30, 60];
const WORD_COUNTS = [10, 25, 50];

// The controls at the top: which lesson, timed or a fixed number of words, how long.
export class MenuView {
  #element;
  #onChange;

  constructor(element, { onChange }) {
    this.#element = element;
    this.#onChange = onChange;
  }

  // Redraws the controls with the current choices marked as selected.
  render(config) {
    const amounts = config.mode === "time" ? SECONDS : WORD_COUNTS;
    const amountKey = config.mode === "time" ? "seconds" : "wordCount";

    this.#element.replaceChildren(
      this.#group(LESSONS.map((lesson) => [lesson.name, { lessonId: lesson.id }, lesson.id === config.lessonId, lesson.hint]), "lessons"),
      this.#group([
        ["time", { mode: "time" }, config.mode === "time"],
        ["words", { mode: "words" }, config.mode === "words"],
      ], "modes"),
      this.#group(amounts.map((amount) => [String(amount), { [amountKey]: amount }, config[amountKey] === amount]), "amounts"),
    );
  }

  // Builds one row of buttons. Each button reports only the setting it changes.
  #group(items, className) {
    const row = document.createElement("div");
    row.className = `group ${className}`;

    for (const [label, change, selected, hint] of items) {
      const button = document.createElement("button");
      button.textContent = label;

      // The selected button has to look different or you cannot tell what you picked.
      if (selected) {
        button.classList.add("on");
      }

      if (hint !== undefined) {
        button.title = hint;
      }

      button.addEventListener("click", () => this.#onChange(change));
      row.append(button);
    }

    return row;
  }
}
