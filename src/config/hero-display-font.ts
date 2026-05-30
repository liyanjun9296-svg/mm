/** Hero 两行大字字体预设 — 只影响 .hero-line1 / .hero-line2 */

export const HERO_DISPLAY_FONT_PRESETS = [
  "helvetica",
  "fraunces",
  "eczar",
  "playfair-display",
  "young-serif",
  "instrument-serif",
  "syne",
  "space-grotesk",
  "cormorant",
  "geist-refined",
] as const;

export type HeroDisplayFontPreset = (typeof HERO_DISPLAY_FONT_PRESETS)[number];

/** 改这里切换默认字体；或在首页 URL 加 ?heroFont=fraunces 临时预览 */
export const DEFAULT_HERO_DISPLAY_FONT: HeroDisplayFontPreset = "helvetica";

export function resolveHeroDisplayFont(input?: string | null): HeroDisplayFontPreset {
  if (input && HERO_DISPLAY_FONT_PRESETS.includes(input as HeroDisplayFontPreset)) {
    return input as HeroDisplayFontPreset;
  }
  return DEFAULT_HERO_DISPLAY_FONT;
}

export const HERO_DISPLAY_FONT_LABELS: Record<HeroDisplayFontPreset, string> = {
  helvetica: "Helvetica — 经典瑞士无衬线（系统字体）",
  fraunces: "Fraunces — 软衬线·手作有机感·可很粗",
  eczar: "Eczar — 书法感衬线·偏手写笔触",
  "playfair-display": "Playfair Display — 高对比粗衬线",
  "young-serif": "Young Serif — 厚重展示衬线",
  "instrument-serif": "Instrument Serif — 高级编辑感",
  syne: "Syne — 现代创意",
  "space-grotesk": "Space Grotesk — 利落 grotesk",
  cormorant: "Cormorant Garamond — 轻奢杂志",
  "geist-refined": "Geist 精调 — 不换字体只降字重",
};
