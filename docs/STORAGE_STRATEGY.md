# COS 存储策略（作品集主站）

本文档供开发与 Agent 上下文识别：数据放哪、怎么读写、如何控风险。运维细节另见 [COS_CONSOLE.md](./COS_CONSOLE.md)。

## 环境

| 项 | 值 |
|----|-----|
| 生产域名 | `https://gaoxinming.xyz`（Vercel） |
| Bucket | `portfolio-gaoxinming-1305428454` |
| Region | `ap-beijing` |
| 访问模型 | 媒体 **公有读** 直链；写入仅服务端 API + 后台口令 |

## 对象布局

```
Bucket/
├── site/works.json              # 全量镜像（兼容/备份，保存时同步）
├── site/works.json.bak          # 全量保存前的自动备份
├── site/works/index.json        # 索引（version 2）
│   └── slugs: string[]
├── site/works/items/{slug}.json # 单条作品元数据（主数据源）
└── works/
    ├── videos/{slug}.mp4                          # 视频低档(1080p H.264 + faststart,默认播)
    │   videos/{slug}.original.{ext}               #       原片(faststart,后台 GUI 上传写入)
    ├── covers/{slug}.{ext}                       # 封面 detail（原图）
    │   covers/{slug}.{list|admin}.webp           #       压缩两档
    └── gallery/{slug}.{ext}                      # 摄影主图 detail（原图）
        gallery/{slug}.{list|admin}.webp          #          压缩两档
        gallery/{slug}-{n}.{ext}                  # 摄影详情多图 detail（原图）
        gallery/{slug}-{n}.{list|admin}.webp      #              压缩两档
```

视频「双状态」(2026-06):

- `mediaUrl` 非空 + `mediaUrlOriginal` 非空 → **dual**(已上线;前台默认低档,详情页可切原画)
- `mediaUrl` 空 + `mediaUrlOriginal` 非空 → **raw-only**(后台 GUI 已传原片,前台显示「视频处理中」)
- 后台 GUI 上传只写原片;CLI `npm run process:video -- <slug>` 才生成低档转 dual
- **本地优先**(2026-06-04):`process:video` 按以下顺序查找原片,避免不必要的 COS 下行:
  1. `--local <path>` 显式指定本地文件（推荐,零下行）
  2. `.dev-data/media/works/videos/{slug}.original.{ext}` 本地快照（`dev:sync --media` 同步过即有）
  3. 从 COS 公网下载（兜底,会打印流量警告）
- 历史「单档」视频迁移:`npm run reprocess:videos -- --apply`

图片三档语义：
- `detail` 档 = **legacy 原文件**（原扩展名、原画质，无任何二次压缩，详情页直接使用）
- `list` 档 = `.list.webp`（约 1200w / q=85，列表/卡片用）
- `admin` 档 = `.admin.webp`（约 120w / q=80，后台缩略用）

JSON 中 `coverImage` / `mediaUrl` / `detailImages[]` 存 **detail（原图）URL**；`detailImages` 支持图片和 MP4 混排（前台根据后缀自动判断渲染 `<Image>` 或 `<video autoPlay muted loop playsInline>`）。列表与后台通过 `mediaVariantUrl()` 推导 list / admin URL（见 `src/lib/cos/media-variants.ts`）。后台上传时浏览器端同时压缩并上传 list/admin 两档；若任一档失败，由 `npm run cos:migrate-images -- --apply` 在服务端 `sharp` 兜底补齐。

> 不再依赖数据万象 imageView2。前端不会拼 `imageView2` 参数，列表/缩略图全部命中物理 webp 对象。早期版本产生的 `*.detail.webp` 已废弃，可由 `npm run cos:prune-orphans -- --apply` 清理。

静态站点资源（不进 COS）：`public/images/portrait.png`（桌面 Hero）、`hero-avatar-375.png`（移动 Hero）、`about-portrait.png`、`logo.svg`。

## 读写路径（代码）

| 操作 | 实现 |
|------|------|
| 前台列表/详情 | `getWorks()` → `works-store.ts` |
| 后台列表/保存/删 | `/api/admin/works` + `saveWorkItemToCos` / `deleteWorkItemFromCos` |
| 上传（所有文件） | `POST /api/cos/presign` → 浏览器 PUT COS（需 Bucket CORS），自动设置 `Cache-Control: public, max-age=31536000, immutable` |
| 固定媒体 Key | `workMediaKey(slug, kind, file)` in `lib/admin/keys.ts` |
| Key 校验 | `lib/cos/upload-keys.ts`：仅允许 `works/` 前缀 |

