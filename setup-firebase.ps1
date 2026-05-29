# ============================================================
#  Firebase + GitHub Secrets 自動セットアップ
# ============================================================
$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host $msg -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "✅ $msg" -ForegroundColor Green }
function Warn($msg){ Write-Host "⚠️  $msg" -ForegroundColor Yellow }

Log "🔥 Firebase セットアップを開始します..."

# ── 1. Firebase CLI インストール ──────────────────────────────
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Log "Firebase CLI をインストール中..."
    npm install -g firebase-tools
}
Ok "Firebase CLI OK"

# ── 2. Firebase ログイン ──────────────────────────────────────
Log "Firebase にログインします（ブラウザが開きます）..."
firebase login
Ok "ログイン完了"

# ── 3. プロジェクト作成 ───────────────────────────────────────
$rnd       = Get-Random -Minimum 10000 -Maximum 99999
$projectId = "botoru-$rnd"
Log "プロジェクト作成中: $projectId"
firebase projects:create $projectId --display-name "Botoru" 2>&1 | Out-Null
Ok "プロジェクト: $projectId"

# ── 4. Firestore 有効化 ───────────────────────────────────────
Log "Firestore データベースを作成中（東京）..."
firebase firestore:databases:create --project $projectId --location asia-northeast1 2>&1 | Out-Null
Ok "Firestore 作成完了"

# ── 5. Firestore セキュリティルール デプロイ ─────────────────
$rules = @'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
'@
Set-Content "firestore.rules" $rules -Encoding utf8

$fbJson = @"
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
"@
Set-Content "firebase.json" $fbJson -Encoding utf8
firebase deploy --only firestore:rules --project $projectId 2>&1 | Out-Null
Ok "Firestore ルール デプロイ完了"

# ── 6. Web アプリ作成 & SDK 設定取得 ─────────────────────────
Log "Web アプリを作成中..."
$appOut = firebase apps:create WEB "botoru-web" --project $projectId --json 2>&1
$appJson = $appOut | Where-Object { $_ -match '^\{' } | ConvertFrom-Json
if (-not $appJson) {
    $appOut = firebase apps:create WEB "botoru-web" --project $projectId --json | ConvertFrom-Json
}
$appId = $appJson.result.appId
if (-not $appId) {
    # フォールバック: アプリ一覧から取得
    $listOut = firebase apps:list WEB --project $projectId --json | ConvertFrom-Json
    $appId = $listOut.result[0].appId
}
Ok "App ID: $appId"

Log "SDK 設定を取得中..."
$cfgOut = firebase apps:sdkconfig WEB $appId --project $projectId --json | ConvertFrom-Json
$cfg = $cfgOut.result.sdkConfig
Ok "SDK 設定取得完了"

# ── 7. .env ファイル作成 ──────────────────────────────────────
$env_content = @"
VITE_FIREBASE_API_KEY=$($cfg.apiKey)
VITE_FIREBASE_AUTH_DOMAIN=$($cfg.authDomain)
VITE_FIREBASE_PROJECT_ID=$($cfg.projectId)
VITE_FIREBASE_STORAGE_BUCKET=$($cfg.storageBucket)
VITE_FIREBASE_MESSAGING_SENDER_ID=$($cfg.messagingSenderId)
VITE_FIREBASE_APP_ID=$($cfg.appId)
"@
Set-Content ".env" $env_content -Encoding utf8
Ok ".env 作成完了"

# ── 8. Anonymous 認証を有効化（ブラウザ） ────────────────────
Write-Host ""
Warn "Anonymous 認証を有効にしてください（自動化不可の唯一の手順）"
Write-Host "  ブラウザが開きます → 「匿名」→「有効にする」→「保存」" -ForegroundColor White
Start-Sleep -Seconds 2
Start-Process "https://console.firebase.google.com/project/$projectId/authentication/providers"
Read-Host "  完了したら Enter を押してください"
Ok "Anonymous 認証 完了"

# ── 9. GitHub Secrets 設定 ────────────────────────────────────
Write-Host ""
Log "GitHub Secrets を設定中..."
$secrets = @{
    "VITE_FIREBASE_API_KEY"            = $cfg.apiKey
    "VITE_FIREBASE_AUTH_DOMAIN"        = $cfg.authDomain
    "VITE_FIREBASE_PROJECT_ID"         = $cfg.projectId
    "VITE_FIREBASE_STORAGE_BUCKET"     = $cfg.storageBucket
    "VITE_FIREBASE_MESSAGING_SENDER_ID"= $cfg.messagingSenderId
    "VITE_FIREBASE_APP_ID"             = $cfg.appId
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
    foreach ($key in $secrets.Keys) {
        gh secret set $key --body $secrets[$key] --repo fuihorei-oss/botoru
        Write-Host "  $key ✅"
    }
    Ok "GitHub Secrets 設定完了"
} else {
    Warn "gh CLI が見つかりません。GitHub Secrets を手動で設定してください："
    Write-Host "  https://github.com/fuihorei-oss/botoru/settings/secrets/actions" -ForegroundColor White
    foreach ($key in $secrets.Keys) {
        Write-Host "  $key = $($secrets[$key])" -ForegroundColor Gray
    }
    Read-Host "  手動で設定完了したら Enter を押してください"
}

# ── 10. GitHub Actions でデプロイ ─────────────────────────────
Log "GitHub にプッシュしてデプロイを開始..."
git add .env.example firebase.json firestore.rules 2>&1 | Out-Null
git diff --quiet HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
    git add -A
    git commit -m "add firebase config files"
} else {
    git commit --allow-empty -m "trigger redeploy with Firebase config"
}
git push
Ok "デプロイ開始完了！"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host " セットアップ完了！" -ForegroundColor Green
Write-Host " デプロイURL: https://fuihorei-oss.github.io/botoru/" -ForegroundColor White
Write-Host " 1〜2分後にアクセスするとデータが同期されます" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
