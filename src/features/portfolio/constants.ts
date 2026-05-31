export const WORKS_JSON_KEY = "site/works.json";
export const WORKS_JSON_BACKUP_KEY = "site/works.json.bak";
export const WORKS_INDEX_KEY = "site/works/index.json";
export const WORKS_ITEM_PREFIX = "site/works/items/";

export const VIDEO_CATEGORIES_JSON_KEY = "site/video-categories.json";
export const PHOTO_CATEGORIES_JSON_KEY = "site/photo-categories.json";

export const WORKS_CACHE_TAG = "portfolio-works";
export const VIDEO_CATEGORIES_CACHE_TAG = "portfolio-video-categories";
export const PHOTO_CATEGORIES_CACHE_TAG = "portfolio-photo-categories";

export const DEFAULT_VIDEO_CATEGORIES = ["产品", "AI", "校园"] as const;
export const DEFAULT_PHOTO_CATEGORIES = ["学生宣传照", "文创", "校园环境", "运动会"] as const;

export const FEATURED_LARGE_MAX = 2;
export const FEATURED_COMPACT_MAX = 4;

export function workItemCosKey(slug: string): string {
  const safe = slug.replace(/[^a-zA-Z0-9-_]/g, "-");
  return `${WORKS_ITEM_PREFIX}${safe}.json`;
}
