// The strip at the bottom: your streak, recent runs, and the keys you keep missing.
export class HistoryView {
  #element;

  constructor(element) {
    this.#element = element;
  }

  // Redraws from whatever is saved in the browser.
  render(history) {
    const runs = history.all().slice(0, 8);

    // A first visit has nothing to show, and an empty strip looks broken.
    if (runs.length === 0) {
      this.#element.textContent = "No runs saved yet. Finish one and it stays here.";
      return;
    }

    const streak = history.streak();
    const worst = history.worstKeys(5);
    const parts = [`${streak} day streak`, `last ${runs.length}: ${runs.map((run) => Math.round(run.netWpm)).join(" ")}`];

    // With a clean history there are no worst keys, and a dangling label reads as a bug.
    if (worst.length > 0) {
      parts.push(`weakest: ${worst.map(([key, count]) => `${key === " " ? "space" : key} x${count}`).join(" ")}`);
    }

    this.#element.textContent = parts.join("   ·   ");
  }
}