### 读取优先级（`getWorksRaw`）

1. **开发快照**：`DEV_USE_LOCAL_SNAPSHOT=1` 且存在 `.dev-data/works.json` → 读本地 JSON
2. **COS**：`site/works/items/*.json` + 索引，或回退旧版 `site/works.json`
3. **种子**：`src/features/portfolio/data/works.ts`（COS 不可达时，日常应为空）

媒体 URL 在快照模式下经 `applyDevMediaUrls` 改写为 `/api/dev/media?key=...`（仅 development）。

### 写入行为

- **单条保存**：写 `site/works/items/{slug}.json`、更新索引、同步 `site/works.json`、可选写 `.dev-data/works.json`
- **全量保存**：备份旧 `works.json` → `works.json.bak`；API 对「单条替换全库」返回 409
- **删除**：默认只删 JSON；勾选 `deleteMedia=1` 才删 `works/` 下媒体（共享 key 会 skip）

## 计费与流量

- **20G 套餐 = 存储容量**，不含 **外网下行**
- 访客播放视频、拉 JSON/图片均计下行；欠费常见 **HTTP 451** → 前台像「没作品」，COS 内数据通常仍在
- **预算**：有效作品媒体建议 ≤ **10 GB**
- **本地省流量**：`DEV_USE_LOCAL_SNAPSHOT=1` + `npm run dev:sync -- --media`（一次性 ~1.4GB 下行），日常 dev 读 `.dev-data/`
- **注意**：后台上传/保存仍写 COS（上行+存储）；避免的是 dev 反复刷新产生的下行

## 安全与风险

### 数据丢失（低概率若遵守流程）

| 风险 | 说明 | 规避 |
|------|------|------|
| 误删作品 | 默认只删记录，视频仍在 COS | 确认是否勾选「删 COS 媒体」 |
| 覆盖上传 | 同 slug 覆盖 `works/.../{slug}.*` | 后台 confirm；建议开 Bucket 版本控制 |
| `seed:works --force` | 整包覆盖 COS 作品 JSON | **勿随意执行** |
| `cos:prune-orphans/cleanup --apply` | 删除未登记对象 | 先 `cos:report`，再 `--apply` |
| `restore:videos` | 孤儿视频登记为草稿 | 勿随意执行 |
| 欠费 451 | 前台读失败 | 控制台续费/告警；进程内最近成功缓存兜底（首次冷启动仍可能回种子） |

### 流量与密钥

| 风险 | 说明 | 规避 |
|------|------|------|
| 公有读被刷下行 | 直链可被外链/爬虫拉取 | 余额告警、**Referer 白名单防盗链**（见 [`COS_CONSOLE.md`](COS_CONSOLE.md) §6.5）、控制视频体积 |
| 口令泄露 | 他人可走你站 API 上传到 `works/` | 长随机 `ADMIN_UPLOAD_TOKEN`；勿提交 `.env.local` |
| SecretId/Key 泄露 | 等同 Bucket 写权限 | 仅 Vercel/本机 env；轮换密钥 |

**无**定时任务自动删 COS；无前端暴露 SecretKey。`CosUploadForm`（时间戳 key）已废弃未挂载。

## 后台使用规范

1. 本机 `npm run dev` → `/zh/admin`，输入 `ADMIN_UPLOAD_TOKEN`
2. **先填 slug/标题，再上传，再保存**
3. 覆盖媒体前确认弹窗
4. 新视频上传后（快照模式）：`npm run dev:sync -- --media --keys works/videos/{slug}.mp4`
5. 线上无「管理」按钮；Vercel 须配置与本地相同的 COS 环境变量

## 常用命令

```bash
npm run cos:report              # 用量、孤儿统计（只读）
npm run cos:prune-orphans       # 预览删孤儿；加 --apply 执行
npm run dev:sync -- --media     # 同步 COS → .dev-data/
npm run dev:sync -- --media --keys works/videos/foo.mp4  # 增量
```

危险（需明确意图）：`seed:works --force`、`restore:videos`、`cos:cleanup --apply`。

## 相关文件

- `src/features/portfolio/data/works-store.ts`
- `src/lib/admin/api.ts`（`workMediaKey`、`confirmMediaOverwrite`）
- `src/lib/dev/local-snapshot.ts`
- `.cursor/rules/cos-ops.mdc`（Agent 常载规则：存储速查 + 流量纪律 + 5/31 事故红线，与本文同步）

---

## 事故记录

### 5/31 首次上线流量爆发（18GB）

