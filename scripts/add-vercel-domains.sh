#!/usr/bin/env bash
# 在 Vercel 项目添加根域名 + www（DNS 仍需在注册商配置）
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法: bash scripts/add-vercel-domains.sh yourdomain.com"
  exit 1
fi

DOMAIN="${1#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%%/*}"
DOMAIN="${DOMAIN#www.}"

vercel_cmd() {
  if command -v vercel >/dev/null 2>&1; then
    vercel "$@"
  else
    npx vercel@latest "$@"
  fi
}

echo "→ 添加域名 ${DOMAIN} 与 www.${DOMAIN}"
vercel_cmd domains add "$DOMAIN"
vercel_cmd domains add "www.${DOMAIN}"

cat <<EOF

请在域名注册商 DNS 控制台添加：

| 主机记录 | 类型  | 值                      |
|----------|-------|-------------------------|
| @        | A     | 76.76.21.21             |
| www      | CNAME | cname.vercel-dns.com    |

生效后在 Vercel → Settings → Domains 确认 Valid Configuration。
EOF
