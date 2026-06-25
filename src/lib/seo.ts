import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";

export const SITE_URL = "https://gaoxinming.xyz";
// 默认分享/OG 图用圆形头像,避免「关于我」人像(about-portrait.jpg)被搜索引擎当作站点代表图。
export const DEFAULT_OG_IMAGE = "/images/hero-avatar-375.png";

const siteNames: Record<Locale, string> = {
  zh: "高欣明作品集",
  en: "Gao Xinming Portfolio",
};

const homeSeo = {
  zh: {
    title: "高欣明作品集｜新媒体运营与AIGC内容增长",
    description:
      "高欣明个人作品集，聚焦新媒体运营、AIGC内容增长、短视频运营、矩阵运营、视觉拍摄与商业转化案例。",
  },
  en: {
    title: "Gao Xinming | New Media Operator, AIGC Growth and Visual Portfolio",
    description:
      "Gao Xinming's portfolio for new media operations, AIGC workflows, content growth, short-video strategy, visual production, and conversion-focused cases.",
  },
} satisfies Record<Locale, { title: string; description: string }>;

export function getHomeSeo(locale: Locale) {
  return homeSeo[locale];
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function localizedPath(locale: Locale, path = ""): string {
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path;
  return `/${locale}${normalizedPath}`;
}

type PageMetadataOptions = {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
};

export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  type = "website",
}: PageMetadataOptions): Metadata {
  const canonicalPath = localizedPath(locale, path);
  const alternatePath = path || "";
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(canonicalPath),
      languages: {
        "zh-CN": absoluteUrl(localizedPath("zh", alternatePath)),
        en: absoluteUrl(localizedPath("en", alternatePath)),
        "x-default": absoluteUrl(localizedPath("zh", alternatePath)),
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName: siteNames[locale],
      locale: locale === "zh" ? "zh_CN" : "en_US",
      alternateLocale: locale === "zh" ? ["en_US"] : ["zh_CN"],
      images: [
        {
          url: imageUrl,
          width: 375,
          height: 375,
          alt: title,
        },
      ],
      type,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function truncateDescription(value: string, maxLength = 150): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}
