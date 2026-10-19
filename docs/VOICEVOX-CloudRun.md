# VOICEVOX を Cloud Run に置く手順

スマホ・PWA でも音声を使うため、VOICEVOX エンジンを Google Cloud Run に置きます。
費用の上限は「最大インスタンス数 1」と「予算アラート」で抑えます。

> gcloud はこの PC に未インストールです。以下はご自身のターミナル（Cloud Shell でも可）で実行してください。
> 課金アカウントの紐付けと、キーの扱いは、必ずご自身で行ってください。

## 0. 前提

- Google Cloud のプロジェクトを作り、課金アカウントを紐付ける（Google AI Pro の月 約$10 クレジットは、紐付け後に適用されます）
- Cloud Shell（https://shell.cloud.google.com）なら gcloud が最初から使えます

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbilling.googleapis.com
```

## 1. デプロイ（最大インスタンス 1・使わない間は 0）

```bash
gcloud run deploy voicevox \
  --image=voicevox/voicevox_engine:cpu-latest \
  --region=asia-northeast1 \
  --port=50021 \
  --cpu=2 --memory=4Gi \
  --min-instances=0 \
  --max-instances=1 \
  --concurrency=4 \
  --timeout=60 \
  --no-allow-unauthenticated
```

- `--max-instances=1` : 同時に起動するのは 1 台まで（費用の暴走を防ぐ）
- `--min-instances=0` : 使わない間は課金されない（起動は 10〜30 秒かかる。アプリ側のウォームアップで吸収）
- `--no-allow-unauthenticated` : 認証必須。URL を知られても使われない
- Docker Hub のイメージが取得できない場合は、Artifact Registry の remote repository 経由にしてください

デプロイ後に表示される Service URL を控えます（`https://voicevox-xxxxx-an.a.run.app`）。

## 2. アプリ用のサービスアカウント（呼び出し専用）

```bash
gcloud iam service-accounts create voicevox-caller --display-name="RoleMate VOICEVOX caller"

gcloud run services add-iam-policy-binding voicevox \
  --region=asia-northeast1 \
  --member="serviceAccount:voicevox-caller@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

gcloud iam service-accounts keys create voicevox-caller.json \
  --iam-account=voicevox-caller@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

`voicevox-caller.json` は秘密鍵です。Git に入れない・チャットに貼らないでください。
Vercel に登録したら、手元のファイルは削除します。

## 3. 予算アラート

コンソール「お支払い > 予算とアラート」から作るのが簡単です。コマンドの場合:

```bash
gcloud billing accounts list   # BILLING_ACCOUNT_ID を確認

gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="RoleMate monthly cap" \
  --budget-amount=1500JPY \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0
```

- 金額は請求通貨に合わせて調整してください（例: 1,500 円 ≒ $10）
- 予算アラートは「通知」だけで、自動停止はしません。メール通知を必ず確認できる宛先にしてください
- 本当に止めたい場合は、予算から Pub/Sub 経由でサービスを止める仕組みを足せます（必要なら相談してください）

## 4. Vercel の環境変数

Vercel の Project > Settings > Environment Variables（Production）に登録し、再デプロイします。

| 名前 | 値 |
| --- | --- |
| `VOICEVOX_URL` | 手順1の Service URL |
| `VOICEVOX_SA_JSON` | `voicevox-caller.json` の中身（JSON、または base64） |
| `ANTHROPIC_API_KEY` | Anthropic のキー |
| `GEMINI_API_KEY` | Gemini を使うときだけ |
| `AI_CHAT_MODEL` | 例: `anthropic` / `gemini:gemini-2.5-flash` |
| `AI_EVAL_MODEL` | 例: `anthropic` / `gemini:gemini-2.5-pro` |

AI は会話用と評価用で別々に切り替えられます。未設定なら従来どおり Claude Sonnet 5.5 です。

## 5. 最初の 1 文が遅い件（コールドスタート）

- アプリを開くと `/api/tts/warmup` が自動で呼ばれ、エンジンを起こします（8 分に 1 回まで）
- 起動中の読み上げは最大 50 秒まで待ちます。それでも間に合わない場合は、文字だけ表示されます

## 6. クレジット表記

- 画面（相談・練習のキャラ名の下）とマイページに `VOICEVOX:キャラ名` を表示しています
- 声ごとに利用規約が異なります。商用や公開の前に、使うキャラクターの規約を公式サイト（https://voicevox.hiroshiba.jp/）で確認してください

## 7. 公開 URL の注意

Vercel の公開 URL は誰でも開けます。AI の API 利用料は、アクセスが増えるほど増えます。
Anthropic / Google 側にも、月の利用上限（Spend limit）を設定しておくと安心です。
