/**
 * 将 COS site/works.json 迁移为 site/works/items/{slug}.json + index.json
 *
 * 用法：npm run migrate:works
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { fetchLegacyWorksFromCos, migrateLegacyWorksToPerSlug } = await import(
    "../src/features/portfolio/data/works-store"
  );

  const legacy = await fetchLegacyWorksFromCos();
  if (!legacy || legacy.length === 0) {
    console.error("未找到 site/works.json 或为空，无需迁移");
    process.exit(1);
  }

  await migrateLegacyWorksToPerSlug(legacy);
  console.log(`已迁移 ${legacy.length} 条作品到 site/works/items/*.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
