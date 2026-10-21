# -*- coding: utf-8 -*-
"""選択肢の書き直し（scripts/choices_pro_*.py）を、lib/quiz/*.ts に反映する。
   使い方: python scripts/apply_choices_pro.py"""
import io, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from choices_pro_complaint import NEW as C
from choices_pro_assessment import NEW as A

root = os.path.join(here, "..", "lib", "quiz")
NEW = {}
NEW.update(C)
NEW.update(A)

def fmt(items):
    return "".join('      "%s",\n' % x for x in items) + "    "

files = [f for f in os.listdir(root) if f.endswith(".ts")]
done = set()
for f in files:
    p = os.path.join(root, f)
    s = io.open(p, encoding="utf-8").read()

    # mk() 形式
    def repl_mk(m):
        qid = m.group(2)
        if qid not in NEW:
            return m.group(0)
        done.add(qid)
        return m.group(1) + "\n" + fmt(NEW[qid])[:-4] + m.group(4)
    s = re.sub(r'(mk\(\s*"((?:complaint|assessment)-\d+)",\s*"[^"]*",\s*\[)((?:\s*"[^"]*",){3}\s*"[^"]*",?\s*)(\])', repl_mk, s, flags=re.S)

    # 最初の6問（オブジェクト形式）。正解の位置は、いまの answer の番号のまま
    def repl_obj(m):
        qid = m.group(2)
        if qid not in NEW:
            return m.group(0)
        done.add(qid)
        ans = int(m.group(5))
        new = NEW[qid]
        arranged = new[1:]
        arranged.insert(ans, new[0])
        return m.group(1) + "\n" + "".join('        "%s",\n' % x for x in arranged) + "      " + m.group(4)
    s = re.sub(r'(id: "((?:complaint|assessment)-\d+)",\s*scene:\s*"[^"]*",\s*choices: \[)((?:\s*"[^"]*",){3}\s*"[^"]*",?\s*)(\],\s*answer: (\d))', repl_obj, s, flags=re.S)
    io.open(p, "w", encoding="utf-8").write(s)

missing = sorted(set(NEW) - done)
print("反映:", len(done), "件 / 未反映:", missing)
