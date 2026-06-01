# Portfolio Site

个人自媒体作品集主站，Next.js App Router 构建，支持中英双语、作品筛选与详情页。

## 环境依赖（新电脑必装）

- Git（用于拉取与提交代码）
- Node.js `>=20`（推荐 20 LTS 或 22 LTS）
- npm `>=10`（随 Node 安装）

可选但推荐：

- nvm（用于切换 Node 版本）
- VS Code / Cursor（编辑器）

## 快速启动

```bash
cd portfolio-site
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)，自动跳转到 `/zh`。

> 端口被占用时：`npm run dev -- --port 3001`，访问 `http://localhost:3001/zh`

---

## 在其他电脑继续开发

> **协作者首次上手**：完整流程见 [`docs/COLLABORATOR.md`](docs/COLLABORATOR.md)（clone → cp `.env.local.example` → 粘贴负责人私发的密钥 → `npm run dev:sync -- --media` → `npm run dev`）。
> 旧版 Skill 流程（`portfolio-collaborator-setup.zip`）已不再推荐，改用 `docs/COLLABORATOR.md`。

### 不在 Git 上的内容

| 项 | 说明 |
|----|------|
| `.env.local` | COS 密钥、`ADMIN_UPLOAD_TOKEN` 等 |
| `.dev-data/` | `dev:sync --media` 本地快照（~1.4GB） |
| `node_modules/`、`.next/` | 本地安装/构建产物 |

### 1) 克隆项目

```bash
git clone https://github.com/liyanjun9296-svg/mm.git
cd mm
```

### 2) 安装依赖

```bash
npm install
```

### 3) 启动开发环境

```bash
cp .env.local.example .env.local   # 首次：填写 COS_* 与 ADMIN_UPLOAD_TOKEN
npm run dev:sync -- --media        # 首次：同步 COS 到 .dev-data/（约 1.4GB 一次性下行）
npm run dev
```

