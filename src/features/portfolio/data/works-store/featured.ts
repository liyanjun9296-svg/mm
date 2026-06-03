import type { FeaturedLayout, WorkItem } from "../../types";

export function featuredSlot(work: WorkItem): FeaturedLayout {
  return work.featuredLayout === "compact" ? "compact" : "large";
}

export function clearFeatured(work: WorkItem): WorkItem {
  return { ...work, featured: false, featuredLayout: undefined };
}
