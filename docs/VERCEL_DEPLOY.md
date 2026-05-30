# Vercel 部署 + 自定义域名

仓库：[liyanjun9296-svg/mm](https://github.com/liyanjun9296-svg/mm)（根目录即 Next.js 项目，**Root Directory 留空**）

## 方式 A：Vercel 网页（推荐首次）

1. 登录 [vercel.com](https://vercel.com) → **Add New → Project** → Import `liyanjun9296-svg/mm`
2. **Environment Variables** 填入 `.env.local` 中 7 项（见 `.env.local.example`）
3. **Deploy** → 记下 `https://<项目名>.vercel.app`
4. **Settings → Domains** 添加根域名与 `www`
5. 在域名注册商 DNS 添加：

| 主机记录 | 类型 | 值 |
|----------|------|-----|
| `@` | A | `76.76.21.21` |
| `www` | CNAME | `cname.vercel-dns.com` |

6. 更新 COS CORS（>50MB 直传需要）：

```bash
SITE_DOMAIN=yourdomain.com VERCEL_URL=<项目名>.vercel.app npm run cos:cors
```

## 方式 B：CLI 一键（本地已配 .env.local）

```bash
npx vercel login          # 浏览器授权，只需一次
npx vercel link           # 链接到 GitHub 仓库对应项目
bash scripts/push-vercel-env.sh
npm run deploy:vercel
bash scripts/add-vercel-domains.sh yourdomain.com
SITE_DOMAIN=yourdomain.com npm run cos:cors
```

## 环境变量清单

| 变量 | 说明 |
|------|------|
| `COS_SECRET_ID` / `COS_SECRET_KEY` | 腾讯云 API 密钥 |
| `COS_BUCKET` / `COS_REGION` | 存储桶 |
| `COS_PUBLIC_BASE_URL` | COS 公网访问域名 |
| `NEXT_PUBLIC_COS_PUBLIC_BASE_URL` | 同上（前端 + next/image 白名单） |
| `ADMIN_UPLOAD_TOKEN` | `/zh/admin` 登录口令 |

修改 env 后需在 Vercel **Redeploy**（`next.config.ts` 构建期读取 COS 域名）。

## 上线验收

- `https://<域名>/zh` — 首页
- `https://<域名>/zh/portfolio` — 作品集（COS 媒体）
- `https://<域名>/zh/admin` — 管理后台

## 常见问题

| 现象 | 处理 |
|------|------|
| 图片不显示 | 检查 `NEXT_PUBLIC_COS_PUBLIC_BASE_URL` 与 COS 公有读 |
| 域名 Pending | 核对 DNS A/CNAME 与 Vercel Domains 提示 |
| 大文件上传失败 | 运行 `npm run cos:cors` 加入生产域名 |
