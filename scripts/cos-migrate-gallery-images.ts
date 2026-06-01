/**
 * 为 COS 中 legacy 图片生成 list / admin / detail 三档 WebP
 *
 * 用法：
 *   npm run cos:migrate-images -- --dry-run
 *   npm run cos:migrate-images -- --apply
 */
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import {
  createCosClient,
  formatBytes,
  listCurrentObjects,
  requireCosConfig,
} from "./cos-lib";
import {
  MEDIA_VARIANTS,
  mediaBaseFromKey,
  variantKeyFromBase,
  type MediaVariant,
} from "../src/lib/cos/media-variants";

const PRESETS: Record<MediaVariant, { maxWidth: number; quality: number }> = {
  list: { maxWidth: 1200, quality: 85 },
  admin: { maxWidth: 120, quality: 80 },
  detail: { maxWidth: 2400, quality: 88 },
};

function parseArgs() {
  const argv = process.argv.slice(2);
  return {
    apply: argv.includes("--apply"),
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    prefix: argv.find((a) => a.startsWith("--prefix="))?.slice("--prefix=".length) ?? "works/",
  };
}

function isLegacySourceKey(key: string): boolean {
  if (/\.(list|admin|detail)\.webp$/i.test(key)) {
    return false;
  }
  return /^works\/(gallery|covers)\/.+\.(jpe?g|png|webp|gif|avif)$/i.test(key);
}

async function downloadObject(
  cos: ReturnType<typeof createCosClient>,
  bucket: string,
  region: string,
  key: string,
): Promise<Buffer> {
  const data = await new Promise<{ Body?: Buffer | string }>((resolve, reject) => {
    cos.getObject({ Bucket: bucket, Region: region, Key: key }, (err, result) =>
      err ? reject(err) : resolve(result as { Body?: Buffer | string }),
    );
  });
  if (!data.Body) {
    throw new Error(`空对象：${key}`);
  }
  return Buffer.isBuffer(data.Body) ? data.Body : Buffer.from(data.Body);
}

async function uploadBuffer(
  cos: ReturnType<typeof createCosClient>,
  bucket: string,
  region: string,
  key: string,
  body: Buffer,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: body,
        ContentType: "image/webp",
      },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

async function generateVariants(buffer: Buffer, variant: MediaVariant): Promise<Buffer> {
  const { maxWidth, quality } = PRESETS[variant];
  return sharp(buffer)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

async function main() {
  const { dryRun, prefix } = parseArgs();
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();

  const objects = await listCurrentObjects(cos, bucket, region, prefix);
  const sources = objects.filter((o) => isLegacySourceKey(o.Key));

  console.log(`扫描 ${objects.length} 个对象，legacy 图片 ${sources.length} 个（${dryRun ? "dry-run" : "apply"}）`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of sources) {
    const base = mediaBaseFromKey(item.Key);
    if (!base) {
      skipped++;
      continue;
    }

    const missingVariants = MEDIA_VARIANTS.filter((variant) => {
      const variantKey = variantKeyFromBase(base, variant);
      return !objects.some((o) => o.Key === variantKey);
    });

    if (missingVariants.length === 0) {
      skipped++;
      continue;
    }

    console.log(`\n→ ${item.Key} (${formatBytes(item.Size)}) 缺少: ${missingVariants.join(", ")}`);

    if (dryRun) {
      processed++;
      continue;
    }

    try {
      const buffer = await downloadObject(cos, bucket, region, item.Key);
      for (const variant of missingVariants) {
        const out = await generateVariants(buffer, variant);
        const outKey = variantKeyFromBase(base, variant);
        await uploadBuffer(cos, bucket, region, outKey, out);
        console.log(`  ✓ ${outKey} (${formatBytes(out.length)})`);
      }
      processed++;
    } catch (error) {
      failed++;
      console.error(`  ✗ ${item.Key}:`, error instanceof Error ? error.message : error);
    }
  }

  const summary = { processed, skipped, failed, dryRun };
  console.log("\n完成:", summary);
  await writeFile(
    "cos-migrate-images-last-run.json",
    JSON.stringify({ ...summary, at: new Date().toISOString() }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
