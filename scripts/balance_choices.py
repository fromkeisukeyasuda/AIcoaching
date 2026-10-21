# -*- coding: utf-8 -*-
"""選択肢の長さをそろえる（正解だけが長い、という手がかりをなくす）。
   scripts/choices_pro_*.py の誤答を、自然な言い回しで少し伸ばして、書き戻す。
   使い方: python scripts/balance_choices.py → python scripts/apply_choices_pro.py"""
import io, os, sys, pprint

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
import choices_pro_complaint as C
import choices_pro_assessment as A

# 伸ばす言い回し（誤答だけに使う。意味は変えない）
RULES = [
    ("が優先課題であると解される", "が最優先の課題であると解される"),
    ("が主訴の中心であると解される", "が主訴の中心的な課題であると解される"),
    ("が主訴であり、", "が主訴の中心であり、"),
    ("が必要であると解される", "が必要な状態であると解される"),
    ("が根底にあり、", "が根底に存在しており、"),
    ("べきと考えられる", "べきであると考えられる"),
    ("必要と考えられる", "必要であると考えられる"),
    ("最善と考えられる", "最善であると考えられる"),
    ("先決と考えられる", "先決であると考えられる"),
    ("困難と考えられる", "困難であると考えられる"),
    ("適切と考えられる", "適切であると考えられる"),
    ("欠点と考えられる", "欠点であると考えられる"),
    ("不可避と考えられる", "不可避であると考えられる"),
    ("ないと考えられる", "ないものと考えられる"),
    ("解決すると考えられる", "解決するものと考えられる"),
    ("事実であり、", "客観的な事実であり、"),
    ("が明らかであり、", "が明らかな状態であり、"),
    ("が原因であり、", "が根本の原因であり、"),
]

def widen(text, target):
    cur = text
    for _ in range(3):
        if len(cur) >= target:
            break
        for a, b in RULES:
            if a in cur:
                nxt = cur.replace(a, b, 1)
                if len(nxt) <= target + 3:
                    cur = nxt
                    break
        else:
            break
    return cur

def balance(d):
    changed = 0
    for qid, items in d.items():
        correct = items[0]
        c = len(correct)
        lens = [len(x) for x in items]
        others = lens[1:]
        # 正解が、最長、または、誤答より2字以上長いときだけ、誤答を伸ばす
        if c > max(others) - 1 or c - min(others) >= 3:
            target = c  # 誤答を、正解と同じ長さ以上にそろえる
            new = [correct]
            for x in items[1:]:
                new.append(widen(x, target) if len(x) < target else x)
            if new != items:
                d[qid] = new
                changed += 1
    return changed

def write(mod, name):
    path = os.path.join(here, name)
    body = "# -*- coding: utf-8 -*-\n# 選択肢の書き直し（[正解, 誤答1, 誤答2, 誤答3] の順）。scripts/balance_choices.py で、長さをそろえたもの\nNEW = {\n"
    for k, v in mod.NEW.items():
        body += ' "%s": [\n' % k + "".join('   "%s",\n' % x for x in v) + " ],\n"
    body += "}\n"
    io.open(path, "w", encoding="utf-8").write(body)

n1 = balance(C.NEW)
n2 = balance(A.NEW)
write(C, "choices_pro_complaint.py")
write(A, "choices_pro_assessment.py")
print("調整した問題:", n1 + n2)
