// A lesson either drills a set of keys, or draws from a pool of real words.
const DRILL = "drill";
const WORDS = "words";

// The 200 most common English words, which is what real typing speed is measured on.
const COMMON = ("the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us").split(" ");

const CODE = ("const let return function if else for while class new this null true false import export from await async try catch throw type interface public private static void int string bool").split(" ");

export const LESSONS = [
  { id: "home", name: "Home row", hint: "asdf jkl; — where your fingers live", kind: DRILL, keys: "asdfjkl;", min: 3, max: 5 },
  { id: "home-words", name: "Home row words", hint: "real words, home row only", kind: WORDS, pool: "add all ask fall flask gall glad half hall lad lads lash slash sad salad falls skald jak dial kids salsa flak".split(" ") },
  { id: "top", name: "Top row", hint: "qwerty uiop", kind: DRILL, keys: "qwertyuiop", min: 3, max: 6 },
  { id: "bottom", name: "Bottom row", hint: "zxcv bnm", kind: DRILL, keys: "zxcvbnm", min: 3, max: 5 },
  { id: "letters", name: "All letters", hint: "every letter, no punctuation", kind: DRILL, keys: "abcdefghijklmnopqrstuvwxyz", min: 3, max: 7 },
  { id: "common", name: "Common words", hint: "the 200 words you type most", kind: WORDS, pool: COMMON },
  { id: "capitals", name: "Capitals", hint: "shift with the opposite hand", kind: WORDS, pool: COMMON.map((word) => word[0].toUpperCase() + word.slice(1)) },
  { id: "punctuation", name: "Punctuation", hint: "commas, stops, quotes", kind: WORDS, pool: COMMON.flatMap((word) => [`${word},`, `${word}.`, `'${word}'`, `${word}?`, `"${word}"`, `${word};`]) },
  { id: "numbers", name: "Number row", hint: "1234567890, no numpad on a Mac", kind: DRILL, keys: "1234567890", min: 2, max: 5 },
  { id: "symbols", name: "Symbols", hint: "the shifted number row", kind: DRILL, keys: "!@#$%^&*()-_=+", min: 2, max: 4 },
  { id: "code", name: "Code", hint: "keywords and brackets", kind: WORDS, pool: CODE.flatMap((word) => [word, `${word}()`, `${word};`, `{${word}}`, `[${word}]`]) },
];

// Finds one lesson by its id, or explains which ids exist.
export function findLesson(id) {
  const lesson = LESSONS.find((candidate) => candidate.id === id);

  // A typo in a lesson id would otherwise show an empty page with no clue why.
  if (lesson === undefined) {
    throw new Error(`no lesson called "${id}"`);
  }

  return lesson;
}

// Builds the text to type: a number of words, joined by single spaces.
export function buildText(id, wordCount, random = Math.random) {
  const lesson = findLesson(id);
  const words = [];

  for (let i = 0; i < wordCount; i += 1) {
    words.push(lesson.kind === DRILL ? drillWord(lesson, random) : pick(lesson.pool, random));
  }

  return words.join(" ");
}

// Makes one nonsense word from a lesson's key set, so the fingers drill the keys.
function drillWord(lesson, random) {
  const length = lesson.min + Math.floor(random() * (lesson.max - lesson.min + 1));
  let word = "";

  for (let i = 0; i < length; i += 1) {
    word += pick([...lesson.keys], random);
  }

  return word;
}

// Picks one item at random from a list.
function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}
