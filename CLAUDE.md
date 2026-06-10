# ボトル管理アプリ (botoru)

## 概要
キャバレー向けのボトルキープ管理ウェブアプリ。スマホからアクセスして使う。

## 公開URL
https://fuihorei-oss.github.io/botoru/

## 技術構成
- フロントエンド: React 19 + Vite 8（GitHub Pages でホスティング）
- データベース: Firebase Realtime Database
- 認証: Firebase メール/パスワード認証（固定アカウント `staff@botoru.local`）+ クライアント側パスワード画面
- デプロイ: GitHub Actions（main ブランチへの push で自動）

## 重要なファイル
- `src/App.jsx` — メイン画面（ボトル一覧・検索・フィルター・スナップショットキャッシュ）
- `src/main.jsx` — エントリポイント・認証ガード（onAuthStateChanged でルーティング）
- `src/components/AuthScreen.jsx` — パスワード画面
- `src/components/BottleCard.jsx` — ボトルカード表示
- `src/components/BottleForm.jsx` — ボトル追加・編集フォーム
- `src/components/CastList.jsx` — キャストタブ
- `src/components/NeckList.jsx` — ネックタブ
- `src/utils/firestore.js` — Firebase 読み書き処理（subscribeBottles・upsert・delete・batch）
- `src/utils/firebase.js` — Firebase 初期化・メール/パスワード認証
- `src/utils/search.js` — Fuse.js + wanakana による日本語ファジー検索
- `src/utils/castColors.js` — キャスト名ごとの色生成
- `src/utils/csvImport.js` — ボトル管理テーブル CSV のインポート処理
- `src/utils/date.js` — 日付ユーティリティ
- `src/utils/storage.js` — ID 生成
- `database.rules.json` — Firebase セキュリティルール
- `.github/workflows/deploy.yml` — 自動デプロイ設定

## GitHub Secrets（GitHub Actions のビルドに必要）
以下を https://github.com/fuihorei-oss/botoru/settings/secrets/actions で管理:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_AUTH_HASH` — パスワードの SHA-256 ハッシュ（ソースコードには書かない）

## Firebase プロジェクト
- プロジェクト ID: `botoru-87670`
- データベース: `botoru-87670-default-rtdb`
- セキュリティルール: `auth != null && auth.token.email === 'staff@botoru.local'`（固定アカウントのみ読み書き可）
- ルールは `firebase deploy --only database --project botoru-87670` でデプロイ

## セキュリティの現状
- パスワード画面はクライアント側照合（C方式）だが、Firebase Rules でデータ本体を保護済み
- Firebase Auth はメール/パスワード方式（固定メール `staff@botoru.local`、パスワードはハッシュで管理）
- パスワードハッシュは GitHub Secrets に保管、ソースコードには存在しない
- リポジトリは public だが、重要な値はすべて Secrets で管理

## パフォーマンス
- 初回読み込み: Firebase RTDB から全件 DL（3,000件超の場合は数秒かかる）
- 2回目以降: `localStorage` に `botoru_snapshot` キーでスナップショットキャッシュ → 即時表示
- 検索インデックス（Fuse.js）は入力開始時のみ構築（起動時の CPU ブロックを回避）

## 現在のバージョン
v1.1.8

## よく使うコマンド
```bash
# 開発サーバー起動
npm run dev

# Firebase セキュリティルールをデプロイ
firebase deploy --only database --project botoru-87670

# 本番デプロイ（main にプッシュすれば自動）
git push origin main
```
