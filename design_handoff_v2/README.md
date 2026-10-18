# AIコーチング v2 ・ レポート画面ハンドオフ

「**安心と成長が同時に感じられる練習空間**」というコンセプトに基づいた、AIコーチング練習アプリの **評価レポート画面** の引き渡しパッケージです。

> [!NOTE]
> このフォルダの中身は **HTML/React で書かれたデザインリファレンス（プロトタイプ）** です。本番コードとしてそのままコピーするものではありません。
>
> あなたのタスクは、**既存の Next.js + TypeScript + Tailwind CSS のコードベース内**で、このデザインを **既存のパターン・ライブラリを使って再現する** ことです。HTML を直接組み込まないでください。

---

## 0. このパッケージの中身

| ファイル | 用途 |
|---------|------|
| `README.md`（この文書） | 実装ガイド・デザイントークン・コンポーネント仕様 |
| `report-screen-top.png` | 画面上部のスクリーンショット |
| `report-screen-bottom.png` | 画面下部のスクリーンショット |
| `AIcoaching v2.html` | プロトタイプのエントリ HTML（参考実装） |
| `v2-shell.jsx` | 共通シェル（Header / Sidebar / Card / トークン） |
| `v2-report.jsx` | **レポート画面のソース**（メイン参考） |
| `v2-chat.jsx` | 練習画面のソース（参考） |
| `data.js` | サンプルデータ |

`.html` / `.jsx` は **デザイン値（色・余白・タイポ・SVG パス）を抜き出す参考資料** として読んでください。コードをそのまま組み込まず、Next.js コンポーネント + Tailwind ユーティリティで書き直してください。

---

## 1. レポート画面の目的

ユーザーが 1 セッション分の練習結果を見返し、**自分の強み・伸びしろ・次の一歩** を理解する画面。

主要な構成要素:
1. **総合スコア** ── 0 → 100 の点数 + 前回比 + 連続上昇回数
2. **360° パフォーマンス** ── 6 軸の AI 評価 vs 自己評価 比較（レーダー）
3. **詳細分析** ── 強み・余白 + 前回宿題の達成状況
4. **AI からのフィードバック** ── 良かった点 / 改善点 / 次の練習で意識すること（アコーディオン）
5. **成長トレンド** ── 過去 10 回のスコア推移 + 補助統計

---

## 2. Fidelity

**Hi-fi（ハイファイ）** ── 色・余白・タイポグラフィ・インタラクションすべて最終仕様。同梱の `report-screen-top.png` / `report-screen-bottom.png` と完全に同じピクセル・カラー・配置で再現してください。

---

## 3. 技術スタック前提

- Next.js 15 App Router
- TypeScript
- Tailwind CSS 3.4

ファイル提案:
```
app/v2/
  layout.tsx               # 共通シェル (header + sidebar)
  report/page.tsx          # 評価レポート画面
components/v2/
  Header.tsx               # 上部ヘッダー
  Sidebar.tsx              # 左サイドバー
  Card.tsx                 # 白カードの共通スタイル
  SectionTitle.tsx         # カード内見出し
  report/
    OverallScoreCard.tsx
    RadialGauge.tsx        # 円形スコアゲージ
    CountUp.tsx            # 数字のカウントアップ
    RadarChart.tsx         # 360° レーダー
    AxisBreakdown.tsx      # 6 軸の twin-bar + ギャップチップ
    DetailAnalysis.tsx     # 詳細分析カード
    FeedbackAccordion.tsx  # AI フィードバックアコーディオン
    GrowthChart.tsx        # 成長トレンド
```

---

## 4. デザイントークン

`tailwind.config.ts` の `extend` に追加してください。

### 4.1 カラーパレット

