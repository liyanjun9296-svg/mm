import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/zh/admin/",
          "/en/admin/",
          "/zh/pdf-preview/",
          "/en/pdf-preview/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/zh/admin/",
          "/en/admin/",
          "/zh/pdf-preview/",
          "/en/pdf-preview/",
        ],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: [
          "/api/",
          "/zh/admin/",
          "/en/admin/",
          "/zh/pdf-preview/",
          "/en/pdf-preview/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
