import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DEFAULT_OG_IMAGE, getHomeSeo, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultSeo = getHomeSeo("zh");

export const metadata: Metadata = {
  // 用于解析 openGraph/twitter 相对路径为绝对 URL。
  // 生产默认走正式域名,避免部署 metadata 落到 Vercel preview 或 localhost。
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultSeo.title,
    template: "%s｜高欣明作品集",
  },
  description: defaultSeo.description,
  verification: {
    other: {
      "baidu-site-verification": "codeva-ZV6z8TUR2y",
    },
  },
  keywords: [
    "高欣明",
    "新媒体运营",
    "AIGC",
    "AIGC内容增长",
    "短视频运营",
    "矩阵运营",
    "内容增长",
    "视频摄影作品集",
    "Gao Xinming",
    "new media operator",
    "AIGC portfolio",
  ],
  // og:image 用本地静态文件,微信/Twitter/Telegram scraper 抓 og 时不会回源 COS,
  // 避免分享爆量(5/31 教训)。默认用圆形头像,不暴露「关于我」蓝天人像。
  openGraph: {
    title: defaultSeo.title,
    description: defaultSeo.description,
    url: getSiteUrl(),
    siteName: "高欣明作品集",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 375,
        height: 375,
        alt: "高欣明作品集",
      },
    ],
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: defaultSeo.title,
    description: defaultSeo.description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
