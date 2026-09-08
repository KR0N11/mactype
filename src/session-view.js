// Draws the text you are typing. Knows nothing about keys or scoring.
export class SessionView {
  #element;
  #line;

  constructor(element) {
    this.#element = element;
    this.#line = document.createElement("div");
    this.#line.className = "line";
    this.#element.replaceChildren(this.#line);
  }

  // Paints the target text, one span per character, coloured by how you did.
  render(session) {
    const characters = [...session.target];
    const entries = session.entries;
    const spans = [];

    for (let i = 0; i < characters.length; i += 1) {
      const span = document.createElement("span");

      // Characters you have not reached yet have no entry, so there is nothing to judge.
      if (i < entries.length) {
        span.className = entries[i].correct ? "correct" : "wrong";
      } else {
        span.className = "pending";
      }

      // Marks where you are, so you can follow along without looking at the keys.
      if (i === entries.length) {
        span.classList.add("cursor");
      }

      // textContent, not innerHTML. Practice text could contain "<img onerror=...>",
      // and innerHTML would run it as code on the page.
      span.textContent = characters[i];
      spans.push(span);
    }

    this.#line.replaceChildren(...spans);
    this.#scrollToCursor();
  }

  // Slides the text up so the line you are typing stays in view.
  #scrollToCursor() {
    const cursor = this.#line.querySelector(".cursor");

    // A finished run has no cursor left, and a test browser reports no layout,
    // so there is nothing to scroll to in either case.
    if (cursor === null || typeof cursor.offsetTop !== "number") {
      return;
    }

    const lineHeight = cursor.offsetHeight || 1;
    const linesDown = Math.round(cursor.offsetTop / lineHeight);
    this.#line.style.transform = `translateY(${-Math.max(0, linesDown - 1) * lineHeight}px)`;
  }
}
