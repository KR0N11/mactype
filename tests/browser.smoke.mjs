// A real browser check, run by `npm run smoke`. It exists because the jsdom
// tests all inject fake timers, so a browser-only failure like calling
// setInterval with the wrong "this" passed every unit test and still broke
// typing on the live site.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript" };
const root = new URL("..", import.meta.url).pathname;
const failures = [];

// Serves the project folder, because ES modules will not load over file://
const server = createServer(async (request, response) => {
  const path = normalize(request.url.split("?")[0] === "/" ? "/index.html" : request.url.split("?")[0]);

  try {
    const body = await readFile(join(root, path));
    response.writeHead(200, { "content-type": TYPES[extname(path)] ?? "text/plain" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});

await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") {
    errors.push(message.text());
  }
});

// Checks one thing and records the failure rather than stopping at the first.
function check(name, condition, detail = "") {
  if (!condition) {
    failures.push(`${name} ${detail}`.trim());
  }

  console.log(`${condition ? "ok  " : "FAIL"}  ${name}`);
}

// Reads the text the page is currently asking for.
const target = () => page.evaluate(() => [...document.querySelectorAll("#text .line span")].map((span) => span.textContent).join(""));

// Types the first n characters of whatever is on screen.
async function type(count) {
  for (const char of (await target()).slice(0, count)) {
    await page.keyboard.press(char === " " ? "Space" : char);
  }
}

await page.goto(base, { waitUntil: "networkidle" });
check("page renders text to type", (await target()).length > 0);

await type(5);
const classes = await page.evaluate(() => [...document.querySelectorAll("#text .line span")].slice(0, 5).map((span) => span.className));
check("typing marks characters as typed", classes.every((name) => name.includes("correct")), classes.join(","));
// The display rounds seconds up, so five fast keys still read 30s. Waiting past
// a whole second is the only way to prove the countdown is really running.
await page.waitForTimeout(1200);
check("the countdown runs once you start typing", (await page.textContent("#hud")) !== "30s", await page.textContent("#hud"));

await page.keyboard.press("Tab");
check("Tab restarts the run", (await page.evaluate(() => document.querySelectorAll("#text .correct").length)) === 0);

// A short fixed length run, so the results panel can be checked without waiting 30s.
await page.click("#menu .modes button:last-child");
await page.click("#menu .amounts button:first-child");
await type((await target()).length);
check("finishing shows a score", await page.isVisible("#results .figures"));
check("the run is saved", (await page.evaluate(() => JSON.parse(localStorage.getItem("mactype.runs") ?? "[]").length)) === 1);

await page.reload({ waitUntil: "networkidle" });
check("saved runs survive a reload", (await page.textContent("#history")).includes("day streak"));

check("no errors in the browser console", errors.length === 0, errors.join(" | "));

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}

console.log("\nsmoke passed");
