---
name: portfolio-collaborator-setup
description: 协作者首次拉取 portfolio-site 后，自动配置 .env.local + 同步 COS 本地快照（约 1.4GB 一次性下行），让本地 dev 之后零外网流量。
trigger: 用户说「初始化项目」「搭环境」「同步快照」「跑起来」时；或第一次 clone portfolio-site 后。
---

# Portfolio 协作者一键初始化

## 你（Cursor Agent）必须做的事

按顺序、自动执行。每一步执行前先打印「当前在做：xxx」，执行后打印结果或错误。**不要询问用户**，除非 Step 2 缺失凭证。

### Step 1 — 定位项目根

进入仓库根目录（包含 `portfolio-site/package.json`）。所有命令在 `portfolio-site/` 下执行。如果当前 cwd 已经是 `portfolio-site/`，无需切换。

### Step 2 — 检查 / 创建 `.env.local`

路径：`portfolio-site/.env.local`

- 如果**已存在** → 读它，确认包含 `DEV_USE_LOCAL_SNAPSHOT=1`；缺则追加这一行；**不要**改动其它行。
- 如果**不存在** → 提醒用户：
  > 我需要 `.env.local` 才能继续。请向项目负责人（高新铭）索要包含以下字段的 `.env.local`，丢到 `portfolio-site/` 根目录后告诉我「好了」：
  > `COS_SECRET_ID` / `COS_SECRET_KEY` / `COS_BUCKET` / `COS_REGION` / `COS_PUBLIC_BASE_URL` / `NEXT_PUBLIC_COS_PUBLIC_BASE_URL` / `ADMIN_UPLOAD_TOKEN` / `DEV_USE_LOCAL_SNAPSHOT=1`
  
  收到后回到 Step 2 重新检查。

### Step 3 — 安装依赖（如果还没装）

```bash
[ -d node_modules ] || npm install
```

### Step 4 — 同步 COS 本地快照（**关键，省流量**）

```bash
npm run dev:sync -- --media
```

- 这会从 COS 拉作品 JSON + 全部视频/图片到 `portfolio-site/.dev-data/`，**约 1.4GB，仅一次**。
- 输出包含 `完成：N 成功，0 失败` 即成功。
- 失败常见原因：`.env.local` 凭证错误 / 网络中断。失败请回到 Step 2 让用户核对凭证。

### Step 5 — 启动开发服务器

```bash
npm run dev
```

后台运行；等到日志出现 `Ready in` / `Local: http://localhost:3000` 即可。

### Step 6 — 验证零外网流量（**必做**）

打印这段验证清单给用户，让用户在浏览器自查：

> 打开 http://localhost:3000/zh
> → F12 → Network 面板 → 过滤 `cos.ap-beijing` 或 `myqcloud.com`
> → 刷新页面
> → **应该是 0 条请求**。所有图片/视频走 `/api/dev/media?key=...`（本地）
> → 如果还有 myqcloud 的请求，告诉我，我来排查。

## 关键约束（**违反任何一条都会浪费负责人的 COS 流量包，请严格遵守**）

1. **不要** `git add .env.local` — 已在 .gitignore，确认即可。
2. **不要** `git add .dev-data/` — 同上。
3. **不要**为了"测试"运行 `npm run seed:works`、`npm run restore:videos`、`cos:cleanup --apply`、`cos:prune-orphans --apply` —— 这些会**改 COS 上的真实数据**。
4. **不要**在没有 `DEV_USE_LOCAL_SNAPSHOT=1` 的情况下 `npm run dev`：每次刷新都会从 COS 拉媒体（每次 5–80MB），会被计入流量包，负责人会看到流量曲线异常。
5. **后台 `/zh/admin` 上传/保存仍走 COS**（必要的上行）；这是正常的，不要试图绕过。

## 后续日常使用

- 每次开工：`cd portfolio-site && npm run dev`，本地零下行流量。
- 负责人通知"上传了新视频 xxx.mp4"时，增量同步：
  ```bash
  npm run dev:sync -- --media --keys works/videos/xxx.mp4
  ```
- 如果出现"图片不显示/视频 404"且确认线上有 → 说明本地快照旧了，跑一次 `npm run dev:sync -- --media`。

## 完成后输出给用户

```
✅ 环境就绪
   - .env.local 已配置（DEV_USE_LOCAL_SNAPSHOT=1）
   - .dev-data/ 已同步（X 个媒体，共 X.X GB）
   - dev 服务器运行中：http://localhost:3000
   - 请按 Step 6 在浏览器验证 Network 面板没有 myqcloud 请求
```
