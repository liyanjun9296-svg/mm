/**
 * 删除 COS 非当前版本（历史版本 / DeleteMarker）
 *
 * 用法：npm run cos:prune-versions              # dry-run
 *       npm run cos:prune-versions -- --apply
 *       npm run cos:prune-versions -- --prefix=works/videos/
 */
import {
  createCosClient,
  deleteObjectVersion,
  formatBytes,
  listNonCurrentVersions,
  parseArgs,
  requireCosConfig,
} from "./cos-lib";

const DEFAULT_PREFIXES = ["works/", "site/"];

async function main() {
  const { apply, prefix } = parseArgs(process.argv.slice(2));
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();

  const prefixes = prefix ? [prefix] : DEFAULT_PREFIXES;
  const allRows = [];

  for (const p of prefixes) {
    const rows = await listNonCurrentVersions(cos, bucket, region, p);
    allRows.push(...rows);
  }

  const seen = new Set<string>();
  const unique = allRows.filter((r) => {
    const id = `${r.Key}\0${r.VersionId ?? ""}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const totalBytes = unique.reduce((sum, r) => sum + r.Size, 0);

  console.log(`\n${apply ? "【执行删除】" : "【dry-run 预览】"} 历史版本清理\n`);
  console.log(`扫描前缀: ${prefixes.join(", ")}`);
  console.log(`将删除: ${unique.length} 个非当前版本，约 ${formatBytes(totalBytes)}\n`);

  if (unique.length === 0) {
    console.log("没有非当前版本。");
    return;
  }

  for (const r of unique.slice(0, 20)) {
    console.log(`  ${formatBytes(r.Size).padStart(8)}  ${r.Key}  (${r.VersionId?.slice(0, 12)}…)`);
  }
  if (unique.length > 20) {
    console.log(`  … 另有 ${unique.length - 20} 个`);
  }

  if (!apply) {
    console.log(`\n确认后运行: npm run cos:prune-versions -- --apply`);
    return;
  }

  let deleted = 0;
  let failed = 0;
  for (const r of unique) {
    try {
      await deleteObjectVersion(cos, bucket, region, r.Key, r.VersionId);
      deleted++;
      if (deleted % 100 === 0) {
        process.stdout.write(`\r已删除 ${deleted}/${unique.length}…`);
      }
    } catch {
      failed++;
    }
  }

  console.log(`\n\n完成: 删除 ${deleted} 个版本，失败 ${failed}，释放约 ${formatBytes(totalBytes)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
