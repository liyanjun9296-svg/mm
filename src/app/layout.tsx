import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Eczar,
  Fraunces,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Playfair_Display,
  Space_Grotesk,
  Syne,
  Young_Serif,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const eczar = Eczar({
  variable: "--font-eczar",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
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
        url: "/images/about-portrait.png",
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
    images: ["/images/about-portrait.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${syne.variable} ${spaceGrotesk.variable} ${cormorant.variable} ${fraunces.variable} ${eczar.variable} ${playfairDisplay.variable} ${youngSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
