# 「我能做什么」能力卡片 — 开发备忘

> 与 `.cursor/rules/portfolio-project.mdc` 中「我能做什么」章节同步，供 git 追溯。

## 文件

| 用途 | 路径 |
|------|------|
| 样式 | `src/app/styles/_capabilities.css` |
| 数据 | `src/features/profile/data/capabilities.ts` |
| 网格 + 入场 | `src/components/sections/CapabilitiesGrid.tsx` |
| Section 壳 | `src/components/sections/CapabilitiesSection.tsx` |
| Tilt + glow | `src/components/motion/GravityCapabilityCard.tsx` |

## DOM 结构

```tsx
<div class="capabilities-grid">           <!-- IO 加 is-visible -->
  <div class="cap-entrance cap-entrance-left">   <!-- grid item：入场 -->
    <div class="cap-gravity-card cap-card">      <!-- tilt + 内容 -->
```

入场 transform/opacity 在 wrapper；tilt transform 在内层，**不可合并**。

## 视觉约束

- **默认底**：`linear-gradient(135deg, #1a1a1a, #0d0d0d)` — 勿改 mesh/动画
- **Hover**：`.cap-card-glow` 底部 accent radial mesh，`height: calc(42% * var(--cap-glow))`，无流动动画
- **标签**：`.cap-card-tags` 桌面 `nowrap`，四标签单行（如 Premiere / Lightroom / DaVinci / 分镜脚本）

## 滚动入场

- `IntersectionObserver` threshold `0.25`，进入后加 `is-visible`，unobserve
- 左：`opacity:0` + `translateX(-56px)` → 终态
- 中：`opacity:0` → `1`
- 右：`opacity:0` + `translateX(56px)` → 终态
- 时长 0.65s，三卡同时开始；`prefers-reduced-motion` 直接终态

## Wrapper 尺寸

```css
.cap-entrance { min-width: 0; display: flex; flex-direction: column; align-self: stretch; }
.cap-entrance > .cap-gravity-card { flex: 1; width: 100%; min-height: 383px; }
```
