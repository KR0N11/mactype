import { KeyboardInput } from "./keyboard-input.js";
import { SessionView } from "./session-view.js";
import { HudView } from "./hud-view.js";
import { ResultsView } from "./results-view.js";
import { MenuView } from "./menu-view.js";
import { HistoryView } from "./history-view.js";
import { AppController } from "./app-controller.js";
import { RunHistory } from "./history.js";
import { RunClock } from "./run-clock.js";

const DEFAULT_CONFIG = { lessonId: "common", mode: "time", seconds: 30, wordCount: 25 };

// Builds every part of the app, wires them together and starts the first run.
export function startApp(root, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options.config };
  const history = new RunHistory(options.storage ?? root.defaultView.localStorage);

  let controller;
  const clock = new RunClock({
    onTick: (remainingMs) => controller.tick(remainingMs),
    onExpire: () => controller.expire(),
    ...options.clock,
  });

  const views = {
    session: new SessionView(root.getElementById("text")),
    hud: new HudView(root.getElementById("hud")),
    results: new ResultsView(root.getElementById("results"), { onAgain: () => controller.start() }),
    menu: new MenuView(root.getElementById("menu"), { onChange: (change) => controller.change(change) }),
    history: new HistoryView(root.getElementById("history")),
  };

  controller = new AppController({ views, history, clock, random: options.random, config });

  const input = new KeyboardInput(root, {
    onPress: (char, at) => controller.press(char, at),
    onBackspace: (at) => controller.backspace(at),
    onRestart: () => controller.start(),
    now: options.now,
  });

  controller.start();
  input.start();
  // Returned so a test can drive the app without faking a browser window.
  return { controller, views, input, clock, history };
}
