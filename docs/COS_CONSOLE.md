# 腾讯云 COS 控制台配置清单

按顺序完成以下步骤后，即可在本地使用 `npm run upload:cos` 或 `/zh/admin/upload` 上传作品资源。

## 1. 创建存储桶

1. 打开 [COS 控制台](https://console.cloud.tencent.com/cos)
2. **创建存储桶**
   - **地域**：选择离访客近的 region（如 `ap-guangzhou`），创建后不可修改
   - **访问权限**：**公有读私有写**
   - **版本控制**：**建议开启**（误覆盖 `site/works.json` 或作品条目时可还原历史版本）

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

将输出的 URL 填入 `src/features/portfolio/data/works.ts`。
