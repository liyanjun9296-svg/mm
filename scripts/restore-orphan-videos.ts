/**
 * 扫描 COS works/videos/ 中未登记的视频，生成草稿作品（追加，不删现有条目）
 *
 * 用法：npm run restore:videos
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import COS from "cos-nodejs-sdk-v5";
import type { WorkItem } from "../src/features/portfolio/types";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
const SKIP_NAME = /^(test-|diag-|cos-api)/i;

function titleFromKey(key: string): string {
  const base = key.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "视频作品";
  const cleaned = base
    .replace(/^\d+-/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return cleaned || "视频作品";
}

function timestampFromKey(key: string): number | null {
  const name = key.split("/").pop() ?? "";
  const m = name.match(/^(\d{13})/);
  return m ? Number(m[1]) : null;
}

function slugFromKey(key: string): string {
  const ts = timestampFromKey(key) ?? Date.now();
  const name = key.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "video";
  const safe = name
    .toLowerCase()
    .replace(/^\d+-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `restored-${ts}${safe ? `-${safe}` : ""}`;
}

async function main() {
  const bucket = process.env.COS_BUCKET!;
  const region = process.env.COS_REGION!;
  const publicBase = (
    process.env.COS_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_COS_PUBLIC_BASE_URL ??
    `https://${bucket}.cos.${region}.myqcloud.com`
  ).replace(/\/+$/, "");

  const cos = new COS({
    SecretId: process.env.COS_SECRET_ID!,
    SecretKey: process.env.COS_SECRET_KEY!,
  });

  const { getWorks, saveWorkItemToCos } = await import("../src/features/portfolio/data/works-store");

  const listVideos = (): Promise<COS.CosObject[]> =>
    new Promise((resolve, reject) => {
      cos.getBucket(
        { Bucket: bucket, Region: region, Prefix: "works/videos/", MaxKeys: 200 },
        (err, data) => {
          if (err) reject(err);
          else resolve((data.Contents ?? []).filter((o) => o.Key && !o.Key.endsWith("/")));
        },
      );
    });

  const listCovers = (): Promise<COS.CosObject[]> =>
    new Promise((resolve, reject) => {
      cos.getBucket(
        { Bucket: bucket, Region: region, Prefix: "works/covers/", MaxKeys: 200 },
        (err, data) => {
          if (err) reject(err);
          else resolve((data.Contents ?? []).filter((o) => o.Key && !o.Key.endsWith("/")));
        },
      );
    });

  const [videos, covers, existing] = await Promise.all([
    listVideos(),
    listCovers(),
    getWorks(),
  ]);

  const referenced = new Set<string>();
  for (const w of existing) {
    if (w.mediaUrl) referenced.add(w.mediaUrl);
    if (w.coverImage) referenced.add(w.coverImage);
  }

  const candidates = videos
    .filter((v) => {
      const key = v.Key!;
      const name = key.split("/").pop() ?? "";
      const size = Number(v.Size ?? 0);
      return size > 1000 && VIDEO_EXT.test(name) && !SKIP_NAME.test(name);
    })
    .sort((a, b) => (b.LastModified ?? "").localeCompare(a.LastModified ?? ""));

  const seenSize = new Set<number>();
  const orphans = candidates.filter((v) => {
    const url = `${publicBase}/${v.Key}`;
    if (referenced.has(url)) return false;
    const size = Number(v.Size ?? 0);
    if (seenSize.has(size) && size > 10_000_000) return false;
    seenSize.add(size);
    return true;
  });

  if (orphans.length === 0) {
    console.log("未发现未登记的视频文件");
    return;
  }

  function findCover(videoKey: string): string {
    const vts = timestampFromKey(videoKey);
    if (!vts) {
      return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
    }
    let best: COS.CosObject | null = null;
    let bestDiff = Infinity;
    for (const c of covers) {
      const cts = timestampFromKey(c.Key!);
      if (!cts) continue;
      const diff = Math.abs(cts - vts);
      if (diff < bestDiff && diff < 600_000) {
        bestDiff = diff;
        best = c;
      }
    }
    if (best?.Key) {
      return `${publicBase}/${best.Key}`;
    }
    return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
  }

  const existingSlugs = new Set(existing.map((w) => w.slug));
  const drafts: WorkItem[] = orphans.map((v, index) => {
    let slug = slugFromKey(v.Key!);
    while (existingSlugs.has(slug)) {
      slug = `${slug}-${index}`;
    }
    existingSlugs.add(slug);

    const mediaUrl = `${publicBase}/${v.Key}`;
    return {
      slug,
      title: titleFromKey(v.Key!),
      subtitle: "待补充",
      description: "从 COS 自动恢复的草稿，请在后台补充简介与分类。",
      category: "video" as const,
      subcategory: "产品",
      duration: "",
      coverImage: findCover(v.Key!),
      mediaUrl,
      role: "待补充",
      year: new Date().getFullYear().toString(),
      platform: "",
      featured: index < 6,
      featuredLayout: index < 2 ? ("large" as const) : index < 6 ? ("compact" as const) : undefined,
    };
  });

  for (const item of drafts) {
    await saveWorkItemToCos(item);
    console.log(`+ ${item.slug} | ${item.title}`);
  }

  console.log(`\n已恢复 ${drafts.length} 条视频草稿（含首页精品前 6 条）`);
  console.log("请在 /zh/admin/works 中编辑标题与简介");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
