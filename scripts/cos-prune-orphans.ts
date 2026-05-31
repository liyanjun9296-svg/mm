/**
 * 删除未被任何作品引用的 works/ 媒体（videos/gallery/covers）
 *
 * 用法：npm run cos:prune-orphans              # dry-run（默认）
 *       npm run cos:prune-orphans -- --apply    # 执行删除
 */
import {
  createCosClient,
  deleteObjectVersion,
  formatBytes,
  isPrunableMediaKey,
  listCurrentObjects,
  loadReferencedMediaKeys,
  parseArgs,
  requireCosConfig,
} from "./cos-lib";

async function main() {
  const { apply } = parseArgs(process.argv.slice(2));
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();

  const [objects, { keys: referenced }] = await Promise.all([
    listCurrentObjects(cos, bucket, region),
    loadReferencedMediaKeys(),
  ]);

  const orphans = objects.filter(
    (o) => isPrunableMediaKey(o.Key) && !referenced.has(o.Key),
  );
  orphans.sort((a, b) => b.Size - a.Size);

  const totalBytes = orphans.reduce((sum, o) => sum + o.Size, 0);

  console.log(`\n${apply ? "【执行删除】" : "【dry-run 预览】"} 孤儿媒体清理\n`);
  console.log(`将删除: ${orphans.length} 个对象，共 ${formatBytes(totalBytes)}`);
  console.log(`保留引用: ${referenced.size} 个 Key\n`);

  if (orphans.length === 0) {
    console.log("没有可删除的孤儿文件。");
    return;
  }

  for (const o of orphans.slice(0, 20)) {
    console.log(`  ${formatBytes(o.Size).padStart(8)}  ${o.Key}`);
  }
  if (orphans.length > 20) {
    console.log(`  … 另有 ${orphans.length - 20} 个`);
  }

  if (!apply) {
    console.log(`\n确认无误后运行: npm run cos:prune-orphans -- --apply`);
    return;
  }

  let deleted = 0;
  let failed = 0;
  for (const o of orphans) {
    try {
      await deleteObjectVersion(cos, bucket, region, o.Key);
      deleted++;
      if (deleted % 50 === 0) {
        process.stdout.write(`\r已删除 ${deleted}/${orphans.length}…`);
      }
    } catch {
      failed++;
    }
  }

  console.log(`\n\n完成: 删除 ${deleted}，失败 ${failed}，释放约 ${formatBytes(totalBytes)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
