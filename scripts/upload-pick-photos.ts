/**
 * 从 pick 文件夹按子目录分类批量上传摄影到 COS 并登记作品
 *
 * 用法：
 *   npm run upload:pick-photos -- --dry-run
 *   npm run upload:pick-photos
 *   npm run upload:pick-photos -- --source "/path/to/pick"
 */
import { config } from "dotenv";
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { resolve } from "path";
import COS from "cos-nodejs-sdk-v5";

config({ path: resolve(process.cwd(), ".env.local") });

import type { FeaturedLayout, WorkItem } from "../src/features/portfolio/types";
import { DEFAULT_PHOTO_CATEGORIES } from "../src/features/portfolio/constants";

const DEFAULT_SOURCE = "/Volumes/TOSHIBA EXT/图片汇总/pick";
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

const CATEGORY_SLUGS: Record<string, string> = {
  学生宣传照: "xuesheng-xuanchuan",
  文创: "wenchuang",
  校园环境: "xiaoyuan-huanjing",
  运动会: "yundonghui",
};

function parseArgs() {
  const args = process.argv.slice(2);
  let source = DEFAULT_SOURCE;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--source" && args[i + 1]) {
      source = args[++i];
    }
  }

  return { source, dryRun };
}

function guessContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}

function titleFromFilename(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return base || "摄影作品";
}

function filenameSlug(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const ascii = base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return ascii || "img";
}

function categorySlug(categoryName: string): string {
  return CATEGORY_SLUGS[categoryName] ?? categoryName.replace(/\s+/g, "-");
}

function yearFromJpeg(filePath: string): string {
  try {
    const buf = readFileSync(filePath);
    const slice = buf.subarray(0, Math.min(buf.length, 128 * 1024));
    const text = slice.toString("latin1");
    const m = text.match(/(\d{4}):(\d{2}):(\d{2})/);
    if (m) {
      const year = Number(m[1]);
      if (year >= 2000 && year <= 2100) {
        return String(year);
      }
    }
  } catch {
    // ignore
  }
  return "2025";
}

function featuredForIndex(
  categoryName: string,
  index: number,
): { featured?: boolean; featuredLayout?: FeaturedLayout } {
  if (categoryName === "学生宣传照") {
    if (index === 0) return { featured: true, featuredLayout: "large" };
    if (index === 1) return { featured: true, featuredLayout: "compact" };
  }
  if (categoryName === "文创") {
    if (index === 0) return { featured: true, featuredLayout: "large" };
    if (index === 1) return { featured: true, featuredLayout: "compact" };
  }
  if (categoryName === "校园环境" && index === 0) {
    return { featured: true, featuredLayout: "compact" };
  }
  if (categoryName === "运动会" && index === 0) {
    return { featured: true, featuredLayout: "compact" };
  }
  return {};
}

function listCategoryDirs(sourceRoot: string): string[] {
  const found = readdirSync(sourceRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
  const ordered: string[] = [...DEFAULT_PHOTO_CATEGORIES].filter((c) => found.includes(c));
  for (const name of found) {
    if (!ordered.includes(name)) {
      ordered.push(name);
    }
  }
  return ordered;
}

function listImagesInCategory(sourceRoot: string, categoryName: string): string[] {
  const dir = path.join(sourceRoot, categoryName);
  return readdirSync(dir)
    .filter((name) => IMAGE_EXT.test(name) && !name.startsWith("._"))
    .map((name) => path.join(dir, name))
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function buildSlug(categoryName: string, filename: string): string {
  const cat = categorySlug(categoryName);
  const file = filenameSlug(path.basename(filename));
  return `photo-${cat}-${file}`;
}

function cosKeyExists(
  cos: COS,
  bucket: string,
  region: string,
  key: string,
): Promise<boolean> {
  return new Promise((resolvePromise) => {
    cos.headObject({ Bucket: bucket, Region: region, Key: key }, (err) => {
      resolvePromise(!err);
    });
  });
}

function uploadFile(
  cos: COS,
  bucket: string,
  region: string,
  localPath: string,
  cosKey: string,
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: cosKey,
        Body: createReadStream(localPath),
        ContentLength: statSync(localPath).size,
        ContentType: guessContentType(localPath),
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolvePromise();
      },
    );
  });
}

