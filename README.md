# AIコーチング練習

AIと対話しながらコーチングスキルを磨くNext.jsアプリです。

## 機能

- **コーチング練習**: AIが演じるクライアントと実践的なコーチングセッション
- **セッション評価**: AIがコーチングの質を5つの観点で分析・フィードバック

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、APIキーを設定します。

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

APIキーは https://console.anthropic.com/ で取得できます。

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 を開いてください。

## Vercelへのデプロイ

1. [Vercel](https://vercel.com) にサインアップ
2. GitHubリポジトリを連携
3. 環境変数 `ANTHROPIC_API_KEY` を Vercel のダッシュボードで設定
4. デプロイ

または Vercel CLI:

```bash
npx vercel
```

## 技術スタック

- [Next.js 15](https://nextjs.org/) - App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Anthropic Claude API](https://www.anthropic.com/)
