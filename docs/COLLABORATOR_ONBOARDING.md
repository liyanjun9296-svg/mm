# 协作者上手指南

公开仓库 **不包含** 密钥与 Cursor Skill。请向项目负责人索取私发文件。

## 你需要收到的私发物

| 文件 | 用途 |
|------|------|
| `portfolio-collaborator-setup.zip` | Cursor Skill，解压后安装 |
| `.env.local` | COS 密钥 + 后台口令（已填好） |

## 1. 克隆仓库

```bash
git clone https://github.com/liyanjun9296-svg/mm.git
cd mm
```

## 2. 安装 Skill（Cursor 推荐）

1. 解压 zip，将文件夹放到：
   - `~/.cursor/skills/portfolio-collaborator-setup/`（推荐，全项目可用）
   - 或 `mm/.cursor/skills/portfolio-collaborator-setup/`（仅本仓库）
2. 用 Cursor 打开 **`mm` 文件夹**（仓库根，含 `package.json`）
3. 新建 Agent 对话，**附上** 负责人私发的 `.env.local`，发送：

```text
使用 portfolio-collaborator-setup skill，用我附上的 .env.local 初始化环境并跑通 dev。
```

## 3. 或：终端一键脚本

```bash
cd mm
ENV_LOCAL_SRC=/path/to/负责人发来的.env.local bash scripts/setup-collaborator-env.sh
npm run dev
```

- `SKIP_DEV_SYNC=1` 可跳过首次约 1.4GB 的 COS 同步（预览会走公网、费流量）

## 4. 验证

- 首页：http://localhost:3000/zh
- 后台：http://localhost:3000/zh/admin（口令在 `.env.local` 的 `ADMIN_UPLOAD_TOKEN`）

## 5. 日常

```bash
npm run dev
```

改作品走本机后台；**生产站无「管理」按钮**。

上传新视频后更新本地预览副本：

```bash
npm run dev:sync -- --media --keys works/videos/你的slug.mp4
```

## 勿随意执行的命令

- `npm run seed:works -- --force`
- `npm run cos:prune-orphans -- --apply`
- `npm run restore:videos`

## 更多说明

- 存储与安全：[STORAGE_STRATEGY.md](./STORAGE_STRATEGY.md)
- 负责人打 Skill 包：`bash scripts/pack-collaborator-skill.sh`（输出 `dist/portfolio-collaborator-setup.zip`）
