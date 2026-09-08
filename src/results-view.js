// The score panel shown when a run ends.
export class ResultsView {
  #element;
  #onAgain;

  constructor(element, { onAgain }) {
    this.#element = element;
    this.#onAgain = onAgain;
  }

  // Hides the panel so it does not cover the next run.
  hide() {
    this.#element.hidden = true;
    this.#element.replaceChildren();
  }

  // Shows the numbers for a finished run, and how it compares to your best.
  show(stats, best) {
    const figures = [
      ["wpm", Math.round(stats.netWpm)],
      ["raw", Math.round(stats.rawWpm)],
      ["accuracy", `${Math.round(stats.accuracy * 100)}%`],
      ["even", `${Math.round(stats.consistency * 100)}%`],
      ["look-downs", stats.hesitations],
    ];

    const panel = [this.#heading(stats, best), this.#figures(figures)];
    const worst = this.#worstKeys(stats.errorsByKey);

    // With no mistakes there are no worst keys, and an empty row looks like a bug.
    if (worst !== null) {
      panel.push(worst);
    }

    panel.push(this.#again());
    this.#element.replaceChildren(...panel);
    this.#element.hidden = false;
  }

  // Shown when a run was too short to work out a speed for.
  showUnscored() {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "Too short to score. Type at least a couple of characters.";
    this.#element.replaceChildren(note, this.#again());
    this.#element.hidden = false;
  }

  #heading(stats, best) {
    const heading = document.createElement("p");
    heading.className = "verdict";

    // A personal best is the reason to come back tomorrow, so it gets said out loud.
    if (best === null) {
      heading.textContent = "First run on this lesson.";
    } else if (stats.netWpm > best.netWpm) {
      heading.textContent = `New best, up from ${Math.round(best.netWpm)} wpm.`;
      heading.classList.add("best");
    } else {
      heading.textContent = `Your best on this lesson is ${Math.round(best.netWpm)} wpm.`;
    }

    return heading;
  }

  #figures(figures) {
    const row = document.createElement("div");
    row.className = "figures";

    for (const [label, value] of figures) {
      const cell = document.createElement("div");
      const number = document.createElement("strong");
      number.textContent = String(value);
      const name = document.createElement("span");
      name.textContent = label;
      cell.append(number, name);
      row.append(cell);
    }

    return row;
  }

  #worstKeys(errorsByKey) {
    if (errorsByKey.size === 0) {
      return null;
    }

    const worst = [...errorsByKey.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => `${key === " " ? "space" : key} x${count}`)
      .join("   ");

    const row = document.createElement("p");
    row.className = "worst";
    row.textContent = `missed: ${worst}`;
    return row;
  }

  #again() {
    const button = document.createElement("button");
    button.className = "again";
    button.textContent = "again  ⇥";
    button.addEventListener("click", () => this.#onAgain());
    return button;
  }
}
