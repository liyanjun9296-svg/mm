# 后台管理模块完整架构文档

> 本文档覆盖管理后台所有页面、组件、API、数据流、上传流程和视频工作流。供新窗口/新上下文直接使用。

## 一、文件结构总览

```
src/
├── app/[locale]/admin/
│   ├── page.tsx                    ← 登录页（AdminLoginForm）
│   ├── works/
│   │   ├── page.tsx                ← 作品列表（WorksListClient）
│   │   ├── [slug]/page.tsx         ← 编辑作品（WorkEditForm）
│   │   └── batch-photos/page.tsx   ← 批量上传摄影（PhotoBatchUploadForm）
│   └── upload/page.tsx             ← 手动上传（CosUploadForm，legacy）
├── app/api/admin/
│   ├── works/
│   │   ├── route.ts                ← GET(列表) / PUT(全量替换) / POST(批量保存)
│   │   └── [slug]/
│   │       ├── route.ts            ← PUT(单条保存) / DELETE(删除)
│   │       └── status/route.ts     ← GET(视频状态查询)
│   ├── categories/route.ts         ← GET/PUT 视频分类
│   └── dev/pull/route.ts           ← POST 从 COS 拉最新到本地
├── components/admin/
│   ├── WorkEditForm.tsx            ← 编辑表单主组件（729行）
│   ├── WorkEditForm/use-work-upload.ts ← 上传 hook
│   ├── WorksListClient.tsx         ← 列表组件（447行）
│   ├── SortableList.tsx            ← dnd-kit 拖拽排序
│   ├── PhotoBatchUploadForm.tsx    ← 批量摄影上传
│   ├── AdminLoginForm.tsx          ← 登录
│   ├── AdminThumb.tsx              ← 缩略图
│   ├── VideoCategoryManager.tsx    ← 分类管理
│   └── CosUploadForm.tsx           ← 手动上传（legacy）
├── lib/admin/
│   ├── api.ts                      ← barrel re-export
│   ├── keys.ts                     ← slugify + workMediaKey（COS 路径生成）
│   ├── upload.ts                   ← presign 上传管道
│   ├── works-api.ts                ← /api/admin/* fetch 封装
│   └── token.ts                    ← token 存储 + authHeaders
├── lib/cos/
│   ├── server.ts                   ← getPresignedUrl（服务端）
│   ├── env.ts                      ← COS 配置 + getCosPublicUrl
│   ├── upload-keys.ts              ← 路径白名单校验（只允许 works/ 前缀）
│   └── media-keys.ts               ← normalizeWorkMediaUrlsForCos + resolveDeletableMediaKeys
├── lib/dev/
│   └── local-snapshot.ts           ← DEV_USE_LOCAL_SNAPSHOT 读写 .dev-data/works.json
├── features/portfolio/
│   ├── types.ts                    ← WorkItem / WorkCategory / FeaturedLayout
│   └── data/
│       ├── works-store.ts          ← getWorks / saveWorkItemToCos / deleteWorkItemFromCos
│       └── works-store/
│           ├── cos-io.ts           ← putCosJson / deleteCosObject
│           ├── index-store.ts      ← slugs index 管理
│           └── featured.ts         ← featured 位管理
└── scripts/
    ├── process-video.ts            ← CLI: 原片 → 1080p → 上传 → 更新状态
    └── cos-lib.ts                  ← COS SDK client + dotenv 加载
```

## 二、数据模型

```typescript
// src/features/portfolio/types.ts
type WorkCategory = "video" | "photo" | "article";
type FeaturedLayout = "large" | "compact";

type WorkItem = {
  slug: string;              // URL 标识，唯一
  title: string;
  subtitle: string;
  description: string;
  category: WorkCategory;
  subcategory?: string;      // 视频分类（产品/TVC/Vlog 等）
  duration?: string;         // 视频时长（"3:24"）
  coverImage: string;        // 封面 URL
  mediaUrl: string;          // 视频=1080p低档 / 摄影=detail大图 / 文章=封面
  mediaUrlOriginal?: string; // 视频原片 URL（dual 状态时有值）
  role: string;
  year: string;
  platform: string;
  externalUrl?: string;
  detailImages?: string[];   // 详情页素材（图片/MP4 URL 数组）
  featured?: boolean;
  featuredLayout?: FeaturedLayout;
};
```

