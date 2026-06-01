import type { WorkItem } from "@/features/portfolio/types";

/** 仅重排摄影条目，保留视频/文章在全局 slugs 中的相对位置 */
export function reorderPhotosInWorks(
  allWorks: WorkItem[],
  newPhotoOrder: WorkItem[],
): WorkItem[] {
  let i = 0;
  return allWorks.map((w) =>
    w.category === "photo" ? newPhotoOrder[i++]! : w,
  );
}
