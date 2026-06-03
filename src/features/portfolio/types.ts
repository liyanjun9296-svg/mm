export type WorkCategory = "video" | "photo" | "article";

export type FeaturedLayout = "large" | "compact";

export type WorkItem = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: WorkCategory;
  subcategory?: string;
  duration?: string;
  coverImage: string;
  /**
   * 视频:1080p H.264 低档(默认播放,流量友好)。
   *   - 空字符串 = raw-only 待处理(原片已传到 mediaUrlOriginal,需 CLI `npm run process:video -- <slug>` 压缩生成)。
   *   - 非空 = dual 状态,前台正常播。
   * 摄影/文章:detail 大图 URL,始终非空。
   */
  mediaUrl: string;
  /** 视频专用:faststart 后的原片 URL(`{slug}.original.{ext}`),CLI process 完成后填入。dual 状态切「原画质」用。 */
  mediaUrlOriginal?: string;
  role: string;
  year: string;
  platform: string;
  externalUrl?: string;
  detailImages?: string[];
  featured?: boolean;
  featuredLayout?: FeaturedLayout;
};

