import type { WorkCategory, WorkItem } from "@/features/portfolio/types";

/** 仅重排指定分类条目，保留其它分类在全局 slugs 中的相对位置 */
export function reorderCategoryInWorks(
  allWorks: WorkItem[],
  category: WorkCategory,
  newCategoryOrder: WorkItem[],
): WorkItem[] {
  let i = 0;
  return allWorks.map((w) =>
    w.category === category ? newCategoryOrder[i++]! : w,
  );
}

export function reorderPhotosInWorks(
  allWorks: WorkItem[],
  newPhotoOrder: WorkItem[],
): WorkItem[] {
  return reorderCategoryInWorks(allWorks, "photo", newPhotoOrder);
}

export function reorderVideosInWorks(
  allWorks: WorkItem[],
  newVideoOrder: WorkItem[],
): WorkItem[] {
  return reorderCategoryInWorks(allWorks, "video", newVideoOrder);
}
