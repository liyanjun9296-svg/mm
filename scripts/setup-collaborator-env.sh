#!/usr/bin/env bash
# 协作者本地环境初始化。勿提交生成的 .env.local。
# 非交互：ENV_LOCAL_SRC=/path/to/.env.local bash scripts/setup-collaborator-env.sh
# 跳过同步：SKIP_DEV_SYNC=1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> mm 仓库协作者环境初始化"
echo "    目录: $ROOT"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "错误: 未安装 Node.js（需要 >= 20）"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "错误: Node 版本需 >= 20，当前: $(node -v)"
  exit 1
fi

if [ ! -f "$ROOT/package.json" ]; then
  echo "错误: 请在仓库根目录（含 package.json）运行，当前: $ROOT"
  exit 1
fi

echo "==> npm install"
npm install

ENV_FILE="$ROOT/.env.local"
EXAMPLE="$ROOT/.env.local.example"

install_env_from_src() {
  local src="$1"
  if [ ! -f "$src" ]; then
    echo "错误: ENV_LOCAL_SRC 文件不存在: $src"
    exit 1
  fi
  cp "$src" "$ENV_FILE"
  chmod 600 "$ENV_FILE" 2>/dev/null || true
  echo "已复制: $src -> .env.local"
}

if [ -n "${ENV_LOCAL_SRC:-}" ]; then
  install_env_from_src "$ENV_LOCAL_SRC"
elif [ -f "$ENV_FILE" ] && [ ! -t 0 ]; then
  echo "保留现有 .env.local"
elif [ -f "$ENV_FILE" ]; then
  read -r -p ".env.local 已存在，是否覆盖？[y/N] " OVERWRITE
  if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
    rm -f "$ENV_FILE"
  else
    echo "保留现有 .env.local"
  fi
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "请向项目负责人索取 COS 密钥与 ADMIN_UPLOAD_TOKEN（勿在公开群发送）"
  echo ""

  if [ -t 0 ]; then
    read -r -p "负责人发来的 .env.local 路径？[留空则逐项输入] " ENV_PATH
    if [ -n "$ENV_PATH" ] && [ -f "$ENV_PATH" ]; then
      install_env_from_src "$ENV_PATH"
    else
      cp "$EXAMPLE" "$ENV_FILE"
      prompt() { local n="$1" d="$2" v; read -r -p "$n [$d]: " v; echo "${v:-$d}"; }
      SID=$(prompt "COS_SECRET_ID" "")
      SKEY=$(prompt "COS_SECRET_KEY" "")
      TOKEN=$(prompt "ADMIN_UPLOAD_TOKEN" "")
      if [ -z "$SID" ] || [ -z "$SKEY" ] || [ -z "$TOKEN" ]; then
        echo "错误: SECRET_ID、SECRET_KEY、ADMIN_UPLOAD_TOKEN 不能为空"
        exit 1
      fi
      cat > "$ENV_FILE" <<EOF
COS_SECRET_ID=$SID
COS_SECRET_KEY=$SKEY
COS_BUCKET=portfolio-gaoxinming-1305428454
COS_REGION=ap-beijing
COS_PUBLIC_BASE_URL=https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com
NEXT_PUBLIC_COS_PUBLIC_BASE_URL=https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com
ADMIN_UPLOAD_TOKEN=$TOKEN
DEV_USE_LOCAL_SNAPSHOT=1
EOF
      chmod 600 "$ENV_FILE" 2>/dev/null || true
    fi
  else
    echo "非交互终端：请设置 ENV_LOCAL_SRC=/path/to/.env.local 或先创建 .env.local"
    exit 1
  fi
fi

if ! grep -q '^DEV_USE_LOCAL_SNAPSHOT=1' "$ENV_FILE" 2>/dev/null; then
  echo "DEV_USE_LOCAL_SNAPSHOT=1" >> "$ENV_FILE"
fi

if ! grep -q '^ADMIN_UPLOAD_TOKEN=.' "$ENV_FILE" 2>/dev/null; then
  echo "错误: .env.local 缺少 ADMIN_UPLOAD_TOKEN"
  exit 1
fi

if ! grep -q '^COS_SECRET_ID=.' "$ENV_FILE" 2>/dev/null; then
  echo "错误: .env.local 缺少 COS_SECRET_ID"
  exit 1
fi

run_sync=true
if [ -n "${SKIP_DEV_SYNC:-}" ]; then
  run_sync=false
elif [ -t 0 ] && [ -z "${ENV_LOCAL_SRC:-}" ]; then
  read -r -p "是否执行 npm run dev:sync -- --media？（首次约 1.4GB 下行）[Y/n] " SYNC
  if [[ "$SYNC" =~ ^[Nn]$ ]]; then
    run_sync=false
  fi
fi

if [ "$run_sync" = true ]; then
  echo "==> npm run dev:sync -- --media"
  npm run dev:sync -- --media
else
  echo "已跳过 dev:sync；预览将走 COS 公网（费流量）"
fi

echo ""
echo "==> 完成。启动开发："
echo "    npm run dev"
echo "    首页 http://localhost:3000/zh"
echo "    后台 http://localhost:3000/zh/admin"
echo ""
echo "存储与安全说明: docs/STORAGE_STRATEGY.md"
