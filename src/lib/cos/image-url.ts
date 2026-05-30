/** COS 数据万象缩图预设（列表用，详情页仍用原图） */
export type CosImagePreset = "grid" | "card" | "thumb";

const PRESET_PARAMS: Record<CosImagePreset, string> = {
  /** 摄影瀑布流：1200px 宽，85 质量，兼顾清晰与体积 */
  grid: "imageView2/2/w/1200/q/85",
  /** 首页精品卡片 */
  card: "imageView2/2/w/1000/q/85",
  /** 小预览 */
  thumb: "imageView2/2/w/640/q/82",
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|heif|bmp|tiff?)$/i;
const CI_PARAM = /[?&](imageView2|imageMogr2)/;

function isOptimizableCosImage(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    if (!IMAGE_EXT.test(pathname)) {
      return false;
    }
    return hostname.includes(".cos.") || hostname.endsWith(".myqcloud.com");
  } catch {
    return false;
  }
}

/** 为 COS 图片 URL 追加数据万象缩图参数；非 COS 或已有处理参数则原样返回 */
export function cosOptimizedImageUrl(url: string, preset: CosImagePreset = "grid"): string {
  if (!url || !isOptimizableCosImage(url) || CI_PARAM.test(url)) {
    return url;
  }
  const param = PRESET_PARAMS[preset];
  return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
}
