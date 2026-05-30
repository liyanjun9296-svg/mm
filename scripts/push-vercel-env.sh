#!/usr/bin/env bash
# 将 .env.local 中的变量推送到 Vercel（需先 vercel login && vercel link）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "缺少 .env.local，请先 cp .env.local.example .env.local 并填写"
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then
  echo "需要 Vercel CLI：npx vercel login"
  exit 1
fi

vercel_cmd() {
  if command -v vercel >/dev/null 2>&1; then
    vercel "$@"
  else
    npx vercel@latest "$@"
  fi
}

ENV_KEYS=(
  COS_SECRET_ID
  COS_SECRET_KEY
  COS_BUCKET
  COS_REGION
  COS_PUBLIC_BASE_URL
  NEXT_PUBLIC_COS_PUBLIC_BASE_URL
  ADMIN_UPLOAD_TOKEN
)

TARGETS=(production)

echo "→ 推送环境变量到 Vercel（${TARGETS[*]}）"

for key in "${ENV_KEYS[@]}"; do
  value="$(grep -E "^${key}=" .env.local | head -1 | cut -d= -f2- || true)"
  if [[ -z "${value}" ]]; then
    echo "  跳过 ${key}（.env.local 中为空）"
    continue
  fi
  for target in "${TARGETS[@]}"; do
    vercel_cmd env add "$key" "$target" --value "$value" --yes --force
    echo "  ✓ ${key} → ${target}"
  done
done

echo "完成。请在 Vercel 控制台 Redeploy 或运行：npm run deploy:vercel"
