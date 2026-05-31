/**
 * 一键编排：报告 → 清历史版本 → 清孤儿 → 再报告
 *
 * 用法：npm run cos:cleanup              # 全部 dry-run
 *       npm run cos:cleanup -- --apply   # 执行清理
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function run(script: string, extraArgs: string[] = []) {
  const scriptPath = resolve(process.cwd(), "scripts", script);
  const args = ["tsx", scriptPath, ...extraArgs];
  console.log(`\n${"=".repeat(60)}\n> npx ${args.join(" ")}\n`);
  const result = spawnSync("npx", args, { stdio: "inherit", cwd: process.cwd() });
  if (result.status !== 0) {
    throw new Error(`${script} 退出码 ${result.status}`);
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const mode = apply ? "--apply" : "";

  console.log(apply ? "COS 一键清理（执行模式）" : "COS 一键清理（预览模式）");

  run("cos-storage-report.ts");
  run("cos-prune-versions.ts", mode ? [mode] : []);
  run("cos-prune-orphans.ts", mode ? [mode] : []);

  if (apply) {
    run("cos-storage-report.ts");
    console.log("\n清理完成。请在 COS 控制台确认存储量。");
  } else {
    console.log("\n预览完成。确认后运行: npm run cos:cleanup -- --apply");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