- **现象**：首次上线 <12h，COS 外网下行 ~18GB
- **主因**：Vercel `minimumCacheTTL=60s` + 视频卡封面用原图 + `og:image` 落 COS + 本地无快照反复刷
- **修复**：`minimumCacheTTL=31536000`、`layout.tsx` og:image 改本地、视频双状态、图片三档物理 webp
- **沉淀**：上线纪律红线（见 `.cursor/rules/cos-ops.mdc`）

### 6/4 持续流量泄漏（日均 10GB+，存储 <2GB）

- **现象**：上线调试阶段，存储桶不到 2GB，但每天外网下行 10GB+。后台调试和 push 后流量尤为明显
- **根因**：`fetchJsonFromCos()` 使用 `cache: "no-store"` 完全禁用了 Next.js Data Cache，导致：
  - 页面级 `revalidate = 300` 被覆盖，ISR 形同虚设
  - `revalidateTag()` 的 tag 失效机制无意义（根本没有缓存可失效）
  - 每次 SSR 渲染 = 1(index) + N(per-slug) + 1(legacy check) 次 COS 外网下行
  - `/portfolio` 和 `/works/[slug]` 页面缺少 `revalidate` 导出，完全动态渲染
  - 每次 push → Vercel redeploy → 清缓存 → 所有页面重新生成 → 大量 COS 请求
- **修复**（2026-06-04）：
  1. `src/features/portfolio/data/works-store/cos-io.ts`：移除 `cache: "no-store"`，保留 `next: { tags }`，走 Vercel Data Cache + tag 按需失效
  2. `src/features/portfolio/data/categories-store.ts`：同上，两处 fetch 均移除 `no-store`
  3. `src/app/[locale]/portfolio/page.tsx`：新增 `export const revalidate = 300`
  4. `src/app/[locale]/works/[slug]/page.tsx`：新增 `export const revalidate = 3600`
  5. `src/lib/admin/revalidate-site.ts`：补 `PHOTO_CATEGORIES_CACHE_TAG` + `/zh/portfolio` `/en/portfolio` 路径
- **预期效果**：日均 COS 外网下行从 10GB+ 降至 <50MB（仅 ISR 失效或 revalidateTag 后首次访问才打 COS）
- **验证方式**：push 后 24h 观察 COS 控制台外网下行，通过标准 <200MB/天
- **教训**：
  - Next.js 中 `cache: "no-store"` 优先级最高，会完全压制 `next.tags` 和页面级 `revalidate`，两者不可共存
  - 所有从 COS 读数据的 fetch 必须依赖 Data Cache + tag-based 按需失效，不得 `no-store`
  - 新增页面路由时必须设 `export const revalidate`，否则默认动态渲染

### 6/4 补充优化（流量 + 上传体验）

- **关闭 hover 视频预览**：`FeaturedVideoCard.tsx` 的 `canHoverPreview()` 返回 `false`，避免桌面 hover 加载完整视频文件（50-80MB/次）。未来想恢复改一行即可。
- **上传超时修正**：`PRESIGN_PUT_TIMEOUT_MS` 从 120s 改为 600s（10 分钟），支持 300MB+ 视频在低速网络下完成上传。
- **上传进度条**：presign 直传改用 `XMLHttpRequest` + `upload.onprogress` 事件，`WorkEditForm` 显示实时百分比进度条。
- **涉及文件**：
  - `src/components/sections/FeaturedVideoCard.tsx`
  - `src/lib/admin/upload.ts`
  - `src/components/admin/WorkEditForm/use-work-upload.ts`
  - `src/components/admin/WorkEditForm.tsx`
  - `src/app/styles/_admin.css`

### 6/4 视频工作流闭环 + process:video 本地优先

- **问题**：`process:video` 每次从 COS 下载原片（数百MB 下行计费），用户刚从本地上传完原片却还要重新下载一次
- **修复**：
  1. `scripts/process-video.ts`：加入三级本地优先逻辑
     - `--local <path>`：直接指定本地源文件（零下行）
     - `.dev-data/media/{key}`：自动检测本地快照
     - COS 下载：兜底（打印流量警告）
  2. `src/lib/dev/local-snapshot.ts`：`applyDevMediaUrls` 新增 `mediaUrlOriginal` 转换，后台编辑页视频预览在 snapshot 模式下走本地代理
  3. `src/lib/cos/media-keys.ts`：`normalizeWorkMediaUrlsForCos` 新增 `mediaUrlOriginal` 归一化
  4. `WorkEditForm.tsx`：上传原片完成后自动保存到 COS（autoSaveAfterVideoUpload），内页 VideoStatusBlock 立即显示 raw-only 状态 + CLI 命令 + 刷新状态按钮
  5. `WorksListClient.tsx`：视频作品行前增加绿/红圆点状态指示器，点击可复制 CLI 命令并刷新状态
  6. `/api/admin/works/[slug]/status`：直接读 COS 单条作品状态（绕过本地快照）
