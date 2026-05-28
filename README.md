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
│   ├── portfolio/data/works.ts    ← 作品数据（在这里替换内容）
│   └── profile/data/profile.ts   ← 个人信息 + 社交链接
└── i18n/messages/           ← 中英文文案（zh.ts / en.ts）
```

---

## 常见修改指南

### 替换作品内容
编辑 `src/features/portfolio/data/works.ts`，每条作品包含：

```ts
{
  slug: "唯一标识",
  title: "作品名称",
  category: "video" | "photo",
  subcategory: "产品" | "AI" | "校园",  // 仅视频
  coverImage: "图片URL",
  description: "描述",
  duration: "3:20",   // 仅视频
  role: "拍摄 / 剪辑",
  year: "2024",
  platform: "抖音 / 小红书",
}
```

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
```

---

## 常见问题

### 图片替换后页面没变化

如果替换了人物图但页面看起来没更新，优先检查：

- `HeroSection.tsx` 中引用的文件名是否和你替换的文件一致
- 是否用了新文件名（可规避图片缓存）
- 浏览器是否强刷（`Cmd/Ctrl + Shift + R`）
