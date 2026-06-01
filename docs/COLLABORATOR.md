# 协作者上手指南

面向被邀请进入 `liyanjun9296-svg/mm` 仓库的协作者。

## 1. 首次拉取与初始化

```bash
git clone https://github.com/liyanjun9296-svg/mm.git
cd mm

# 复制 env 模板
cp .env.local.example .env.local

# 把负责人通过私聊（微信/iMessage）发的密钥粘贴到 .env.local 的空字段：
# - COS_SECRET_ID
# - COS_SECRET_KEY
# - ADMIN_UPLOAD_TOKEN
# 其他字段（COS_BUCKET / REGION / PUBLIC_BASE_URL / DEV_USE_LOCAL_SNAPSHOT）模板里已有值，无需改。

# 安装依赖
npm install

# 首次同步 COS 媒体到本地（约 1.4GB 一次性下行；之后日常 dev 不再扣 COS 流量包）
npm run dev:sync -- --media

# 启动
npm run dev
# 浏览器打开 http://localhost:3000，能看到作品集 = 成功
```

> Node 版本需 ≥ 20。建议用 `nvm use 20`。

## 2. 日常协作流程（feature branch + PR）

```bash
# 每次开始新工作前同步 main
git checkout main
git pull

# 切到新分支
git checkout -b feat/your-feature-name
# 或：git checkout -b fix/some-bug

# 改代码……
git add -A
git commit -m "feat: 简明描述本次改动"

# 推送
git push -u origin feat/your-feature-name
```

然后到 GitHub `mm` 仓库网页上 **New Pull Request** → 选择刚推的分支 → 提交 PR → 等负责人 review & merge。

合并后清理：

```bash
git checkout main && git pull
git branch -d feat/your-feature-name      # 删本地分支
```

## 3. 不要做的事

- 不要把 `.env.local`、`.dev-data/` 推到 git（已在 `.gitignore`，正常 `git add` 不会带上）
- 不要直接 push 到 `main`，所有改动走 PR
- 不要执行下列**危险脚本**（涉及 COS 全量覆盖/删除，仅负责人在维护时用）：
  - `npm run seed:works`（会整包覆盖 COS 上的作品 JSON）
  - `npm run migrate:works`
  - `npm run restore:videos`
  - `npm run cos:cleanup -- --apply`、`cos:prune-orphans -- --apply`、`cos:prune-versions -- --apply`
- 不要手动改作品上传路径，后台已固定 `works/{videos|covers|gallery}/{slug}.{ext}`
- 不要修改 `src/components/motion/` 下的交互组件逻辑（已调好的动效，CSS 调样式即可）

## 4. 后台管理（编辑作品）

仅本机 dev 才会出现「管理」入口：

```bash
npm run dev
# 浏览器：http://localhost:3000/zh/admin
# 用 .env.local 里的 ADMIN_UPLOAD_TOKEN 登录
```

线上 `gaoxinming.xyz` 不显示「管理」按钮（`NODE_ENV=development` 才注入）。

## 5. 改样式或文案的速查

- 颜色/间距/动画变量 → `src/app/styles/_tokens.css`
- 各模块样式（每个文件只管自己模块）：`_hero.css`、`_capabilities.css`、`_portfolio.css`、`_about.css`、`_contact.css`、`_nav.css`、`_section-header.css`
- 文案（中英文）→ `src/i18n/messages/zh.ts` 和 `en.ts`，**两个都要改**
- 个人简介 / 经历 / FAQ / 联系方式 → `src/features/profile/data/profile.ts`

完整规范见 [`README.md`](../README.md) 与 [`docs/STORAGE_STRATEGY.md`](STORAGE_STRATEGY.md)。

## 6. 遇到问题

- 启动报 COS 错 → 检查 `.env.local` 是否粘贴完整（3 个空字段都要填）
- 视频/图片 404 → 跑一次 `npm run dev:sync -- --media`
- `npm install` 失败 → 确认 Node 版本 ≥ 20
- 其他 → 直接微信问负责人