## 三、认证机制

- **Token**: 环境变量 `ADMIN_UPLOAD_TOKEN`，服务端校验
- **客户端存储**: `sessionStorage.portfolio_admin_token`
- **传递方式**: `Authorization: Bearer <token>` header
- **API 校验**: 每个 route 调 `verifyAdminToken(request)` 检查 header
- **登录**: POST `/api/admin/works`（只检查 header 是否通过 401），成功则存 token

## 四、COS 路径约定

| 类型 | COS Key | 生成方式 |
|------|---------|----------|
| 视频低档 | `works/videos/{slug}.mp4` | CLI `process:video` 产出 |
| 视频原片 | `works/videos/{slug}.original.{ext}` | GUI 上传 kind=`video-original` |
| 封面 | `works/covers/{slug}.detail.webp` | GUI 上传 kind=`cover` |
| 摄影主图 | `works/gallery/{slug}.detail.webp` | GUI 上传 kind=`gallery` |
| 详情图 | `works/gallery/{slug}-{n}.detail.webp` | GUI 上传 kind=`gallery-detail` |
| 详情视频 | `works/gallery/{slug}-{n}.{ext}` | GUI 上传 kind=`gallery-detail`（保留原扩展名）|
| 单条 JSON | `site/works/items/{slug}.json` | saveWorkItemToCos |
| 索引 | `site/works/index.json` | `{ slugs: string[] }` |
| Legacy 镜像 | `site/works.json` | 全量 WorkItem[] |

**路径生成函数**: `workMediaKey(slug, kind, file, detailIndex?)` in `src/lib/admin/keys.ts`

## 五、上传流程

### Presign 直传（唯一路径，无服务端中转）

```
浏览器                          Next.js API                    COS
  │                                │                            │
  ├─ POST /api/cos/presign ───────►│                            │
  │   { key, contentType }         │                            │
  │                                ├─ getPresignedUrl() ───────►│
  │   ◄─ { url, publicUrl } ──────┤                            │
  │                                │                            │
  ├─ XHR PUT url ─────────────────────────────────────────────►│
  │   Headers: Content-Type, Cache-Control(immutable)           │
  │   Body: File                                                │
  │   ◄─ 200 ─────────────────────────────────────────────────┤
  │                                │                            │
  └─ onDone(publicUrl)             │                            │
```

**客户端上传管道**: `useWorkUpload` hook → `uploadFileAdmin` → `uploadViaPresign`

**关键约束**:
- COS key 必须以 `works/` 开头（`upload-keys.ts` 白名单）
- 所有上传带 `Cache-Control: public, max-age=31536000, immutable`
- 视频 >200MB 弹确认，>500MB 拒绝

## 六、视频双状态工作流

### 状态定义

| 状态 | mediaUrl | mediaUrlOriginal | 前台表现 |
|------|----------|------------------|----------|
| none | `""` | `undefined` | 不显示视频区 |
| raw-only | `""` | 有值 | "视频处理中,请稍后再来" |
| dual | 有值 | 有值 | 默认播 1080p，可切原画质 |

### 完整闭环流程（2026-06-04）

