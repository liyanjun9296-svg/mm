#!/usr/bin/env bash
# 打包协作者 Skill 为 zip（负责人私发，勿提交 Git）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_DIR="$ROOT/.cursor/skills/portfolio-collaborator-setup"
OUT_DIR="$ROOT/dist"
ZIP="$OUT_DIR/portfolio-collaborator-setup.zip"

if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
  echo "错误: 未找到 $SKILL_DIR/SKILL.md"
  exit 1
fi

mkdir -p "$OUT_DIR"
rm -f "$ZIP"

(
  cd "$SKILL_DIR"
  zip -r "$ZIP" SKILL.md CHECKLIST.md
)

echo "已生成: $ZIP"
echo "请与 .env.local 一并通过私聊发给协作者（勿上传公开网盘/Git）"
