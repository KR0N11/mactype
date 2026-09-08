const STATE_CLASS = { pending: "pending", correct: "correct", wrong: "wrong" };

// Draws the run on the page. Knows nothing about keys or scoring.
export class SessionView {
  #textElement;
  #statsElement;

  constructor(textElement, statsElement) {
    this.#textElement = textElement;
    this.#statsElement = statsElement;
  }

  // Paints the target text, one span per character, coloured by how you did.
  render(session) {
    const characters = [...session.target];
    const entries = session.entries;
    this.#textElement.replaceChildren();

    for (let i = 0; i < characters.length; i += 1) {
      const span = document.createElement("span");

      // Characters you have not reached yet have no entry, so there is nothing to judge.
      if (i < entries.length) {
        span.className = entries[i].correct ? STATE_CLASS.correct : STATE_CLASS.wrong;
      } else {
        span.className = STATE_CLASS.pending;
      }

      // Marks where you are, so you can follow along without looking at the keys.
      if (i === entries.length) {
        span.classList.add("cursor");
      }

      // textContent, not innerHTML. The user can paste their own practice text, and
      // pasting "<img onerror=...>" would otherwise run as code on the page.
      span.textContent = characters[i];
      this.#textElement.append(span);
    }
  }

  // Puts the final numbers on screen. All rounding happens here, never in the scoring.
  showStats(stats) {
    const worst = [...stats.errorsByKey.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, count]) => `${key === " " ? "space" : key} x${count}`)
      .join(", ");

    const lines = [
      `${Math.round(stats.netWpm)} wpm`,
      `${Math.round(stats.rawWpm)} raw`,
      `${Math.round(stats.accuracy * 100)}% accurate`,
      `${Math.round(stats.consistency * 100)}% even`,
      `${stats.hesitations} look-downs`,
    ];

    // With no mistakes there are no worst keys, and an empty line looks like a bug.
    if (worst !== "") {
      lines.push(`worst: ${worst}`);
    }

    this.#statsElement.textContent = lines.join("  ·  ");
  }

  // Used when a run finished but there was not enough typing to score it.
  showMessage(text) {
    this.#statsElement.textContent = text;
  }
}
