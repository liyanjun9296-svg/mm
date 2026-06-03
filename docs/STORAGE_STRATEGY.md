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
- 历史「单档」视频迁移:`npm run reprocess:videos -- --apply`

图片三档语义：
- `detail` 档 = **legacy 原文件**（原扩展名、原画质，无任何二次压缩，详情页直接使用）
- `list` 档 = `.list.webp`（约 1200w / q=85，列表/卡片用）
- `admin` 档 = `.admin.webp`（约 120w / q=80，后台缩略用）

JSON 中 `coverImage` / `mediaUrl` / `detailImages[]` 存 **detail（原图）URL**；列表与后台通过 `mediaVariantUrl()` 推导 list / admin URL（见 `src/lib/cos/media-variants.ts`）。后台上传时浏览器端同时压缩并上传 list/admin 两档；若任一档失败，由 `npm run cos:migrate-images -- --apply` 在服务端 `sharp` 兜底补齐。

> 不再依赖数据万象 imageView2。前端不会拼 `imageView2` 参数，列表/缩略图全部命中物理 webp 对象。早期版本产生的 `*.detail.webp` 已废弃，可由 `npm run cos:prune-orphans -- --apply` 清理。

静态站点资源（不进 COS）：`public/images/portrait.png`（桌面 Hero）、`hero-avatar-375.png`（移动 Hero）、`about-portrait.png`、`logo.svg`。

## 读写路径（代码）

| 操作 | 实现 |
|------|------|
| 前台列表/详情 | `getWorks()` → `works-store.ts` |
| 后台列表/保存/删 | `/api/admin/works` + `saveWorkItemToCos` / `deleteWorkItemFromCos` |
| 上传 ≤50MB | `POST /api/cos/upload`（服务端中转） |
| 上传 >50MB | `POST /api/cos/presign` → 浏览器 PUT COS（需 Bucket CORS） |
| 固定媒体 Key | `workMediaKey(slug, kind, file)` in `lib/admin/api.ts` |
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