async function main() {
  const { source, dryRun } = parseArgs();

  if (!existsSync(source)) {
    console.error(`源目录不存在: ${source}`);
    console.error("请确认外置硬盘已挂载，或使用 --source 指定路径");
    process.exit(1);
  }

  const bucket = process.env.COS_BUCKET!;
  const region = process.env.COS_REGION!;
  const secretId = process.env.COS_SECRET_ID!;
  const secretKey = process.env.COS_SECRET_KEY!;

  if (!bucket || !region || !secretId || !secretKey) {
    console.error("缺少 COS 环境变量，请配置 .env.local");
    process.exit(1);
  }

  const publicBase = (
    process.env.COS_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_COS_PUBLIC_BASE_URL ??
    `https://${bucket}.cos.${region}.myqcloud.com`
  ).replace(/\/+$/, "");

  const categories = listCategoryDirs(source);
  if (categories.length === 0) {
    console.error(`未在 ${source} 找到分类子文件夹`);
    process.exit(1);
  }

  const cos = new COS({ SecretId: secretId, SecretKey: secretKey });
  const { getWorks, saveWorkItemToCos } = await import(
    "../src/features/portfolio/data/works-store"
  );
  const { savePhotoCategoriesToCos } = await import(
    "../src/features/portfolio/data/categories-store"
  );

  const existingWorks = await getWorks();
  const existingSlugs = new Set(existingWorks.map((w) => w.slug));

  let totalFiles = 0;
  let totalFeatured = 0;
  const plan: Array<{ category: string; file: string; slug: string; featured: string }> = [];

  for (const category of categories) {
    const files = listImagesInCategory(source, category);
    totalFiles += files.length;
    files.forEach((filePath, index) => {
      const filename = path.basename(filePath);
      const slug = buildSlug(category, filename);
      const feat = featuredForIndex(category, index);
      const featuredLabel = feat.featured
        ? feat.featuredLayout === "large"
          ? "首页大卡"
          : "首页小卡"
        : "-";
      if (feat.featured) totalFeatured++;
      plan.push({ category, file: filename, slug, featured: featuredLabel });
    });
  }

  console.log(`源目录: ${source}`);
  console.log(`分类: ${categories.join("、")}`);
  console.log(`待处理: ${totalFiles} 张，其中精品 ${totalFeatured} 张`);
  if (dryRun) {
    console.log("\n--dry-run 预览（前 20 条）:");
    plan.slice(0, 20).forEach((p) => {
      console.log(`  [${p.category}] ${p.file} → ${p.slug} (${p.featured})`);
    });
    if (plan.length > 20) {
      console.log(`  … 另有 ${plan.length - 20} 张`);
    }
    console.log("\n去掉 --dry-run 后将实际上传");
    return;
  }

  let uploaded = 0;
  let skipped = 0;
  let saved = 0;

  for (let ci = 0; ci < categories.length; ci++) {
    const category = categories[ci];
    const files = listImagesInCategory(source, category);
    const catSlug = categorySlug(category);

    for (let fi = 0; fi < files.length; fi++) {
      const filePath = files[fi];
      const filename = path.basename(filePath);
      const slug = buildSlug(category, filename);

      if (existingSlugs.has(slug)) {
        console.log(`跳过（slug 已存在）: ${slug}`);
        skipped++;
        continue;
      }

      const safeName = filename.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
      const cosKey = `works/gallery/${catSlug}/${Date.now()}-${safeName}`;
      const publicUrl = `${publicBase}/${cosKey}`;

      process.stdout.write(
        `[${ci + 1}/${categories.length}] ${category} · ${fi + 1}/${files.length} ${filename} … `,
      );

      const keyExists = await cosKeyExists(cos, bucket, region, cosKey);
      if (!keyExists) {
        await uploadFile(cos, bucket, region, filePath, cosKey);
        uploaded++;
      }

      const item: WorkItem = {
        slug,
        title: titleFromFilename(filename),
        subtitle: category,
        description: "",
        category: "photo",
        subcategory: category,
        coverImage: publicUrl,
        mediaUrl: publicUrl,
        role: "摄影",
        year: yearFromJpeg(filePath),
        platform: "",
        ...featuredForIndex(category, fi),
      };

      await saveWorkItemToCos(item);
      existingSlugs.add(slug);
      saved++;
      console.log("OK");
    }
  }

  await savePhotoCategoriesToCos(categories);

  console.log("\n完成");
  console.log(`上传: ${uploaded}，登记: ${saved}，跳过: ${skipped}`);
  console.log(`摄影分类已写入 COS: ${categories.join("、")}`);
}

main().catch((error) => {
  console.error("失败:", error instanceof Error ? error.message : error);
  process.exit(1);
});
