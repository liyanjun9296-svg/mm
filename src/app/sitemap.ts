import type { MetadataRoute } from "next";
import { fetchWorksIndexFromCos } from "@/features/portfolio/data/works-store";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { absoluteUrl, localizedPath } from "@/lib/seo";

const staticPaths = ["", "/portfolio", "/contact"] as const;

function entry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") {
  return {
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

function localizedEntries(path: string, priority: number) {
  return SUPPORTED_LOCALES.map((locale) => entry(localizedPath(locale, path), priority));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    localizedEntries(path, path === "" ? 1 : 0.8),
  );

  const index = await fetchWorksIndexFromCos();
  if (!index) {
    return entries;
  }

  const workEntries = index.slugs.flatMap((slug) =>
    SUPPORTED_LOCALES.map((locale: Locale) => entry(localizedPath(locale, `/works/${slug}`), 0.7)),
  );

  return [...entries, ...workEntries];
}
