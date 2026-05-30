/**
 * 将本地 works.ts 种子数据上传到 COS site/works.json（一次性或重置用）
 *
 * 用法：npm run seed:works -- --force
 * 需要 .env.local 中配置 COS_*（仅用 COS 密钥）
 *
 * 警告：会整包覆盖 COS 上的 site/works.json，日常更新请用 /zh/admin 后台保存。
 */
import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const force = process.argv.includes("--force");
  if (!force) {
    console.error(
      "已取消：seed:works 会整包覆盖 COS site/works.json（含你在后台保存的作品）。\n" +
        "若确需重置种子数据，请运行：npm run seed:works -- --force",
    );
    process.exit(1);
  }

  const { works } = await import("../src/features/portfolio/data/works");
  const { saveWorksToCos } = await import("../src/features/portfolio/data/works-store");
  const { saveVideoCategoriesToCos, DEFAULT_VIDEO_CATEGORIES } = await import(
    "../src/features/portfolio/data/categories-store"
  );

  await saveWorksToCos(works);
  await saveVideoCategoriesToCos([...DEFAULT_VIDEO_CATEGORIES]);
  console.log(`已上传 ${works.length} 条作品到 COS site/works.json`);
  console.log(`已上传视频分类到 COS site/video-categories.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
