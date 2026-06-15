# 响应式适配文档

本文档是 portfolio-site 所有断点与响应式策略的唯一权威来源。

---

## 断点总览（2026-06-15 定稿）

| 档位 | 范围 | 策略 |
|------|------|------|
| 移动端 | ≤ 1023px | 移动端布局（汉堡菜单、单列、圆头像等） |
| 小屏桌面 | 1024 – 1439px | 分段 zoom 缩放（1024–1199: 0.75，1200–1439: 0.88） |
| 正常桌面 | ≥ 1440px | 基准设计，`.container` 固定 1200px，两侧自然留白 |

> 设计基准宽：**1440px**（zoom 基准）  
> `.container` 固定宽度：**1200px**  
> 移动端设计锚点：**375/390px**

---

## 核心原则

1. **≥ 1440px**：所有内容固定 1200px（`.container`），字号/间距/卡片尺寸全部使用固定 px 值（不允许 clamp/vw 缩放）
2. **1024–1439px**：分段固定 zoom 缩放（1024–1199: 0.75，1200–1439: 0.88），视觉上等同于 1440px 布局的等比缩小版
3. **< 1024px**：触发移动端样式，独立布局

---

## 小屏桌面缩放（1024–1439px）

**文件**：`src/app/styles/_tokens.css`

分两段固定 zoom（`zoom` 不支持 `calc()`）：

```css
/* 1024–1199px: zoom 0.75 */
@media (min-width: 1024px) and (max-width: 1199px) {
  html {
    zoom: 0.75 !important;
  }
}
/* 1200–1439px: zoom 0.88 */
@media (min-width: 1200px) and (max-width: 1439px) {
  html {
    zoom: 0.88 !important;
  }
}
```

---

## 移动端断点（≤ 1023px）

所有 CSS 文件统一使用 `@media (max-width: 1023px)` 触发移动端样式。

### 各模块处理

| 文件 | 主要处理 |
|------|---------|
| `_tokens.css` | `--section-padding-y` 改 clamp、`.container` 改 padding |
| `_nav.css` | 隐藏 `.menu`、`.nav-cta`；显示汉堡菜单 |
| `_hero.css` | 圆头像；隐藏大图；文字左对齐；双 CTA 横排满宽 |
| `_capabilities.css` | grid 单列；卡片 height auto |
| `_about.css` | 双列 → 单列 |
| `_contact.css` | 单列；Modal 底部 sheet |
| `_portfolio.css` | 视频/摄影 grid 单列 |
| `_section-header.css` | 标题字号缩小 |
| `_viral-hits.css` | metrics grid 2列 |

---

## 桌面端字号规则

桌面端（≥ 1440px）**全部使用固定 px 值**，禁止 `clamp()` 或 `vw` 单位：

| 位置 | 固定值 |
|------|--------|
| Hero line1 | 130px |
| Hero line2 | 114px |
| Hero helvetica line1 | 148px |
| Hero helvetica line2 | 122px |
| Hero 其他字体 line2 | 108px |
| Section header title | 56px |
| Portfolio section-title | 34px |
| Contact 标题 | 50px |
| `.container` | 1200px（固定） |

---

## 图片资源

| 图片 | 使用场景 |
|------|---------|
| `public/images/portrait.png` | Hero 桌面大图（≥ 1440px） |
| `public/images/hero-avatar-375.png` | Hero 移动端圆头像（≤ 1023px） |
| `public/images/about-portrait.png` | 关于我左栏 |

---

## 相关文档

- `cos-ops.mdc` — COS 存储与上线纪律
- `docs/STORAGE_STRATEGY.md` — 存储策略主文档
