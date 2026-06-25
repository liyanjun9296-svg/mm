import { headers } from "next/headers";
import { redirect } from "next/navigation";

// 根路径按访客浏览器语言分流：中文 → /zh，其它语言 → /en，判断不了 → /zh。
// 用 307 临时重定向（不是 308 永久），避免根路径被永久绑定到单一语言，
// 以及避免浏览器/CDN 缓存把后续不同语言访客也锁死到同一语言。
// 各语言版本的收录由 /zh、/en 自身的 hreflang/canonical 负责，与此分流互不影响。
function prefersChinese(acceptLanguage: string | null): boolean {
  if (!acceptLanguage) {
    return true; // 爬虫/未知 UA：默认中文
  }
  const primary = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  return primary.startsWith("zh");
}

export default async function RootPage() {
  const acceptLanguage = (await headers()).get("accept-language");
  redirect(prefersChinese(acceptLanguage) ? "/zh" : "/en");
}