```
1. 用户在 /admin/works/new 填标题
2. 选择视频文件 → useWorkUpload → presign 直传 → COS works/videos/{slug}.original.{ext}
3. 上传完成 → onDone 回调:
   a. setWork({ mediaUrlOriginal: url, mediaUrl: "" })
   b. autoSaveAfterVideoUpload(url):
      - 计算 slug = work.slug || slugify(work.title)
      - saveWorkItemAdmin(token, item, { isNew: true })
      - setWork({ slug })   ← 回写真正的 slug
      - setIsNew(false)     ← 后续操作不再以"新建"身份
      - setStatusRefreshKey(k+1) ← 触发 VideoStatusBlock 刷新
4. VideoStatusBlock useEffect 触发:
   - fetch /api/admin/works/{slug}/status
   - 显示 ⚠️ raw-only + CLI 命令输入框
5. 用户粘贴本地路径 → 生成命令 → 复制
6. 终端运行: npm run process:video -- {slug} --local "{path}"
   a. 读本地文件（--local 指定 或 .dev-data/media/ 快照）
   b. ffmpeg 压缩 1080p H.264 CRF23 + AAC 128k
   c. 上传 works/videos/{slug}.mp4 到 COS
   d. saveWorkItemToCos({ ...work, mediaUrl: cosUrl })
   e. persistWorksLocalSnapshot → 写 .dev-data/works.json
7. 用户点「刷新状态」按钮 → fetchWorkStatusAdmin → 显示 ✅ dual
8. 前台刷新 → getWorks() 读 .dev-data/works.json → mediaUrl 有值 → 视频可播放
```

### VideoStatusBlock 组件

位置: `WorkEditForm.tsx` 内部函数组件，line 45-176

Props: `slug, mediaUrl, mediaUrlOriginal, token, refreshKey`

行为:
- 挂载时 + refreshKey 变化时 → fetch 实时状态
- 显示路径输入框 + 命令 code block + 复制按钮 + 刷新状态按钮
- slug 为空或 token 缺失时不请求

## 七、WorkEditForm 状态机

### 关键状态

| 状态 | 类型 | 用途 |
|------|------|------|
| `isNew` | `boolean` (state) | 新建 vs 编辑，autoSave 后变 false |
| `work` | `WorkItem` | 表单完整数据 |
| `saving` | `boolean` | 手动保存中 |
| `autoSaving` | `boolean` | 视频上传后自动保存中 |
| `statusRefreshKey` | `number` | 触发 VideoStatusBlock 重新拉状态 |
| `uploading` | `string` | 当前上传的文件名 |
| `uploadProgress` | `number` | 0-100 |

### 保存逻辑

**手动保存** (`handleSave`):
- 计算 slug
- 校验 slug 唯一性（仅 isNew 时）
- `saveWorkItemAdmin(token, item, { isNew, previousSlug })`
- `previousSlug` = `isNew ? undefined : (slugParam === "new" ? slug : slugParam)`
- 成功后跳转回列表

**自动保存** (`autoSaveAfterVideoUpload`):
- 仅视频原片上传完成后触发
- 计算 slug、构建 item
- `saveWorkItemAdmin(token, item, { isNew, previousSlug })`
- 成功: slug 回写 + `setIsNew(false)` + statusRefreshKey++
- 失败: 提示用户手动保存

### 详情素材多文件上传

- `baseIndex = work.detailImages.length`
- for 循环中每个文件 `idx = baseIndex + offset++`
- 每个文件独立 `handleUpload(f, "gallery-detail", onDone, { detailIndex: idx })`
- `workMediaKey` 生成 `works/gallery/{slug}-{idx}.detail.webp` 或 `.{ext}`（视频）

## 八、API 端点详解

### PUT `/api/admin/works/[slug]`

```
请求: { work: WorkItem, previousSlug?: string }
URL slug 参数: "new"（新建）或 具体 slug（编辑）

逻辑:
1. verifyAdminToken
2. 解析 isNew = (slugParam === "new")
3. 如果 isNew 且 slug 已存在 → 409
4. saveWorkItemToCos(work, { previousSlug })
5. revalidateSiteContent()
6. 返回 { ok: true, slug }
```

### GET `/api/admin/works/[slug]/status`

```
响应: { slug, status: "dual"|"raw-only"|"none", mediaUrl, mediaUrlOriginal }

逻辑:
1. verifyAdminToken
2. fetchWorkItemFromCos(slug)
3. 判断 mediaUrl/mediaUrlOriginal 组合 → 返回状态
```

### PUT `/api/admin/works`（全量替换，带保护）

```
请求: { works: WorkItem[] }
保护: 如果当前库>=3条 且 请求只有1条 且 overlap=0 → 需要 x-admin-confirm-overwrite header，否则 409
```