默认访问 [http://localhost:3000/zh](http://localhost:3000/zh)。右下角「管理」按钮**仅本地 dev 显示**。

### 4) 构建与检查（建议提交前执行）

```bash
npm run lint
npm run build
```

---

## 架构与运维要点（2026-05）

| 文档 | 内容 |
|------|------|
| [**docs/STORAGE_STRATEGY.md**](docs/STORAGE_STRATEGY.md) | **COS 存储策略**（对象布局、读写链、计费、安全/丢失/流量风险、后台规范） |
| [docs/COS_CONSOLE.md](docs/COS_CONSOLE.md) | 控制台 CORS、密钥、生命周期 |
| [`.cursor/rules/cos-traffic-dev.mdc`](../.cursor/rules/cos-traffic-dev.mdc) | Agent 常载：流量与省流量习惯 |
| [`.cursor/rules/portfolio-project.mdc`](../.cursor/rules/portfolio-project.mdc) | 站点架构与样式规范 |

| 主题 | 约定 |
|------|------|
| **生产域名** | `https://gaoxinming.xyz` |
| **作品元数据** | `site/works/items/{slug}.json` + 索引；镜像 `site/works.json`、备份 `.bak` |
| **作品媒体** | `works/videos|covers|gallery/{slug}.*`（`workMediaKey`，覆盖前 confirm） |
| **管理后台** | 仅本机 dev：`/zh/admin` + `ADMIN_UPLOAD_TOKEN`；**线上无「管理」按钮** |
| **本地零流量** | `DEV_USE_LOCAL_SNAPSHOT=1` + `dev:sync --media` → 读 `.dev-data/`；**写仍走 COS** |
| **数据安全** | 单条保存不覆盖全库（409）；删除默认只删 JSON；勿随意 `seed`/`prune --apply` |
| **流量安全** | 公有读会计下行；**已配 Referer 白名单防盗链**（详见 [`docs/COS_CONSOLE.md`](docs/COS_CONSOLE.md) §6.5）；口令/密钥勿泄露；建议余额告警 |
| **万象缩图** | 列表 `imageView2`；详情原图/原视频 |

### 本地 dev 工作流

```bash
# 1. 环境（首次）
cp .env.local.example .env.local
# 填写 COS_*、ADMIN_UPLOAD_TOKEN；DEV_USE_LOCAL_SNAPSHOT=1

# 2. 同步快照（首次或 COS 大更新后）
npm run dev:sync -- --media

# 3. 日常
npm run dev
# → 浏览/改 UI/后台管理，媒体从 .dev-data 读，不反复扣 50GB 流量包

# 4. 上传新视频后（可选，更新本地副本）
npm run dev:sync -- --media --keys works/videos/your-slug.mp4
```

---

## 项目结构

```
src/
├── app/
│   ├── api/                 ← admin、cos/upload、dev/media（本地快照代理）
│   ├── globals.css
│   ├── styles/
│   └── [locale]/            ← 页面 + admin/
├── components/
│   ├── admin/               ← WorkEditForm、WorksListClient 等
│   ├── motion/
│   ├── sections/            ← Hero、Capabilities、Portfolio、About、Contact（含页脚）
│   └── ui/                  ← NavBar、ContactModal、FaqAccordion、SiteActionDock（仅 dev）
├── features/portfolio/        ← works-store.ts、types、utils
├── lib/
│   ├── admin/api.ts         ← workMediaKey、上传/保存 API
│   ├── cos/                 ← env、upload-keys、image-url（万象）
│   └── dev/local-snapshot.ts
└── i18n/messages/
scripts/                       ← dev:sync、cos:report、upload:cos 等
public/images/portrait.png       ← Hero 桌面人像（RGBA）
public/images/hero-avatar-375.png ← Hero 移动端圆头像
public/images/about-portrait.png ← 关于我左栏人像
public/logo.svg                ← 导航 Logo
.dev-data/                     ← 本地 COS 快照（gitignore，dev:sync 生成）
```

---

## 常见修改指南

### 替换作品内容（推荐：本机后台）

日常在本机 dev 管理，**不要在生产站反复试播大视频**：

1. `npm run dev` → [http://localhost:3000/zh/admin](http://localhost:3000/zh/admin)，输入 `ADMIN_UPLOAD_TOKEN`
2. 新建或编辑作品：**先填标题/slug**，再上传封面、视频、详情图，点 **保存**
3. 媒体路径固定为 `works/.../{slug}.*`，覆盖已有文件前会弹 confirm
4. 删除作品时可选：**仅删记录**（默认）或 **勾选后连同 COS 媒体一起删**

**数据防丢失：**

- 每条作品独立 JSON，保存单条不会覆盖全部
- 每次全量保存前自动备份 `site/works.json.bak`
- 建议在 COS 控制台开启 Bucket **版本控制**（见 [docs/COS_CONSOLE.md](docs/COS_CONSOLE.md)）
- 从 COS 恢复未登记视频：`npm run restore:videos`
- 从 pick 文件夹批量上传摄影（按子目录分类）：`npm run upload:pick-photos -- --dry-run` 预览，`npm run upload:pick-photos` 实际上传（默认源路径为外置盘 `图片汇总/pick`，可用 `--source` 覆盖）

首次部署或重置目录时，可执行一次种子同步（**会整包覆盖** COS 上的 `site/works.json`，含后台已保存作品）：

```bash
npm run seed:works -- --force
```

日常更新请只用 `/zh/admin` 后台保存，**不要**随意运行 seed。

高级用户仍可编辑 `src/features/portfolio/data/works.ts` 作为本地种子，或通过 `npm run upload:cos` 单独上传大文件。

### 替换人物照片
- **桌面**：覆盖 `public/images/portrait.png`（RGBA 透明 PNG），同步 `HeroSection.tsx` 里 `portrait` 的 `width` / `height`
- **移动端圆头像**：覆盖 `public/images/hero-avatar-375.png`，同步 `hero-avatar` 的 `width` / `height`

### 修改文案
`src/i18n/messages/zh.ts` 和 `en.ts` 两个文件都要改。

### 修改个人信息 / 经历 / FAQ
编辑 `src/features/profile/data/profile.ts`：
- `name` / `title` / `location` / `bioZh` / `bioEn` / `skills`
- `timeline[]`：含 `year`、`company`（可选）、`title`、`role`、`desc`
- `faq[]`：FAQ 问答对

### 修改联系方式与平台链接
- 弹窗手机/邮箱 → `profile.ts` 的 `contactInfo`（`phone`、`email`）
- 右侧平台列表 → `profile.ts` 的 `contactPlatforms`（抖音、视频号、小红书等）
- Contact 区块标题、CTA 按钮、弹窗文案 → `i18n/messages/zh.ts` 和 `en.ts` 的 `contact.*`
- 页脚版权 → 同上文件的 `footer.copyright` / `footer.brand`

### 替换关于我左栏人像
将新图片覆盖 `public/images/about-portrait.png`，并同步修改 `AboutSection.tsx` 中的 `width` 和 `height`。

### 页脚说明
全站页脚嵌在 Contact 区块末尾（`ContactSectionClient` → `.contact-site-footer`），**无**独立 Footer 组件；样式在 `_contact.css`。

### 修改颜色 / 字号
编辑 `src/app/styles/_tokens.css` 顶部的 `:root` 变量（板块间距 `--section-padding-y: 64px`）。

---

## Hero 首屏层次说明

### 桌面（≥901px）

人物图压在文字前面，依赖透明 PNG 实现人物浮层效果：

```
z-1  文字层（LINE1 实心 + LINE2 空心描边扫光）
z-3  人物图层（透明 PNG，底部居中对齐）
z-4  CTA 按钮（人物图片底边居中）
```

资源：`public/images/portrait.png`（2112×1188 RGBA）

### 移动端（≤900px）

- 顶部圆头像：`public/images/hero-avatar-375.png`（`.hero-avatar`）
- 隐藏 eyebrow、大 PNG、`scroll-hint`
- 文案左对齐；双 CTA 横排、`flex:1` 占满内容列（随屏宽拉伸，左右各 16px 边距）
- 样式：`_hero.css` 内 `@media (max-width: 900px)`

### 响应式分界

| 视口 | 布局 |
|------|------|
| ≤900px | 375 定稿族（`--content-mobile-pad: 16px`，板块间距见 `_tokens.css`） |
| 901–1100px | 略窄桌面（Hero 字号 clamp、能力卡高等） |
| ≥901px | 1440 默认层 |

首页勿再使用已废弃的 `390px` / `640px` Hero 断点；`640px` 仅后台 `_admin`、`_dock`。

---

## 常用命令

```bash
npm run dev      # 本地开发
npm run build    # 构建（检查是否有错误）
npm run lint     # ESLint 检查
npm run start    # 预览生产构建
npm run migrate:works          # 将 works.json 拆分为 site/works/items/*.json
npm run restore:videos         # 扫描 COS 孤儿视频并生成草稿作品
npm run cos:report             # COS 用量与孤儿统计
npm run cos:cleanup              # 预览清理；npm run cos:cleanup -- --apply 执行
npm run dev:sync -- --media      # 同步 COS 到 .dev-data/（本地 dev 零外网下行，见 .env.local.example）
npm run upload:pick-photos -- --dry-run   # 预览 pick 摄影批量上传
npm run upload:pick-photos                  # 按 pick 子文件夹上传摄影到 COS
npm run upload:cos -- <本地文件> <COS对象键>   # 高级：单独上传媒体文件
```

---

## 腾讯云 COS 配置与上传

视频/大图建议放在 COS，详情页通过 `mediaUrl` 直链播放（`<video src="...">`）。

**存储预算**：作品集有效内容建议 ≤ **10 GB**；20G COS 套餐为**存储容量包**，**外网流量另计**。详见 [docs/COS_CONSOLE.md](docs/COS_CONSOLE.md) §6。

### 1) 控制台（首次必做）

详见 [docs/COS_CONSOLE.md](docs/COS_CONSOLE.md)，主要包括：

1. 创建 Bucket，权限选 **公有读私有写**
2. 配置 **CORS**（仅 **大于 50MB** 的文件直传 COS 时需要，见 [docs/COS_CONSOLE.md](docs/COS_CONSOLE.md)）
3. 在 CAM 创建 **API 密钥**（SecretId / SecretKey）

> **≤50MB 的文件（含视频）**经本站 `POST /api/cos/upload` 中转上传，**无需配置 CORS**。**大于 50MB** 的文件走浏览器直传 COS（`POST /api/cos/presign` → PUT 到 COS），需在 Bucket 配置 CORS。修改 `.env.local` 后请**重启** `npm run dev`。

### 2) 本地环境变量

```bash
cp .env.local.example .env.local
```

填写：

| 变量 | 说明 |
|------|------|
| `COS_SECRET_ID` / `COS_SECRET_KEY` | API 密钥（勿提交 Git） |
| `COS_BUCKET` | 存储桶名称 |
| `COS_REGION` | 地域，如 `ap-guangzhou` |
| `COS_PUBLIC_BASE_URL` | 公有读根地址，如 `https://<bucket>.cos.<region>.myqcloud.com` |
| `NEXT_PUBLIC_COS_PUBLIC_BASE_URL` | 与上一项相同（封面图 `next/image` 域名白名单用） |
| `ADMIN_UPLOAD_TOKEN` | 管理后台口令（`/zh/admin` 登录用） |
| `DEV_USE_LOCAL_SNAPSHOT` | 设为 `1` 时本地 dev 读 `.dev-data/` 快照，避免反复 COS 下行（需先 `npm run dev:sync -- --media`） |

配置后重启 `npm run dev`。

**本地零流量**：首次 `npm run dev:sync -- --media`（约 1.4GB 一次性下行），之后日常 `npm run dev` 浏览/改 UI 基本不扣 COS 流量包。

**管理入口**：线上不显示「管理」按钮；请在本机 dev 打开 `/zh/admin`。

**上传路径**：后台媒体固定为 `works/videos/{slug}.mp4`、`works/covers/{slug}.jpg` 等，覆盖前会 confirm；勿用时间戳路径重复上传。

**万象缩图**：首页卡片与摄影列表 URL 带 `imageView2` 压缩参数；详情页仍为 COS 原图/原视频。

### 3) 作品管理后台（仅本机 dev）

| 路径 | 功能 |
|------|------|
| `/zh/admin` | 口令登录（线上无入口按钮，但 URL 仍可访问） |
| `/zh/admin/works` | 作品列表（新建 / 编辑 / 删除） |
| `/zh/admin/works/new` | 新建作品（须先填 slug 再上传） |
| `/zh/admin/works/<slug>` | 编辑单条作品 |

保存后写入 COS `site/works/items/{slug}.json` 并更新索引。旧地址 `/zh/admin/upload` 跳转到 `/zh/admin`。

### 4) 可选：命令行单独上传大文件

```bash
npm run upload:cos -- ./my-video.mp4 works/videos/brand-campaign.mp4
```

然后在后台编辑作品时，也可直接在表单里选文件上传（无需此命令）。

### 6) Vercel 部署与自定义域名

详见 [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)。

快速步骤：

1. [Vercel](https://vercel.com) Import 仓库 `liyanjun9296-svg/mm`（Root Directory 留空）
2. 配置与 `.env.local` 相同的 7 个环境变量
3. Deploy 后绑定根域名 + `www`（DNS：`@` → A `76.76.21.21`，`www` → CNAME `cname.vercel-dns.com`）
4. 更新 COS CORS：`SITE_DOMAIN=yourdomain.com npm run cos:cors`

CLI 可选：`npx vercel login` → `bash scripts/push-vercel-env.sh` → `npm run deploy:vercel`

### 5) 播放自检

1. 浏览器无痕窗口直接打开 COS 视频 URL → 应能播放、可拖动进度
2. 打开 `/zh/works/<slug>` → 详情页视频正常
3. 若封面来自 COS，构建前确保 `.env.local` 已设置 `NEXT_PUBLIC_COS_PUBLIC_BASE_URL`，再执行 `npm run build`

---

## 常见问题

### 图片替换后页面没变化

如果替换了人物图但页面看起来没更新，优先检查：

- `HeroSection.tsx` 中引用的文件名是否和你替换的文件一致
- 是否用了新文件名（可规避图片缓存）
- 浏览器是否强刷（`Cmd/Ctrl + Shift + R`）
