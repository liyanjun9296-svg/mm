import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 用于解析 openGraph/twitter 相对路径为绝对 URL。
  // Vercel 会自动填 VERCEL_URL,本地 build 走 localhost。
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "GAO XINMING Portfolio",
  description: "Premium minimalist portfolio built with Next.js.",
  // og:image 用本地静态文件,微信/Twitter/Telegram scraper 抓 og 时不会回源 COS,
  // 避免分享爆量(5/31 教训)。如需替换,改 public/images/ 下的资源即可。
  openGraph: {
    title: "GAO XINMING Portfolio",
    description: "Premium minimalist portfolio built with Next.js.",
    images: [
      {
        url: "/images/about-portrait.jpg",
        width: 1200,
        height: 630,
        alt: "GAO XINMING Portfolio",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GAO XINMING Portfolio",
    description: "Premium minimalist portfolio built with Next.js.",
    images: ["/images/about-portrait.jpg"],
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
