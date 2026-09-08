const KEY = "mactype.runs";

// Remembers finished runs in the browser, so progress survives a reload.
export class RunHistory {
  #storage;
  #limit;

  constructor(storage, limit = 100) {
    this.#storage = storage;
    this.#limit = limit;
  }

  // Saves one finished run and returns the full list, newest first.
  record(run) {
    const runs = [run, ...this.all()].slice(0, this.#limit);
    this.#storage.setItem(KEY, JSON.stringify(runs));
    return runs;
  }

  // Every saved run, newest first.
  all() {
    const raw = this.#storage.getItem(KEY);

    // Nothing saved yet is the normal state on a first visit, not a failure.
    if (raw === null) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      // A hand edited or half written entry would crash every screen that reads it,
      // so anything that is not a list of runs is thrown away rather than trusted.
      return Array.isArray(parsed) ? parsed.filter(isRun) : [];
    } catch {
      return [];
    }
  }

  // The fastest run ever recorded for one lesson, or null if there is none yet.
  best(lessonId) {
    const forLesson = this.all().filter((run) => run.lessonId === lessonId);

    if (forLesson.length === 0) {
      return null;
    }

    return forLesson.reduce((fastest, run) => (run.netWpm > fastest.netWpm ? run : fastest));
  }

  // The keys you get wrong most often, counted across every saved run.
  worstKeys(count = 5) {
    const totals = new Map();

    for (const run of this.all()) {
      for (const [key, misses] of run.errors) {
        totals.set(key, (totals.get(key) ?? 0) + misses);
      }
    }

    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, count);
  }

  // How many days in a row you have practised, counting back from your last run.
  streak() {
    const days = [...new Set(this.all().map((run) => dayNumber(run.at)))].sort((a, b) => b - a);

    if (days.length === 0) {
      return 0;
    }

    let length = 1;

    // Walk back through the days you practised, stopping at the first gap.
    for (let i = 1; i < days.length; i += 1) {
      if (days[i] !== days[i - 1] - 1) {
        break;
      }

      length += 1;
    }

    return length;
  }

  // Throws away every saved run.
  clear() {
    this.#storage.removeItem(KEY);
  }
}

// Which day a moment falls on, in the user's own timezone.
function dayNumber(at) {
  const date = new Date(at);
  return Math.floor((date - date.getTimezoneOffset() * 60000) / 86400000);
}

// A saved run is only usable if the numbers we read back are really numbers.
function isRun(run) {
  return (
    run !== null &&
    typeof run === "object" &&
    typeof run.at === "number" &&
    typeof run.netWpm === "number" &&
    Array.isArray(run.errors)
  );
}
