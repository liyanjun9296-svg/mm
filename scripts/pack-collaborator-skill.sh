#!/usr/bin/env bash
# 打包协作者 Skill 为 zip（负责人私发，勿提交 Git）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_PARENT="$ROOT/.cursor/skills"
SKILL_NAME="portfolio-collaborator-setup"
SKILL_DIR="$SKILLS_PARENT/$SKILL_NAME"
OUT_DIR="$ROOT/dist"
ZIP="$OUT_DIR/portfolio-collaborator-setup.zip"

if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
  echo "错误: 未找到 $SKILL_DIR/SKILL.md"
  exit 1
fi

mkdir -p "$OUT_DIR"
rm -f "$ZIP"

(
  cd "$SKILLS_PARENT"
  zip -r "$ZIP" "$SKILL_NAME"
)

echo "已生成: $ZIP"
echo "解压到 mm/.cursor/skills/ 后与 .env.local 一并通过私聊发给协作者"
