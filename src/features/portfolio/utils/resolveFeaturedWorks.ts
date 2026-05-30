import type { FeaturedLayout, WorkItem } from "../types";

export type FeaturedDisplayGroup = {
  large: WorkItem[];
  compact: WorkItem[];
  usingFallback: boolean;
};

export function resolveFeaturedWorks(works: WorkItem[]): FeaturedDisplayGroup {
  const marked = works.filter((w) => w.featured);
  if (marked.length > 0) {
    return {
      large: marked.filter((w) => w.featuredLayout !== "compact").slice(0, 2),
      compact: marked.filter((w) => w.featuredLayout === "compact").slice(0, 4),
      usingFallback: false,
    };
  }

  const videos = works.filter((w) => w.category === "video");
  return {
    large: videos.slice(0, 2).map((work) => withLayout(work, "large")),
    compact: videos.slice(2, 6).map((work) => withLayout(work, "compact")),
    usingFallback: videos.length > 0,
  };
}

function withLayout(work: WorkItem, layout: FeaturedLayout): WorkItem {
  return { ...work, featuredLayout: layout };
}
