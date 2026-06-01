/**
 * 将 COS 作品 JSON 中的 /api/dev/media?key=... 还原为公网 URL。
 *
 * 用法：npm run fix:dev-media-urls
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import type { WorkItem } from "../src/features/portfolio/types";
import { cosKeyFromDevMediaUrl } from "../src/lib/cos/media-keys";

function hasDevMediaUrl(work: WorkItem): boolean {
  const urls = [work.coverImage, work.mediaUrl, ...(work.detailImages ?? [])];
  return urls.some((url) => url && cosKeyFromDevMediaUrl(url));
}

async function main() {
  const { fetchWorksFromCos, saveAllWorkItemsToCos } = await import(
    "../src/features/portfolio/data/works-store"
  );
  const { normalizeWorkMediaUrlsForCos } = await import("../src/lib/cos/media-keys");

  const works = (await fetchWorksFromCos()) ?? [];
  if (works.length === 0) {
    console.log("COS 无作品数据，退出。");
    return;
  }

  const affected = works.filter(hasDevMediaUrl);
  if (affected.length === 0) {
    console.log("未发现 /api/dev/media URL，无需修复。");
    return;
  }

  console.log(`待修复 ${affected.length} 条：`);
  for (const w of affected) {
    console.log(`  - ${w.slug} (${w.title})`);
  }

  const normalized = works.map(normalizeWorkMediaUrlsForCos);
  await saveAllWorkItemsToCos(normalized);
  console.log("已写回 COS（per-slug + index + site/works.json）。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
