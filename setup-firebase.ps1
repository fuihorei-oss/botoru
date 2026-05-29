
# ============================================================
#  Firebase + GitHub Secrets 自動セットアップ
# ============================================================
$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host $msg -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "OK: $msg" -ForegroundColor Green }
function Warn($msg){ Write-Host "!! $msg" -ForegroundColor Yellow }

Log "Firebase セットアップを開始します..."

# 1. Firebase CLI インストール
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Log "Firebase CLI をインストール中..."
    npm install -g firebase-tools
}
Ok "Firebase CLI"

# 2. Firebase ログイン
Log "Firebase にログインします（ブラウザが開きます）..."
firebase login
Ok "ログイン完了"

# 3. プロジェクト作成
$rnd = Get-Random -Minimum 10000 -Maximum 99999
$projectId = "botoru-$rnd"
Log "プロジェクト作成中: $projectId"
firebase projects:create $projectId --display-name "Botoru"
Ok "プロジェクト: $projectId"

# 4. Firestore 有効化
Log "Firestore を作成中..."
firebase firestore:databases:create --project $projectId --location asia-northeast1
Ok "Firestore 作成完了"

# 5. Firestore ルールファイル作成 & デプロイ
$rulesContent = 'rules_version = ''2'';' + "`n"
$rulesContent += 'service cloud.firestore {' + "`n"
$rulesContent += '  match /databases/{database}/documents {' + "`n"
$rulesContent += '    match /{document=**} {' + "`n"
$rulesContent += '      allow read, write: if request.auth != null;' + "`n"
$rulesContent += '    }' + "`n"
$rulesContent += '  }' + "`n"
$rulesContent += '}'
Set-Content -Path "firestore.rules" -Value $rulesContent -Encoding utf8

$fbJsonContent = '{ "firestore": { "rules": "firestore.rules" } }'
Set-Content -Path "firebase.json" -Value $fbJsonContent -Encoding utf8

firebase deploy --only firestore:rules --project $projectId
Ok "Firestore ルール デプロイ完了"

# 6. Web アプリ作成
Log "Web アプリを作成中..."
$rawAppOut = firebase apps:create WEB "botoru-web" --project $projectId --json
$appJson = $rawAppOut | ConvertFrom-Json
$appId = $appJson.result.appId
if (-not $appId) {
    $listRaw = firebase apps:list WEB --project $projectId --json
    $listJson = $listRaw | ConvertFrom-Json
    $appId = $listJson.result[0].appId
}
Ok "App ID: $appId"

# 7. SDK 設定取得
Log "SDK 設定を取得中..."
$cfgRaw = firebase apps:sdkconfig WEB $appId --project $projectId --json
$cfgJson = $cfgRaw | ConvertFrom-Json
$cfg = $cfgJson.result.sdkConfig
Ok "SDK 設定取得完了"

# 8. .env ファイル作成
$envLines = @(
    "VITE_FIREBASE_API_KEY=$($cfg.apiKey)",
    "VITE_FIREBASE_AUTH_DOMAIN=$($cfg.authDomain)",
    "VITE_FIREBASE_PROJECT_ID=$($cfg.projectId)",
    "VITE_FIREBASE_STORAGE_BUCKET=$($cfg.storageBucket)",
    "VITE_FIREBASE_MESSAGING_SENDER_ID=$($cfg.messagingSenderId)",
    "VITE_FIREBASE_APP_ID=$($cfg.appId)"
)
Set-Content -Path ".env" -Value $envLines -Encoding utf8
Ok ".env 作成完了"

# 9. Anonymous 認証（ブラウザで有効化）
Write-Host ""
Warn "Anonymous 認証を有効にしてください（1クリックだけ必要）"
Write-Host "  ブラウザが開きます → 「匿名」→「有効にする」→「保存」" -ForegroundColor White
Start-Sleep -Seconds 2
Start-Process "https://console.firebase.google.com/project/$projectId/authentication/providers"
Read-Host "  完了したら Enter を押してください"
Ok "Anonymous 認証 完了"

# 10. GitHub Secrets 設定
Write-Host ""
Log "GitHub Secrets を設定中..."
$secrets = [ordered]@{
    "VITE_FIREBASE_API_KEY"             = $cfg.apiKey
    "VITE_FIREBASE_AUTH_DOMAIN"         = $cfg.authDomain
    "VITE_FIREBASE_PROJECT_ID"          = $cfg.projectId
    "VITE_FIREBASE_STORAGE_BUCKET"      = $cfg.storageBucket
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = $cfg.messagingSenderId
    "VITE_FIREBASE_APP_ID"              = $cfg.appId
}

$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue
if ($ghAvailable) {
    foreach ($key in $secrets.Keys) {
        gh secret set $key --body $secrets[$key] --repo fuihorei-oss/botoru
        Write-Host "  $key 完了"
    }
    Ok "GitHub Secrets 設定完了"
} else {
    Warn "gh CLI が見つかりません。以下を手動で設定してください："
    Write-Host "  https://github.com/fuihorei-oss/botoru/settings/secrets/actions" -ForegroundColor White
    foreach ($key in $secrets.Keys) {
        Write-Host "  $key = $($secrets[$key])" -ForegroundColor Gray
    }
    Read-Host "  設定完了したら Enter を押してください"
}

# 11. デプロイ
Log "GitHub にプッシュしてデプロイを開始..."
git add firestore.rules firebase.json
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "add firebase config files"
} else {
    git commit --allow-empty -m "trigger redeploy with Firebase config"
}
git push
Ok "デプロイ開始"

Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host " セットアップ完了！" -ForegroundColor Green
Write-Host " URL: https://fuihorei-oss.github.io/botoru/" -ForegroundColor White
Write-Host " 1〜2分後にアクセスするとデータが同期されます" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Magenta
