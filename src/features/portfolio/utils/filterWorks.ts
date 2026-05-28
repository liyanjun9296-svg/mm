import type { WorkCategory, WorkItem } from "../types";

export type WorkFilter = WorkCategory | "all";

export function filterWorks(works: WorkItem[], filter: WorkFilter): WorkItem[] {
  if (filter === "all") {
    return works;
  }

  return works.filter((work) => work.category === filter);
}

export function getWorkBySlug(works: WorkItem[], slug: string): WorkItem | undefined {
  return works.find((work) => work.slug === slug);
}

