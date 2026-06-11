# ボトル管理アプリ (botoru)

## 概要
キャバレー向けのボトルキープ管理ウェブアプリ。スマホからアクセスして使う。

## 公開URL
https://fuihorei-oss.github.io/botoru/

## 技術構成
- フロントエンド: React 19 + Vite 8（GitHub Pages でホスティング、base: `/botoru/`）
- データベース: Firebase Firestore
- 認証: Firebase メール/パスワード認証（承認制マルチアカウント）
- デプロイ: GitHub Actions（main ブランチへの push で自動）

## 重要なファイル
- `src/App.jsx` — メイン画面（ボトル一覧・検索・フィルター）
- `src/main.jsx` — エントリポイント・認証ガード（onAuthStateChanged → role チェック）
- `src/components/AuthScreen.jsx` — ログイン・新規登録画面
- `src/components/PendingScreen.jsx` — 承認待ち画面
- `src/components/AdminPanel.jsx` — ユーザー承認管理（admin のみ表示）
- `src/components/BottleCard.jsx` — ボトルカード表示
- `src/components/BottleForm.jsx` — ボトル追加・編集フォーム
- `src/components/CastList.jsx` — キャストタブ
- `src/components/NeckList.jsx` — ネックタブ
- `src/utils/firestore.js` — Firebase 読み書き処理（subscribeBottles・upsert・delete・batch）
- `src/utils/firebase.js` — Firebase 初期化・認証
- `src/utils/search.js` — Fuse.js + wanakana による日本語ファジー検索
- `src/utils/castColors.js` — キャスト名ごとの色生成
- `src/utils/csvImport.js` — ボトル管理テーブル CSV のインポート処理
- `src/utils/date.js` — 日付ユーティリティ
- `src/utils/storage.js` — ID 生成
- `firestore.rules` — Firestore セキュリティルール
- `database.rules.json` — Realtime Database ルール（全拒否）
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

## Firebase プロジェクト
- プロジェクト ID: `botoru-87670`
- データストア: Firestore（`bottles` / `config` / `users` / `logs` コレクション）
- RTDB: `botoru-87670-default-rtdb`（全読み書き拒否、実データは Firestore）
- Firestore ルールのデプロイ: `firebase deploy --only firestore:rules --project botoru-87670`

## セキュリティの現状
- Firebase Auth（メール/パスワード）でログイン → Firestore の `users/{uid}.role` を参照
- role: `pending`（承認待ち）/ `staff`（通常スタッフ）/ `admin`（管理者）
- Firestore ルール側で role を検証するためクライアント改ざんは無効
- ログは追記専用（update/delete 不可）、admin のみ読み取り可

## 最初の管理者アカウントの作り方
新規インストール時は admin がいないため、UI からは昇格できない。以下の手順で手動設定する:

1. Firebase コンソール → Firestore Database → `users` コレクションを開く
2. 対象ユーザーのドキュメント（UID がキー）を選択
3. `role` フィールドを `"admin"` に変更して保存
4. 次回ログイン時から管理者権限で操作可能になる

## パフォーマンス
- 初回読み込み: Firestore から全件 DL（件数が多いと数秒かかる）
- 検索インデックス（Fuse.js）は入力開始時のみ構築（起動時の CPU ブロックを回避）

## 現在のバージョン
v1.3.18

## よく使うコマンド
```bash
# 開発サーバー起動
npm run dev

# Firestore セキュリティルールをデプロイ
firebase deploy --only firestore:rules --project botoru-87670

# 本番デプロイ（main にプッシュすれば自動）
git push origin main
```
