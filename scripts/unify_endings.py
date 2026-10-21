# -*- coding: utf-8 -*-
"""主訴グループの語尾を、すべて「と解される」にそろえる（正解だけ語尾が違う、という手がかりをなくす）"""
import io, os, sys

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
import choices_pro_complaint as C

TAIL = "と解される"
n = 0
for qid, items in C.NEW.items():
    out = []
    for i, x in enumerate(items):
        if x.endswith(TAIL):
            out.append(x)
            continue
        if i == 0 and x.endswith("いる"):
            x = x + TAIL
        elif x.endswith("優先課題とする"):
            x = x[: -len("優先課題とする")] + "優先課題とすべきである" + TAIL
        elif x.endswith("優先課題である"):
            x = x + TAIL.replace("と", "と", 1) if False else x[: -len("である")] + "であると解される"
        elif x.endswith("優先課題となる"):
            x = x[: -len("となる")] + "であると解される"
        elif x.endswith("優先される"):
            x = x + TAIL
        elif x.endswith("主訴の対応となる"):
            x = x[: -len("主訴の対応となる")] + "必要であると解される"
        else:
            print("要確認:", qid, i, x)
        out.append(x)
    if out != items:
        C.NEW[qid] = out
        n += 1

path = os.path.join(here, "choices_pro_complaint.py")
body = "# -*- coding: utf-8 -*-\n# 選択肢の書き直し（[正解, 誤答1, 誤答2, 誤答3] の順）。語尾は「と解される」にそろえたもの\nNEW = {\n"
for k, v in C.NEW.items():
    body += ' "%s": [\n' % k + "".join('   "%s",\n' % x for x in v) + " ],\n"
body += "}\n"
io.open(path, "w", encoding="utf-8").write(body)
print("更新した問題:", n)