```ts
theme: {
  extend: {
    colors: {
      "v2-blue": {
        DEFAULT: "#4A90E2",   // メインカラー (AI 評価, 主要 CTA, 数字, 線)
        deep:    "#2D6CB8",   // gradient deep / hover
        lite:    "#E3F2FD",   // AI バブル背景・選択中ナビ背景・「💡 AI からのフィードバック」ピル背景
      },
      "v2-coral": {
        DEFAULT: "#FF6B6B",   // アクセント・CTA・自己評価線・低スコア
        lite:    "#FFE3E3",   // 改善エリア背景
      },
      "v2-green": {
        DEFAULT: "#6BCB77",   // 高スコア・成功
        lite:    "#E8F5E9",   // ユーザーバブル背景・強みエリア背景
        dark:    "#2D7A36",   // 強みエリアの文字色
      },
      "v2-orange": "#FFB347", // 中スコア (50-79)
      "v2-bg":      "#F8F9FA",
      "v2-surface": "#FFFFFF",
      "v2-ink": {
        DEFAULT: "#2D3436",   // 主テキスト
        2:       "#5B6066",   // 副テキスト
        3:       "#9AA0A6",   // メタ・キャプション
      },
      "v2-border":      "#E5E7EB",
      "v2-border-soft": "#EEF1F4",
    },
    fontFamily: {
      round: [
        "Zen Maru Gothic", "Hiragino Maru Gothic ProN",
        "M PLUS Rounded 1c", "sans-serif",
      ],
      sans: [
        "Noto Sans JP", "Hiragino Sans", "system-ui", "sans-serif",
      ],
    },
  },
},
```

### 4.2 タイポグラフィスケール（レポート画面で使う分）

| 用途 | フォント | サイズ | weight |
|------|---------|--------|--------|
| 画面タイトル / 大数字 (82) | round | 56px | 700 |
| カード見出し「360° パフォーマンス」 | round | 16px | 700 |
| カード小見出し「総合スコア」 | round | 13px | 700 |
| サブ説明文 | sans | 12px | 400 |
| 数字 (軸ラベル / 軸スコア "17/16") | sans | 10px | 400 |
| Body | sans | 13-14px | 400 |
| Caption / メタ | sans | 11px | 400 |
| Pill / Badge | round | 11px | 700 |

### 4.3 余白・角丸・影

- **カード余白** ── padding 22px / 24px
- **行間** ── line-height 1.75 (本文) / 1.85 (説明文)
- **カード間 gap** ── 18px
- **カード角丸** ── 16px (rounded-2xl)
- **内側ピル角丸** ── 999px (rounded-full)
- **内側ボタン角丸** ── 10-12px (rounded-lg / xl)
- **影** ──
  - card: `0 1px 2px rgba(45,52,54,0.04)`
  - CTA coral: `0 10px 22px -10px #FF6B6B`

---

## 5. 共通シェル

レポート画面は以下のシェルの中に置かれます（`app/v2/layout.tsx`）。

```
grid-template-columns: 240px 1fr
grid-template-rows:    64px 1fr
grid-template-areas:   "sidebar header" "sidebar main"
height: 100vh
background: #F8F9FA
```

### 5.1 Header

- 高さ 64px / padding 0 28px / 下に 1px border-v2-border / bg-v2-surface
- 左: ロゴ 38×38 rounded-xl bg-v2-blue「聴」+ 「AIコーチング練習」 / 「安心して、ことばを試せる場所。」
- 縦区切り 1×28 bg-v2-border
- 現在画面のタイトル: 「評価レポート」 / サブ「練習 #12 ・ 2026.05.22」
- 右: 連続日数チップ「♥ 連続 12 日」(bg-v2-coral-lite, text-v2-coral, rounded-full) + ユーザー (32×32 円 blue→deep gradient「K」+ 「安田 圭祐」「コーチ見習い ・ Lv.3」)

### 5.2 Sidebar (240px)

- bg-v2-surface, 右に 1px border-v2-border
- 「MENU」ラベル
- 4 つの nav (12px padding, rounded-xl) ── 「💬 練習する」「📜 会話履歴」「📊 レポート」「⚙ 設定」
  - **アクティブ = レポート** ── bg-v2-blue-lite + アイコン枠 bg-v2-blue 白 + 左 3px の青いバー
- 「今週の成長」カード (bg-v2-bg, rounded-2xl, 14px padding) ── 「+12%」(text-v2-green) + SVG スパークライン
- flex-1 スペーサー
- 一番下: CTA「新しい練習を始める」(bg-v2-coral, white, rounded-xl, shadow)