- **涉及文件**：
  - `scripts/process-video.ts`
  - `src/lib/dev/local-snapshot.ts`
  - `src/lib/cos/media-keys.ts`
  - `src/components/admin/WorkEditForm.tsx`
  - `src/components/admin/WorksListClient.tsx`
  - `src/lib/admin/works-api.ts`
  - `src/lib/admin/api.ts`
  - `src/app/api/admin/works/[slug]/status/route.ts`
  - `src/app/styles/_admin.css`

### 6/4 上传统一 presign + 详情区 MP4 支持 + process:video 零下行强制

- **上传统一 presign**：删除 `uploadViaServer` 和 `SERVER_UPLOAD_MAX` 判断，所有文件均走 presign 直传 COS。presign 签名 + 客户端 PUT 均带 `Cache-Control: public, max-age=31536000, immutable`，浏览器访问后一年内走本地磁盘缓存。
- **process:video 零下行强制**：删除 COS 下载兜底逻辑，本地无文件时直接报错退出。后台 UI 复制按钮强制要求填写本地路径后才可用。
- **状态实时化**：`VideoStatusDot`（列表页）和 `VideoStatusBlock`（编辑页）挂载时自动调 status API 获取 COS 实时状态，不依赖本地快照。
- **本地快照自动更新**：`writeLocalWorksSnapshot` 不再要求 `NODE_ENV=development`，CLI 环境（如 `process:video`）在 `DEV_USE_LOCAL_SNAPSHOT=1` 时也会自动更新 `.dev-data/works.json`。
- **详情区 MP4 支持**：
  - 后台 `accept` 改为 `image/*,video/mp4`，MP4 上传限制 ≤50MB
  - `workMediaKey` 对 gallery-detail 的视频文件保留原始扩展名（不强制 `.webp`）
  - 前台 `VideoDetailGallery` 重写：根据 URL 后缀自动判断 → 图片用 `<Image>`，MP4 用 `<video autoPlay muted loop playsInline>`
  - 无缝竖向拼接布局（`detail-gallery--seamless`），gap:0，宽度 max-width:1200px 居中
- **涉及文件**：
  - `src/lib/admin/upload.ts`
  - `src/lib/cos/server.ts`
  - `scripts/process-video.ts`
  - `src/components/admin/WorkEditForm.tsx`
  - `src/components/admin/WorksListClient.tsx`
  - `src/components/works/VideoDetailGallery.tsx`
  - `src/lib/admin/keys.ts`
  - `src/lib/dev/local-snapshot.ts`
  - `src/app/styles/_portfolio.css`

### 6/4 视频上传自动保存闭环（移除 ProcessVideoModal）

- **变更**：移除 `ProcessVideoModal` 弹窗，所有功能合并到内页 `VideoStatusBlock`
- **闭环流程**：
  1. 用户在编辑页上传原片 → presign 直传 COS（`works/videos/{slug}.original.{ext}`）
  2. 上传完成 → `autoSaveAfterVideoUpload()` 自动将作品保存到 COS（含 `mediaUrlOriginal`），slug 回写到表单
  3. `VideoStatusBlock` 通过 `refreshKey` 自动拉取 COS 实时状态 → 显示 ⚠️ raw-only + CLI 命令
  4. 用户粘贴本地路径 → 复制命令 → 终端运行 `npm run process:video -- <slug> --local "<path>"`
  5. CLI 完成 → `saveWorkItemToCos()` → `persistWorksLocalSnapshot()` 自动写 `.dev-data/works.json`
  6. 用户点内页「刷新状态」按钮 → 显示 ✅ dual
  7. 前台页面刷新 → `getWorks()` 读 `.dev-data/works.json` → 视频可播放
- **移除**：`ProcessVideoModal` 组件、`showProcessModal` / `savedSlug` 状态、`window.alert` 弹窗
- **新增**：`autoSaveAfterVideoUpload` 函数、`statusRefreshKey` 状态、`VideoStatusBlock` 刷新状态按钮
- **涉及文件**：
  - `src/components/admin/WorkEditForm.tsx`
  - `src/components/admin/WorkEditForm/use-work-upload.ts`
