import { permanentRedirect } from "next/navigation";

// 308 永久重定向(浏览器/CDN 会缓存),后续直接命中 /zh,省一次往返。
// 可后续按 Accept-Language 嗅探 zh/en,但当前默认中文站。
export default function RootPage() {
  permanentRedirect("/zh");
}
