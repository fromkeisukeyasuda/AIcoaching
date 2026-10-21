/* クイズの問題データの検証。使い方: node scripts/validate-quiz.js
   確認すること: 問題数、選択肢が4つ、正解の番号、長さの偏り（正解が最長でないか）、場面の長さ、重複、正解位置の偏り */
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const src = path.join(__dirname, "..", "lib", "quiz");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-"));
for (const f of fs.readdirSync(src).filter((n) => n.endsWith(".ts"))) {
  const code = fs.readFileSync(path.join(src, f), "utf8");
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(path.join(out, f.replace(/\.ts$/, ".js")), js);
}
const { QUIZ_GROUPS } = require(path.join(out, "index.js"));

let problems = 0;
const warn = (msg) => { problems++; console.log("  ✗ " + msg); };

for (const g of QUIZ_GROUPS) {
  console.log(`\n■ ${g.title}: ${g.questions.length}問`);
  const ids = new Set();
  const scenes = new Set();
  const answerPos = [0, 0, 0, 0];
  const rankCount = [0, 0, 0, 0];
  let longestCorrect = 0;

  for (const q of g.questions) {
    if (ids.has(q.id)) warn(`${q.id}: ID が重複`);
    ids.add(q.id);
    if (scenes.has(q.scene)) warn(`${q.id}: 場面が重複`);
    scenes.add(q.scene);
    if (q.choices.length !== 4) warn(`${q.id}: 選択肢が ${q.choices.length} 個`);
    if (!(q.answer >= 0 && q.answer < q.choices.length)) warn(`${q.id}: 正解の番号が範囲外`);
    if (new Set(q.choices).size !== q.choices.length) warn(`${q.id}: 選択肢が重複`);
    if (q.steps.length !== 3) warn(`${q.id}: 考え方の手順が ${q.steps.length} 個`);
    if (!q.whyNot || q.terms.length === 0) warn(`${q.id}: 解説・用語が不足`);

    const lens = q.choices.map((c) => [...c].length);
    const max = Math.max(...lens), min = Math.min(...lens);
    const correct = lens[q.answer];
    const rank = [...lens].sort((a, b) => b - a).indexOf(correct);
    answerPos[q.answer]++;
    rankCount[rank]++;
    if (correct === max && lens.filter((l) => l === max).length === 1) { longestCorrect++; warn(`${q.id}: 正解だけが最長（${lens.join("/")}）`); }
    if (max - min > 8) warn(`${q.id}: 長さの差が大きい（${lens.join("/")}）`);
    if (max > 52) warn(`${q.id}: 選択肢が長い（${max}字）`);
    const sl = [...q.scene].length;
    if (sl > 115) warn(`${q.id}: 場面が長い（${sl}字）`);
    if (sl < 60) warn(`${q.id}: 場面が短い（${sl}字）`);
  }
  console.log(`  正解の位置（表示前の配置） A/B/C/D: ${answerPos.join("/")}`);
  console.log(`  正解の長さの順位（1=最長〜4=最短）: ${rankCount.join("/")}（正解だけが最長: ${longestCorrect}問）`);
}

console.log(problems ? `\n要確認: ${problems}件` : "\n問題なし");
process.exit(problems ? 1 : 0);
