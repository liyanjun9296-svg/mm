import { revalidatePath, revalidateTag } from "next/cache";
import {
  PHOTO_CATEGORIES_CACHE_TAG,
  VIDEO_CATEGORIES_CACHE_TAG,
  WORKS_CACHE_TAG,
} from "@/features/portfolio/constants";

/** 后台保存作品/分类后，刷新首页等页面的 COS 数据缓存 */
export function revalidateSiteContent() {
  revalidateTag(WORKS_CACHE_TAG, "max");
  revalidateTag(VIDEO_CATEGORIES_CACHE_TAG, "max");
  revalidateTag(PHOTO_CATEGORIES_CACHE_TAG, "max");
  revalidatePath("/zh", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/zh/portfolio", "layout");
  revalidatePath("/en/portfolio", "layout");
}
