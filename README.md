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

### 1) 克隆项目

```bash
git clone <你的仓库地址>
cd portfolio-site
```

### 2) 安装依赖

```bash
npm install
```

### 3) 启动开发环境

```bash
npm run dev
```

默认访问 [http://localhost:3000/zh](http://localhost:3000/zh)。

### 4) 构建与检查（建议提交前执行）

```bash
npm run lint
npm run build
```

---

## 项目结构

```
src/
├── app/
│   ├── globals.css          ← 只有 @import，不要在这里写样式
│   ├── styles/              ← CSS 模块（改样式只动对应文件）
│   │   ├── _tokens.css      ← 设计变量 + 重置
│   │   ├── _nav.css         ← 导航栏
│   │   ├── _hero.css        ← Hero 首屏
│   │   ├── _portfolio.css   ← 作品集区域
│   │   ├── _about.css       ← 关于我
│   │   ├── _contact.css     ← 联系方式
│   │   └── _footer.css      ← 页脚
│   └── [locale]/            ← 页面路由（zh / en）
├── components/
│   ├── motion/              ← 交互动效（MagneticButton、TiltCard 等）
│   ├── sections/            ← 页面板块（Hero、Portfolio、About、Contact）
│   └── ui/                  ← NavBar、LanguageSwitch
├── features/
│   ├── portfolio/data/works.ts    ← 种子数据（COS 无 JSON 时回退）
│   └── profile/data/profile.ts   ← 个人信息 + 社交链接
└── i18n/messages/           ← 中英文文案（zh.ts / en.ts）
```

---

## 常见修改指南

### 替换作品内容（推荐：可视化后台）

日常只需三步，**不用改代码、不用复制 URL**：

1. 打开 [http://localhost:3000/zh/admin](http://localhost:3000/zh/admin)，输入 `.env.local` 中的 `ADMIN_UPLOAD_TOKEN`
2. 新建或编辑作品：上传封面、视频、详情图，填写标题与简介，点 **保存**
3. 删除作品时可选：**仅删记录**（默认，COS 文件保留）或 **勾选后连同 COS 媒体一起删**
4. 刷新前台首页 / 详情页即可看到更新（数据保存在 COS：`site/works/items/{slug}.json` + 索引；`site/works.json` 为兼容镜像）

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
将新图片覆盖 `public/images/portrait-v5.png`：
- 必须是 **RGBA 透明背景 PNG**
- 替换后同步修改 `src/components/sections/HeroSection.tsx` 中的 `width` 和 `height` 为实际像素尺寸

### 修改文案
`src/i18n/messages/zh.ts` 和 `en.ts` 两个文件都要改。

### 修改个人信息 / 社交链接
编辑 `src/features/profile/data/profile.ts`。

### 修改颜色 / 字号
编辑 `src/app/styles/_tokens.css` 顶部的 `:root` 变量。

---

## Hero 首屏层次说明

人物图压在文字前面，依赖透明 PNG 实现人物浮层效果：

```
z-1  文字层（LINE1 实心 + LINE2 空心描边扫光）
z-3  人物图层（透明 PNG，底部居中对齐）
z-4  CTA 按钮（人物图片底边居中）
```

---

## 常用命令

```bash
npm run dev      # 本地开发
npm run build    # 构建（检查是否有错误）
npm run lint     # ESLint 检查
npm run start    # 预览生产构建
npm run migrate:works          # 将 works.json 拆分为 site/works/items/*.json
npm run restore:videos         # 扫描 COS 孤儿视频并生成草稿作品
npm run upload:pick-photos -- --dry-run   # 预览 pick 摄影批量上传
npm run upload:pick-photos                  # 按 pick 子文件夹上传摄影到 COS
npm run upload:cos -- <本地文件> <COS对象键>   # 高级：单独上传媒体文件
```

---

## 腾讯云 COS 配置与上传

视频/大图建议放在 COS，详情页通过 `mediaUrl` 直链播放（`<video src="...">`）。

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

配置后重启 `npm run dev`。

### 3) 作品管理后台

| 路径 | 功能 |
|------|------|
| `/zh/admin` | 口令登录 |
| `/zh/admin/works` | 作品列表（新建 / 编辑 / 删除） |
| `/zh/admin/works/new` | 新建作品表单 |
| `/zh/admin/works/<slug>` | 编辑单条作品 |

表单内上传封面、视频、详情多图后会自动写入 COS，保存时更新 `site/works.json`。

旧地址 `/zh/admin/upload` 会自动跳转到 `/zh/admin`。

### 4) 可选：命令行单独上传大文件

```bash
npm run upload:cos -- ./my-video.mp4 works/videos/brand-campaign.mp4
```

然后在后台编辑作品时，也可直接在表单里选文件上传（无需此命令）。

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
