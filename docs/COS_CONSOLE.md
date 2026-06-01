# 腾讯云 COS 控制台配置清单

按顺序完成以下步骤后，即可在本地使用 `npm run upload:cos` 或 `/zh/admin/upload` 上传作品资源。

## 1. 创建存储桶

1. 打开 [COS 控制台](https://console.cloud.tencent.com/cos)
2. **创建存储桶**
   - **地域**：选择离访客近的 region（如 `ap-guangzhou`），创建后不可修改
   - **访问权限**：**公有读私有写**
   - **版本控制**：**建议开启**（误覆盖 `site/works.json` 或作品条目时可还原历史版本）
   - **必须配合生命周期**：非当前版本 7 天后自动删除（见下文 §6），否则重复上传会堆叠存储

记录：

- `COS_BUCKET` = 存储桶名称
- `COS_REGION` = 地域英文标识（如 `ap-guangzhou`）

## 2. API 密钥

1. 打开 [访问管理 - API 密钥](https://console.cloud.tencent.com/cam/capi)
2. 建议使用子账号并仅授予 COS 相关权限
3. 记录 `SecretId`、`SecretKey`，写入本机 `.env.local`（不要提交到 Git）

## 3. CORS（仅大于 50MB 的浏览器直传需要）

管理后台上传策略：

| 文件大小 | 上传方式 | 是否需要 CORS |
|----------|----------|---------------|
| ≤50MB（含视频、封面、详情图） | 本站 `POST /api/cos/upload` 中转 | **否** |
| >50MB | 浏览器直传 COS（`POST /api/cos/presign` → PUT） | **是** |

若上传 **超过 50MB** 的视频或大文件，在 Bucket → **安全管理** → **跨域访问 CORS** 中新增规则：

| 配置项 | 建议值 |
|--------|--------|
| 来源 Origin | `http://localhost:3000`、你的生产域名 |
| 操作 Methods | `PUT`, `GET`, `HEAD` |
| Allow-Headers | `*` |
| Expose-Headers | `ETag`, `Content-Length` |
| Max-Age | `600` |

## 4. 测试上传与直链播放

1. 在控制台上传一个测试 `demo.mp4`（Content-Type: `video/mp4`）
2. 复制对象地址，在浏览器无痕窗口打开
3. 能播放 → 权限与编码正常；403 → 检查 Bucket 公有读策略

公网 URL 格式：

```text
https://<BucketName>.cos.<Region>.myqcloud.com/<对象键>
```

对象键示例：`works/videos/demo.mp4`

作品数据（文案 + 媒体链接）存储位置：

| 路径 | 说明 |
|------|------|
| `site/works/items/{slug}.json` | 单条作品（主存储） |
| `site/works/index.json` | slug 索引 |
| `site/works.json` | 兼容镜像（全量列表） |
| `site/works.json.bak` | 保存前自动备份 |

## 5. 与本项目对接

```bash
cp .env.local.example .env.local
# 填写 COS_* 与 ADMIN_UPLOAD_TOKEN
npm run dev
npm run upload:cos -- ./demo.mp4 works/videos/demo.mp4
```

将输出的 URL 填入后台作品表单，或 `/zh/admin/works` 直接上传。

## 6. 存储与流量（作品集 10G 预算）

| 项目 | 说明 |
|------|------|
| **20G 存储包** | 只抵扣**标准存储容量**，不含外网下行流量 |
| **外网流量** | 访客播放视频、加载图片按 GB 另计；开发期反复试播也会消耗 |
| **作品集目标** | 有效内容 ≤ **10 GB**（视频 ≤4G · 摄影 ≤5G · 余量 1G） |

### 6.1 生命周期（必配）

Bucket → **基础配置 → 生命周期**，新增规则：

- 前缀 `works/`、`site/` → **非当前版本** → **7 天后删除**

### 6.2 视频压缩（上传前）

```bash
# 30s 展示片，目标 30–50 MB
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart output.mp4

# 较长作品：720p
ffmpeg -i input.mp4 -vf scale=-2:720 -c:v libx264 -b:v 5M -c:a aac -b:a 128k -movflags +faststart output.mp4
```

### 6.3 运维命令

```bash
npm run cos:report              # 用量与孤儿统计
npm run cos:prune-orphans       # 预览删除未引用媒体（dry-run）
npm run cos:prune-orphans -- --apply
npm run cos:prune-versions      # 预览删除历史版本
npm run cos:cleanup             # 一键预览；加 -- --apply 执行
```

### 6.4 费用告警

[费用中心](https://console.cloud.tencent.com/expense/overview) 开启余额短信提醒，避免欠费 451 停服。

### 6.5 防盗链 Referer 白名单（必配）

公有读 Bucket 直链可被外站热链/爬虫消耗外网下行流量包。**必须**在控制台开启 Referer 白名单：

控制台路径：Bucket → **安全管理** → **防盗链设置** → 启用

| 配置项 | 建议值 |
|--------|--------|
| 类型 | **白名单** |
| 是否允许空 Referer | **允许**（后台 fetch、Next.js Image、`curl`、APP 内播放等场景需要） |
| 域名列表 | `gaoxinming.xyz`、`*.gaoxinming.xyz`、`*.vercel.app`、`localhost`、`127.0.0.1` |

**验证**：

```bash
# 应返回 403（被防盗链拦截）
curl -I -H "Referer: https://evil.com/" \
  https://<bucket>.cos.<region>.myqcloud.com/works/videos/<slug>.mp4

# 应返回 200（白名单域名）
curl -I -H "Referer: https://gaoxinming.xyz/" \
  https://<bucket>.cos.<region>.myqcloud.com/works/videos/<slug>.mp4

# 应返回 200（空 Referer 已允许）
curl -I https://<bucket>.cos.<region>.myqcloud.com/works/videos/<slug>.mp4
```

> 注意：开发期本地 `npm run dev` 的图片/视频 Referer 为 `http://localhost:3000`，已在白名单内。线上部署到自定义域名时记得加入。