---

## 6. レポート画面のレイアウト

`gridArea: main` の中で:

```
padding: 24px 32px 32px
overflow: auto
```

縦に 3 行のセクション (gap 18px):

```
Row 1: grid-template-columns: 320px 1fr
       ← 総合スコアカード | 360° パフォーマンスカード

Row 2: grid-template-columns: 320px 1fr
       ← 詳細分析カード | ふりかえり（AI フィードバック）

Row 3: full width
       ← 成長トレンド
```

---

## 7. Row 1 - 左: 総合スコアカード（320×auto）

`<Card padding="22px 24px">`

#### Row a: ヘッダー行

- 「総合スコア」(round/700/13px) ←→ 「練習 #12」(sans, 11px, ink-3)

#### Row b: スコアゲージ (`<RadialGauge value={82} />`)

中央 168×168 (margin: 14px auto):

```tsx
// SVG 円形ゲージ
const stroke = 14, size = 168;
const r = (size - stroke) / 2;
const c = 2 * Math.PI * r;
const dash = c * (value / 100);

// 配色ルール
const color =
  value >= 80 ? "#6BCB77" :      // 高スコア → green
  value >= 50 ? "#FFB347" :      // 中スコア → orange
                "#FF6B6B";       // 低スコア → coral
```

- 背景円: stroke #F8F9FA (= v2-bg)
- 進捗円: linearGradient `#4A90E2 → ${color}` (左上から右下)
- `stroke-dasharray = ${dash} ${c - dash}`
- `stroke-linecap: round`
- `transform: rotate(-90 cx cy)` で 12 時開始

中央テキスト (absolute, place-items: center):
- 数字 `<CountUp to={value} ms={900} />` (round/700/56px, ink, line-height 1)
  - 0 から `value` まで `requestAnimationFrame` + ease-out-cubic で 900ms
- 下に「/ 100 点」(round/11px/600, ink-3)

#### Row c: 進捗ドット行

- 10 個の 9×9 円, gap 6px
- 達成数（= floor(value/10)）= bg-v2-blue, 残り = bg-v2-border

#### Row d: 前回比リボン

