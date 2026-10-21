/* 問題の確認用。使い方: node scripts/show-quiz.js complaint-7 assessment-12 ... */
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const src = path.join(__dirname, "..", "lib", "quiz");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-"));
for (const f of fs.readdirSync(src).filter((n) => n.endsWith(".ts"))) {
  const js = ts.transpileModule(fs.readFileSync(path.join(src, f), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(path.join(out, f.replace(/\.ts$/, ".js")), js);
}
const { QUIZ_GROUPS } = require(path.join(out, "index.js"));
const all = QUIZ_GROUPS.flatMap((g) => g.questions);
for (const id of process.argv.slice(2)) {
  const q = all.find((x) => x.id === id);
  if (!q) { console.log(id, "なし"); continue; }
  console.log(`\n[${q.id}] ${q.scene}`);
  q.choices.forEach((c, i) => console.log(`  ${"ABCD"[i]}${i === q.answer ? "◎" : " "} ${c}`));
}
