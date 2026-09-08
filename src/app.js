import { KeyboardInput } from "./keyboard-input.js";
import { SessionView } from "./session-view.js";
import { TypingTrainer } from "./typing-trainer.js";

// Wires the ear, the screen and the referee together and starts listening.
export function startApp(root, target, options = {}) {
  const view = new SessionView(root.getElementById("text"), root.getElementById("stats"));
  const trainer = new TypingTrainer(view, target, options);

  const input = new KeyboardInput(root, {
    onPress: (char, at) => trainer.press(char, at),
    onBackspace: (at) => trainer.backspace(at),
    now: options.now,
  });

  input.start();
  // Returned so a test can drive the app without faking a browser window.
  return { view, trainer, input };
}