- bg-v2-green-lite, rounded-lg, padding 10px/14px
- 左: 「前回より +6 点」(sans/12px, text #2D7A36, 数字部分は round/14px/700)
- 右: 「↑ 連続 4 回上昇中」(sans/11px, #3A8542)

#### Row e: メタリスト

5 行 (flex column gap 10px, sans/12px):
| ラベル (ink-3) | 値 (ink, 500) |
|---|---|
| 練習日 | 2026.05.22 ・ 金 |
| シナリオ | チームマネジメント |
| クライアント | 田中 誠さん |
| 対話時間 | 22 分 18 秒 |
| 発話数 | 23 ／ 田中 12 ・ あなた 11 |

各行 padding-bottom 8px, 下に 1px dashed border-v2-border-soft

---

## 8. Row 1 - 右: 360° パフォーマンスカード（1fr）

`<Card padding="22px 24px">`

#### ヘッダー

タイトル「360° パフォーマンス」(round/700/16px)
サブ「自己評価と AI 評価を 6 軸で比較。ズレが大きいほど、メタ認知の伸びしろがあるサインです。」(sans, 12px, ink-3)
右端に **凡例**:
- ● 青 (#4A90E2) + 「AI 評価」(sans/12px/ink-2/500)
- ● コーラル (#FF6B6B 破線) + 「自己評価」

#### 本体: 左右 2 カラム (`grid-cols 1fr 1fr`, gap 28px, alignItems center)

##### 左半分: `<RadarChart size={360} />`

データ（6 軸、上から時計回り、max 20）:

```ts
const AXES = [
  { key: 'listen',   label: '傾聴',     short: 'Listen',  ai: 17, self: 16 },
  { key: 'empathy',  label: '共感',     short: 'Empathy', ai: 18, self: 19 },
  { key: 'question', label: '質問力',   short: 'Inquiry', ai: 14, self: 17 },
  { key: 'words',    label: '言語整理', short: 'Clarity', ai: 16, self: 15 },
  { key: 'assert',   label: '主張力',   short: 'Assert',  ai: 13, self: 14 },
  { key: 'presence', label: 'Presence', short: 'Presence',ai: 16, self: 18 },
];
```

SVG 構造:
- viewBox `0 0 360 360`, cx,cy = 180
- r = `size * 0.36` = 129.6
- 軸線: cx,cy → 端点 (stroke v2-border, 1px)
- 4 段グリッドポリゴン (0.25, 0.5, 0.75, 1)
- **AI ポリゴン** ── `fill="#4A90E2"` opacity 0.22, `stroke="#4A90E2"` width 2, linejoin round
- **Self ポリゴン** ── `fill="#FF6B6B"` opacity 0.15, `stroke="#FF6B6B"` width 1.8, **`stroke-dasharray="4 3"`**
- AI 各頂点: 半径 4 円, fill #4A90E2, stroke white 1.5
- Self 各頂点: 半径 3.5 円, fill #FF6B6B, stroke white 1.5
- 軸ラベル (外側 r × 1.18):
  - メイン: ラベル名 (round/700/13px/ink)
  - サブ: `${ai}/${self}` (sans/10px/ink-3)
  - text-anchor: `Math.abs(cos(angle)) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end'`

##### 右半分: AxisBreakdown

6 行 grid (`grid-cols [92px 1fr 60px]`, gap 12px, 各行 padding 6px/0, 下に 1px dashed border-soft):

```
┌────────────┬──────────────────────┬──────────┐
│ 傾聴 (kanji)│ ● ━━━━━━━━━━━━━━     │   -1     │
│ Listen      │ ● ━━━━━━━━━━━━       │ ギャップ │
└────────────┴──────────────────────┴──────────┘
```

- 左カラム (92px): 「傾聴」(round/700/13px/ink) + 「Listen」(sans/10px/ink-3)
- 中カラム: 2 段の細バー
  - 上段: 6×6 青ドット (#4A90E2) + バー (5px height, rounded-md, bg-v2-bg, 中に bg-v2-blue 100%×(ai/max))
  - 下段: 6×6 コーラルドット + バー (bg-v2-coral 100%×(self/max))
  - 上下バーの gap 3px
- 右カラム (60px, text-right): ギャップチップ
  - 値: `self - ai` を符号付きで表示 (round/700/12px)
  - 色: `|gap| >= 3 → coral`, `>= 2 → orange`, `else → green`
  - 下に「ギャップ」(sans/9px/ink-3/500)

---

## 9. Row 2 - 左: 詳細分析カード（320×auto）

`<Card padding="22px 24px">`

ヘッダー: 「詳細分析」(round/700/16px) + サブ「今回の練習からの所見」(sans/12px/ink-3)

### 9.1 強みカード (bg-v2-green-lite, rounded-lg, padding 14px/16px)

- ヘッダー: 「✔ 強み」(round/700/12px, color #2D7A36)
- 3 行 (sans/13px/ink, gap 6px, flex justify-between):
  - 「傾聴」 → 「高水準で安定」 (round/600/12px, #2D7A36)
  - 「共感」 → 「高水準で安定」
  - 「Presence」 → 「高水準で安定」

### 9.2 余白カード (bg-v2-coral-lite)

- 「⚠ 余白」(color #B3433F)
- 2 行:
  - 「質問力」 → 「+3 を狙いたい」
  - 「主張力」 → 「+5 を狙いたい」

### 9.3 前回の宿題（mt 16 / pt 16 / 上に 1px border-v2-border-soft で区切る）

ラベル「前回の宿題 ／ REVIEW」(round/700/12px/ink-3, letter-spacing 0.1em, uppercase, marginBottom 10px)

2 行 (各行 display flex, gap 10px, marginBottom 10px, alignItems flex-start):
- 20×20 円 + 項目テキストブロック
  - 達成: bg-v2-green, 白 ✓ (round/10px/700)
  - 未達: 白背景, 1.5px coral border, 内側に「−」
- 横:
  - 「沈黙を待つ姿勢」(sans/12.5px/ink/500) + 「前回より明らかに沈黙を許容できていました。」(sans/11px/ink-3)
  - 「問いの粒度を揃える」(未達) + 「後半でやや抽象的な問いに戻る場面がありました。」

データソース: `data.js` の `evaluation.review`

---

## 10. Row 2 - 右: ふりかえり（AI フィードバック・アコーディオン）

`<Card padding="22px 24px">`

ヘッダー:
- 左: 「ふりかえり」(round/700/16px) + サブ「今回のセッションを 3 つの観点で分解しました。クリックで展開できます。」
- 右: ピル「💡 AI からのフィードバック」(bg-v2-blue-lite, text-v2-blue, round/700/11px, padding 4px/10px, rounded-full)

### 3 つのグループ ── デフォルトで `next` だけ開いている

```ts
type Group = {
  id: 'good' | 'fix' | 'next';
  icon: string;          // emoji
  color: string;         // accent color
  bg: string;            // pale background
  dark: string;          // dark text color
  title: string;
  count: number;
  items: Array<{ title: string; detail: string }>;
};

const groups: Group[] = [
  {
    id: 'good',
    icon: '✅', color: '#6BCB77', bg: '#E8F5E9', dark: '#2D7A36',
    title: '良かった点', count: 3,
    items: [
      { title: 'クライアントの言葉を丁寧に繰り返し、承認を積み重ねていた',
        detail: '「気まずい空気のまま」の発言を 2 度繰り返し、感情をラベリングできていました。' },
      { title: '感情のラベリングが的確で、安心して話せる場をつくれていた',
        detail: '感情語（不安・焦り）を 4 回ミラーリングし、安心して話せる場をつくれていました。' },
      { title: 'オープン質問で具体的な場面を引き出せていた',
        detail: 'クライアントの言葉を遮らず、平均 1.2 秒の沈黙を許容できていました。' },
    ],
  },
  {
    id: 'fix',
    icon: '📈', color: '#FF6B6B', bg: '#FFE3E3', dark: '#B3433F',
    title: '改善できる点', count: 3,
    items: [
      { title: '「なぜ」より「何が」「どのように」で原因と行動を分けて聞く',
        detail: '「なぜ」を 3 回使用していました。「何が／どのように」へ置き換えると、原因→行動が分けやすくなります。' },
      { title: '中盤以降、視点を未来や第三者にずらす問いを増やす',
        detail: '14:18〜14:23 の沈黙のあと、視点を「3 ヶ月後の自分」にずらす問いを試してみてください。' },
      { title: 'セッション終盤のゴール再確認に時間を割く',
        detail: 'セッション終盤の 2 分間、ゴール再確認の時間を確保しましょう。' },
    ],
  },
  {
    id: 'next',
    icon: '🎯', color: '#4A90E2', bg: '#E3F2FD', dark: '#2D6CB8',
    title: '次の練習で意識すること', count: 3,
    items: [
      { title: 'オープンクエスチョンを 3 つ以上',
        detail: '「何が／どのように／いつ」で始める問いを意識的に。' },
      { title: '主張は「私は〜」で始める',
        detail: '「あなたは〜」を避け、I メッセージで言い直してみる。' },
      { title: '3 分ごとに要約を入れる',
        detail: '「ここまでで聞いた話は…」と中継ぎを置く。' },
    ],
  },
];
```

### 各グループのカード

- margin-bottom 10px, rounded-2xl (14px), `background: group.bg`
- 開いている → `border: 1px solid group.color`
- 閉じている → `border: 1px solid transparent` (レイアウトを揃えるため)
- transition: all 0.15s

#### ヘッダーボタン (button full-width)

- padding 14px/18px, gap 12px, cursor pointer, textAlign left, transparent background
- 30×30 アイコンタイル (bg white, color group.dark, rounded-lg, fontSize 16, place-items center)
- タイトル「良かった点」(round/700/14px/group.dark) + 「{count} 件」(group.color, 12px, marginLeft 8px)
- 右端 ⌄ アイコン (group.dark, round/700/14px, `transform: rotate(180deg)` when open, transition 0.2s)

#### 展開時の中身 (padding 0 18px 16px)

- 各アイテム: display flex, gap 12px, padding 10px/0
- 上に 1px dashed border-v2-border
- 22×22 番号円 (bg white, color group.dark, round/11px/700, display grid place-items center, flex-shrink 0): `{i + 1}`
- 横:
  - タイトル (round/600/13.5px/ink, marginBottom 4px)
  - 詳細 (sans/12px/ink-2/line-height 1.75)

### アコーディオン下のアクション行

- mt 16 / pt 14 / 上に 1px border-v2-border-soft
- display flex, alignItems center, gap 10px

- 左: 「← 前の練習」(bg transparent, text-v2-ink-2, 1px border-v2-border, rounded-lg, padding 10px/16px, round/600/13px)
- flex-1 (spacer)
- 右: 「次の練習を始める ▶」(bg-v2-coral, white, rounded-lg, padding 12px/22px, round/700/13px, shadow `0 10px 22px -10px #FF6B6B`)

---

## 11. Row 3: 成長トレンド（全幅）

`<Card padding="22px 24px">`

ヘッダー:
- 左: 「成長トレンド」(round/700/16px) + サブ「過去 10 回のセッションスコア。続けるほど、傾向は確かに登っていきます。」
- 右: **期間切り替えピル群** (display flex, gap 6px)
  - 「10 回」(アクティブ: bg-v2-ink, white, round/600/12px, rounded-lg, padding 6px/12px)
  - 「30 回」「全期間」 (非アクティブ: transparent, ink-2, 1px border-v2-border)

### 本体: `grid-cols 1fr 280px`, gap 32px, alignItems center

#### 左: `<GrowthChart width={680} height={200} />`

データ: `[42, 51, 49, 58, 62, 64, 71, 75, 76, 82]` (過去 10 回)

SVG:
- viewBox `0 0 680 200`, width 100% maxWidth 680
- padding: padL 28, padR 24, padT 18, padB 26
- innerW = 680 - 28 - 24 = 628
- innerH = 200 - 18 - 26 = 156
- y スケール: 0 → 100
- 5 本のグリッド線 (0, 25, 50, 75, 100), stroke v2-border-soft, 左端に sans/10px ラベル (text-anchor end, fill ink-3)
- x 軸: 各点の下 (sans/10px) 「1」「2」…「10」 (anchor middle, fill ink-3)
- area: polygon (下端 y(0) で閉じる) fill `url(#growth-fill)`
  ```svg
  <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#4A90E2" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#4A90E2" stop-opacity="0"/>
  </linearGradient>
  ```
- line: polyline stroke #4A90E2 width 2.5 strokeLinejoin round strokeLinecap round
- 各点: 通常 r=3.5 (fill white, stroke #4A90E2 2px); **最終 r=6 (fill #FF6B6B, stroke white 3px)**
- 最終点の上に **52×22 ラベルピル** (`<rect>`+`<text>`):
  - x = lastX − 26, y = lastY − 32, width 52, height 22, rx 6
  - fill #2D3436 (v2-ink)
  - 中の text: 「82 点」(round/700/12px, fill white, text-anchor middle)
- 右上に「↑ 前回比 +6」(round/700/10px, text-v2-green, text-anchor end)
  - 位置: `translate(width - padR - 12, padT + 2)`

#### 右: 統計サイドバー (280px)

4 行 (display flex justify-between alignItems baseline, padding 12px/0, 下に 1px dashed border-v2-border-soft):

| ラベル (sans/11px/ink-3) | 値 (round/18px/700/ink) | 補足 (sans/11px/ink-3) |
|---|---|---|
| 平均スコア | 63 点 | 初回比 +40 |
| 上昇傾向 | 4 回連続 | 止まらず登る |
| 練習頻度 | 週 2.3 回 | 理想ペース |
| 到達まで | あと 18 点 | 目標 100 点 |

---

## 12. State / インタラクション

### アコーディオン

```ts
const [expanded, setExpanded] = useState<'good' | 'fix' | 'next' | null>('next');

function toggle(id: GroupId) {
  setExpanded(prev => prev === id ? null : id);
}
```

クリックで同じ ID なら閉じる、別 ID なら入れ替え（同時に複数開かない仕様）。

### CountUp

```ts
function useCountUp(to: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return n;
}
```

レポートの **総合スコア** と、もし他に数字を見せる箇所があれば適用。

### Tooltip (オプション)

レーダーの軸頂点ホバー時、軸名 + AI スコア + 自己スコアを出すツールチップを後で追加できます（現在の HTML プロトには含まれていません）。

---

## 13. アクセシビリティ

- アコーディオンヘッダーボタン:
  - `aria-expanded={open}`
  - `aria-controls="panel-{id}"`
  - 展開時のコンテナに `id="panel-{id}"` と `role="region"`
- アコーディオンの ⌄ アイコンは装飾 → `aria-hidden="true"`
- レーダーチャート SVG に `role="img"` + `aria-label="6 軸の AI 評価と自己評価の比較"`
- 期間ピル群は `role="group"` + 各ボタンに `aria-pressed`
- 「次の練習を始める」CTA は `<Link>` (Next.js) で `/v2/practice` へ
- フォーカスリング: `focus-visible:ring-2 focus-visible:ring-v2-blue/40`
- 色だけに依存しない表現: ギャップチップは数字 + ラベル両方持つ ✓

---

## 14. 既存コードベースとの整合

- 既存 `types/index.ts` の `EvaluationResult` / `EvaluationScore` / `ImprovementReview` は **6 軸表示には拡張が必要**。
  - 現在は 5 軸 (`scores: EvaluationScore[]`) — 「Presence」を加えて 6 軸に拡張するか、Presence は別フィールドにするか、要相談。
- 既存 API `app/api/evaluate/route.ts` の評価出力フォーマットも同様。本ハンドオフでは UI 側のみ示しています。バックエンドの拡張は別タスク。
- ルート提案: `/v2/report` ＝ 新画面、`/evaluation` ＝ 既存（共存して比較できるよう）。

---

## 15. 実装チェックリスト

### Phase 1: シェル
- [ ] `tailwind.config.ts` に v2 トークン追加
- [ ] `next/font/google` で Zen Maru Gothic + Noto Sans JP 読み込み
- [ ] `app/v2/layout.tsx` で Header + Sidebar の grid
- [ ] サイドバーのスパークライン SVG

### Phase 2: レポート画面
- [ ] `app/v2/report/page.tsx`
- [ ] `<CountUp>` フック + `<RadialGauge>` SVG
- [ ] `<RadarChart>` (6 軸 / 2 ポリゴン / dots / labels)
- [ ] `<AxisBreakdown>` (twin bars + ギャップチップ)
- [ ] `<DetailAnalysis>` (強み / 余白 / 前回宿題)
- [ ] `<FeedbackAccordion>` (3 グループ / 同時に 1 つだけ開く)
- [ ] `<GrowthChart>` (10 点 line + area + 最終点ピル + 凡例)
- [ ] アクション行 (← 前の練習 / 次の練習を始める ▶)

### Phase 3: 統合
- [ ] 既存 API `/api/evaluate` の戻り値と整合 (要・型拡張)
- [ ] 既存型 `types/index.ts` を 6 軸対応に拡張
- [ ] アクセシビリティ (aria, キーボード, focus ring)
- [ ] レポート画面の URL を `/v2/report` で公開

---

## 16. 参考ファイル

このフォルダ内の `v2-report.jsx` がレポート画面の **完全な実装** です。Tailwind ではなくインライン style を使っていますが、**色・寸法・SVG パス・state ロジック** は全てここから抜き出せます。

`v2-shell.jsx` は **デザイントークンの定義元**（`window.V2` オブジェクト）と Header / Sidebar / Card の実装を含みます。

`data.js` は本物のセッションを模した **サンプルデータ** が `window.AIC_DATA` に入っています（scenarios / sessionMessages / evaluation）。
