/**
 * COS 存储用量报告（当前对象 + 引用/孤儿统计）
 *
 * 用法：npm run cos:report
 *       npm run cos:report -- --json
 */
import {
  createCosClient,
  formatBytes,
  isPrunableMediaKey,
  listCurrentObjects,
  loadReferencedMediaKeys,
  parseArgs,
  requireCosConfig,
  summarizeByPrefix,
} from "./cos-lib";

async function main() {
  const { json } = parseArgs(process.argv.slice(2));
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();

  const [objects, { works, keys: referenced }] = await Promise.all([
    listCurrentObjects(cos, bucket, region),
    loadReferencedMediaKeys(),
  ]);

  let totalBytes = 0;
  let referencedBytes = 0;
  let orphanBytes = 0;
  const orphans: { key: string; size: number }[] = [];

  for (const o of objects) {
    totalBytes += o.Size;
    if (!isPrunableMediaKey(o.Key)) continue;
    if (referenced.has(o.Key)) {
      referencedBytes += o.Size;
    } else {
      orphanBytes += o.Size;
      orphans.push({ key: o.Key, size: o.Size });
    }
  }

  orphans.sort((a, b) => b.size - a.size);

  const byPrefix = summarizeByPrefix(objects);
  const videoWorks = works.filter((w) => w.category === "video").length;
  const photoWorks = works.filter((w) => w.category === "photo").length;

  const report = {
    bucket,
    region,
    worksCount: works.length,
    videoWorks,
    photoWorks,
    referencedKeys: referenced.size,
    objectCount: objects.length,
    totalBytes,
    referencedMediaBytes: referencedBytes,
    orphanMediaBytes: orphanBytes,
    orphanMediaCount: orphans.length,
    byPrefix: Object.fromEntries(
      Object.entries(byPrefix)
        .sort((a, b) => b[1].bytes - a[1].bytes)
        .map(([p, s]) => [p, { count: s.count, bytes: s.bytes }]),
    ),
    topOrphans: orphans.slice(0, 15).map((o) => ({ key: o.key, bytes: o.size })),
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`\nCOS 存储报告 — ${bucket} (${region})\n`);
  console.log(`作品条目: ${works.length}（视频 ${videoWorks} · 摄影 ${photoWorks}）`);
  console.log(`引用的媒体 Key: ${referenced.size}`);
  console.log(`当前对象总数: ${objects.length}`);
  console.log(`总存储（当前版本）: ${formatBytes(totalBytes)}`);
  console.log(`  已引用媒体: ${formatBytes(referencedBytes)}`);
  console.log(`  孤儿媒体:   ${formatBytes(orphanBytes)}（${orphans.length} 个）\n`);

  console.log("按目录:");
  for (const [prefix, stat] of Object.entries(report.byPrefix)) {
    console.log(`  ${prefix.padEnd(26)} ${String(stat.count).padStart(5)} 个  ${formatBytes(stat.bytes)}`);
  }

  if (orphans.length > 0) {
    console.log("\n最大孤儿文件（前 15）:");
    for (const o of orphans.slice(0, 15)) {
      console.log(`  ${formatBytes(o.size).padStart(8)}  ${o.key}`);
    }
    console.log(`\n可运行 npm run cos:prune-orphans 预览删除，确认后加 -- --apply`);
  } else {
    console.log("\n未发现孤儿媒体文件。");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
