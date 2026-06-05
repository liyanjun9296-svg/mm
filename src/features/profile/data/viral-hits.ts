import type { Locale } from "@/lib/i18n";

export type ViralMetric = {
  value: string;
  label: string;
  description: string;
};

export type ViralCase = {
  title: string;
  tag: string;
};

type ViralHitsData = {
  metrics: ViralMetric[];
  cases: ViralCase[];
};

const data: Record<Locale, ViralHitsData> = {
  zh: {
    metrics: [
      {
        value: "340万+",
        label: "图文内容曝光",
        description: "教育类图文多平台分发，单篇最高推荐量 230万+",
      },
      {
        value: "54万+",
        label: "高粉账号运营",
        description: "参与运营高流量内容账号，累计获赞 421万+",
      },
      {
        value: "200万+",
        label: "单条视频浏览",
        description: "短视频内容单条浏览 200万+，点赞 10万+",
      },
      {
        value: "1000万+",
        label: "商业转化贡献",
        description: "通过内容获客与社群承接，贡献营收 1000万+",
      },
    ],
    cases: [
      { title: "内容方法论", tag: "即将更新" },
      { title: "数据分析", tag: "即将更新" },
      { title: "爆款拆解", tag: "即将更新" },
      { title: "账号运营", tag: "即将更新" },
    ],
  },
  en: {
    metrics: [
      {
        value: "3.4M+",
        label: "Content Impressions",
        description:
          "Multi-platform distribution of educational content, single post peak reach 2.3M+",
      },
      {
        value: "540K+",
        label: "High-Traffic Account Ops",
        description:
          "Managed high-traffic content accounts with 4.21M+ total likes",
      },
      {
        value: "2M+",
        label: "Single Video Views",
        description: "Single short video 2M+ views, 100K+ likes",
      },
      {
        value: "10M+",
        label: "Revenue Contribution",
        description:
          "Content-driven acquisition & community conversion, contributing 10M+ RMB revenue",
      },
    ],
    cases: [
      { title: "Content Methodology", tag: "Coming Soon" },
      { title: "Data Analytics", tag: "Coming Soon" },
      { title: "Viral Breakdown", tag: "Coming Soon" },
      { title: "Account Operations", tag: "Coming Soon" },
    ],
  },
};

export function getViralHits(locale: Locale): ViralHitsData {
  return data[locale];
}
