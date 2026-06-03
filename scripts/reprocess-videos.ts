/**
 * 把所有「单档历史视频」一次性升级为 dual 状态。
 *
 * 用法:
 *   npm run reprocess:videos              # dry-run 列表
 *   npm run reprocess:videos -- --apply   # 实际执行
 *   npm run reprocess:videos -- --apply --slug=xxx  # 仅对单个 slug
 *
 * 历史视频特征:`mediaUrl` 非空 + `mediaUrlOriginal` 为空。
 *   - 这些视频已通过旧 upload-video 脚本走过 faststart,可直接当原片
 *   - 流程:在 COS 内 copy `works/videos/{slug}.{ext}` → `works/videos/{slug}.original.{ext}`
 *   - 更新作品:mediaUrlOriginal = 原片新 URL
 *   - 调用 processVideo(slug, force=true) 压缩生成 .mp4 低档,覆盖 mediaUrl
 */
import path from "node:path";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createCosClient, requireCosConfig, formatBytes } from "./cos-lib";
import { fetchWorksFromCos } from "../src/features/portfolio/data/works-store";
import { saveWorkItemToCos } from "../src/features/portfolio/data/works-store";
import { cosKeyFromPublicUrl } from "../src/lib/cos/media-keys";
import { getCosPublicUrl } from "../src/lib/cos/env";
import { processVideo } from "./process-video";

async function copyCosObject(srcKey: string, destKey: string): Promise<void> {
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();
  await new Promise<void>((res, rej) => {
    cos.putObjectCopy(
      {
        Bucket: bucket,
        Region: region,
        Key: destKey,
        CopySource: `${bucket}.cos.${region}.myqcloud.com/${encodeURI(srcKey)}`,
      },
      (err) => (err ? rej(err) : res()),
    );
  });
}

async function headObject(key: string): Promise<number | null> {
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();
  return new Promise((res) => {
    cos.headObject({ Bucket: bucket, Region: region, Key: key }, (err, data) => {
      if (err || !data) {
        res(null);
        return;
      }
      const len = Number(data.headers?.["content-length"] ?? 0);
      res(len);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const force = args.includes("--force");
  const slugFilter = args.find((a) => a.startsWith("--slug="))?.slice("--slug=".length);

  const allWorks = await fetchWorksFromCos();
  if (!allWorks) {
    throw new Error("无法从 COS 读取作品列表");
  }

  const candidates = allWorks.filter((w) => {
    if (w.category !== "video") return false;
    if (slugFilter && w.slug !== slugFilter) return false;
    if (force) return true;
    // 历史视频:有 mediaUrl 但无 mediaUrlOriginal
    return Boolean(w.mediaUrl) && !w.mediaUrlOriginal;
  });

  console.log(`找到 ${candidates.length} 个待迁移视频:`);
  for (const w of candidates) {
    const k = cosKeyFromPublicUrl(w.mediaUrl);
    const size = k ? await headObject(k) : null;
    console.log(`  - ${w.slug} (${k ?? w.mediaUrl}) ${size ? formatBytes(size) : "?"}`);
  }

  if (!apply) {
    console.log("\n[dry-run] 加 --apply 实际执行");
    return;
  }

  for (const work of candidates) {
    console.log(`\n=== 处理 ${work.slug} ===`);
    const oldKey = cosKeyFromPublicUrl(work.mediaUrl);
    if (!oldKey) {
      console.warn(`  ⚠️  mediaUrl 不是合法 COS URL,跳过: ${work.mediaUrl}`);
      continue;
    }

    const ext = path.extname(oldKey) || ".mp4";
    const originalKey = `works/videos/${work.slug}.original${ext}`;

    // Step 1: 在 COS 内复制 → .original.{ext}
    if ((await headObject(originalKey)) !== null && !force) {
      console.log(`  ✓ ${originalKey} 已存在,跳过 copy`);
    } else {
      console.log(`  copy ${oldKey} → ${originalKey}`);
      await copyCosObject(oldKey, originalKey);
    }

    // Step 2: 更新作品 mediaUrlOriginal,清空 mediaUrl 让 processVideo 跑下去
    const originalUrl = getCosPublicUrl(originalKey);
    const patched = { ...work, mediaUrlOriginal: originalUrl, mediaUrl: "" };
    await saveWorkItemToCos(patched);
    console.log(`  ✓ 已写入 mediaUrlOriginal = ${originalUrl}`);

    // Step 3: 运行 processVideo(slug, force=true) 压缩低档
    try {
      await processVideo(work.slug, true);
    } catch (err) {
      console.error(`  ❌ processVideo 失败: ${err instanceof Error ? err.message : err}`);
      console.error(`     已保留 .original 与作品 mediaUrlOriginal,稍后可手动 npm run process:video -- ${work.slug}`);
    }
  }

  console.log("\n✅ 全部完成");
}

main().catch((err) => {
  console.error("\n失败:", err instanceof Error ? err.message : err);
  process.exit(1);
});