## 九、数据读写链路

### 写入链路（保存作品）

```
客户端 saveWorkItemAdmin
  → PUT /api/admin/works/{slug}
    → saveWorkItemToCos(item, { previousSlug })
      → persistWorkItem: putCosJson("site/works/items/{slug}.json")
      → getOrCreateIndex + 更新 slugs 数组
      → putCosJson("site/works/index.json")
      → syncLegacyMirror: putCosJson("site/works.json")
      → persistWorksLocalSnapshot(merged):
        → writeLocalWorksSnapshot → .dev-data/works.json（DEV_USE_LOCAL_SNAPSHOT=1 时）
```

### 读取链路（前台页面）

```
前台 getWorks()
  → getWorksRaw():
    → DEV_USE_LOCAL_SNAPSHOT=1 ? readLocalWorksSnapshot (.dev-data/works.json)
    → 否则: fetchWorksFromCos (per-slug 逐个读取)
  → applyDevMediaUrlsToWorks: 将 COS URL 转为 /api/dev/media?key=... 本地代理
```

### 读取链路（后台列表）

```
WorksListClient mount
  → fetchWorksAdmin(token)
    → GET /api/admin/works
      → getWorks()（同上）
```

## 十、SortableList 拖拽排序

- **组件**: `src/components/admin/SortableList.tsx`
- **依赖**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Props**: `items`, `getItemId(item, index)`, `onReorder(newItems)`, `renderItem`
- **key 生成**: `getItemId` 返回值作为 React key 和 dnd-kit ID
- **当前实现**: 详情素材用 `${url}__${index}` 避免重复 URL 冲突
- **注意**: `onReorder` 回调直接传新数组，组件不管持久化

## 十一、已知问题与技术债

1. **autoSaveAfterVideoUpload 时序**:
   - 依赖闭包中的 `work` 状态，如果用户在上传期间修改了其他字段，autoSave 可能覆盖这些修改
   - `setWork` 用了函数式更新来回写 slug，但 `autoSave` 中构建 item 时用的是闭包中的 `work`

2. **isNew 状态转换**:
   - URL 仍是 `/admin/works/new` 但 `isNew` 已变 false
   - 如果用户刷新页面，会重新变成 isNew=true，但 COS 上已有该 slug → 409
   - 理想方案: autoSave 成功后 `router.replace` 到 `/admin/works/{slug}`

3. **详情素材 detailIndex**:
   - 多文件同时上传时 baseIndex 固定（闭包），但如果用户在上传完成前又触发了新一批上传，可能产生 index 冲突
   - COS key 固定 = 会覆盖而不是报错，但列表中会有相同 URL

4. **VideoStatusBlock 首次渲染**:
   - slug 为空时不发请求（正确），但 `work.slug || slugParam` 在新建时 slugParam="new"
   - autoSave 成功后回写 slug → refreshKey++ → 重新请求 → 正常

5. **全量替换保护（409）**:
   - `saveWorksAdmin`（PUT /api/admin/works）有 overlap 检查
   - 单条保存（PUT /api/admin/works/[slug]）只检查 isNew 时的 slug 碰撞

## 十二、环境变量

| 变量 | 用途 |
|------|------|
| `ADMIN_UPLOAD_TOKEN` | 管理后台认证 |
| `COS_SECRET_ID` | COS 密钥 |
| `COS_SECRET_KEY` | COS 密钥 |
| `COS_BUCKET` | `portfolio-gaoxinming-1305428454` |
| `COS_REGION` | `ap-beijing` |
| `DEV_USE_LOCAL_SNAPSHOT` | =1 启用本地快照读写 |

## 十三、CLI 命令

| 命令 | 用途 |
|------|------|
| `npm run process:video -- <slug> --local "<path>"` | 压缩原片 → 上传低档 → 更新 COS + 本地快照 |
| `npm run dev:sync -- --media` | 一次性从 COS 同步所有媒体到 .dev-data/ |
| `npm run cos:report` | 报告 COS 存储状态 |
| `npm run cos:cleanup --apply` | 清理孤儿文件（危险） |
