import type { Locale } from "@/lib/i18n";

export type FaqItem = {
  question: string;
  answer: string;
};

export type TimelineItem = {
  year: string;
  company?: string;
  title: string;
  role: string;
  desc: string;
};

type LocalizedString = { zh: string; en: string };
type LocalizedTimeline = {
  year: LocalizedString;
  company?: LocalizedString;
  title: LocalizedString;
  role: LocalizedString;
  desc: LocalizedString;
};
type LocalizedFaq = { question: LocalizedString; answer: LocalizedString };

function pick(loc: Locale, v: LocalizedString): string {
  return v[loc] || v.zh;
}

const profileSource = {
  name: { zh: "高欣明", en: "Gao Xinming" },
  title: {
    zh: "新媒体全链路操盘手 & AIGC专家",
    en: "Full-stack New Media Operator & AIGC Specialist",
  },
  location: { zh: "北京 · 中国", en: "Beijing · China" },
  bio: {
    zh: "7年新媒体全链路操盘经验，深度融合AIGC工作流与商业增长策略。独立完成从内容策划、视觉拍摄到私域变现的完整商业闭环，曾创造单条视频200W+播放、撬动千万级营收。",
    en: "7+ years operating new-media end-to-end, fusing AIGC workflows with growth strategy. Solo-driven full loop from content planning and visual production to private-traffic monetization — single videos at 2M+ views, scaled campaigns to 8-figure RMB revenue.",
  },
  resumeUrl: "#",
  skills: [
    { zh: "AIGC 工作流", en: "AIGC Workflow" },
    { zh: "商业增长", en: "Growth Strategy" },
    { zh: "视觉创制", en: "Visual Production" },
    { zh: "私域转化", en: "Private-Traffic Conversion" },
    { zh: "矩阵运营", en: "Multi-Account Operations" },
  ] satisfies LocalizedString[],
  timeline: [
    {
      year: { zh: "2023 — 至今", en: "2023 — Present" },
      company: { zh: "武汉藏龙高级中学", en: "Wuhan Canglong High School" },
      title: { zh: "品牌运营负责人", en: "Head of Brand Operations" },
      role: {
        zh: "矩阵体系 / AIGC链路 / 内容生产",
        en: "Multi-Account / AIGC Pipeline / Content Production",
      },
      desc: {
        zh: "服务品牌搭建，构建社群体系闭环，搭建 AIGC 量产与矩阵同步增长。",
        en: "Built the brand from scratch, established a community loop, and rolled out an AIGC production line aligned with multi-account growth.",
      },
    },
    {
      year: { zh: "2021 — 2023", en: "2021 — 2023" },
      company: { zh: "煜明科技", en: "Yuming Technology" },
      title: { zh: "运营主管", en: "Operations Lead" },
      role: { zh: "内容策略 / 视觉导演", en: "Content Strategy / Visual Direction" },
      desc: {
        zh: "负责跨平台视觉体系与爆款内容策略落地。",
        en: "Owned the cross-platform visual system and turned hit-content strategy into shipped work.",
      },
    },
    {
      year: { zh: "2018 — 2021", en: "2018 — 2021" },
      company: { zh: "编学边玩", en: "Bian Xue Bian Wan" },
      title: { zh: "新媒体运营", en: "New Media Operator" },
      role: { zh: "拍摄 / 剪辑 / 运营", en: "Shoot / Edit / Operate" },
      desc: {
        zh: "独立运营50万+的主账号，seo相关策略制定",
        en: "Solo-ran a 500K+ flagship account; defined and executed SEO strategy.",
      },
    },
  ] satisfies LocalizedTimeline[],
  faq: [
    {
      question: {
        zh: "你的核心差异化优势是什么？",
        en: "What is your core differentiator?",
      },
      answer: {
        zh: "全链路闭环能力。我能独立打通「视觉拍摄 - AIGC提效 - 矩阵冷启动 - 私域SOP变现」的完整商业闭环，帮企业省去多部门跨团队的沟通成本，直接对商业转化结果负责。",
        en: "An end-to-end loop. I can solo-drive the full chain — visual production, AIGC acceleration, multi-account cold start, private-traffic SOP monetization — saving the cross-team coordination overhead and owning the conversion outcome.",
      },
    },
    {
      question: {
        zh: "你的AIGC工作流是如何具体落地的？",
        en: "How does your AIGC workflow actually ship?",
      },
      answer: {
        zh: "绝非简单的文生图自嗨。我将AI工具切实嵌入日常业务流程，跑通了从脚本批量化生成到视觉无缝渲染的标准化流水线，内容资产生产效率提升数倍，帮传统项目实现极限降本。",
        en: "Not novelty text-to-image. I embed AI into daily ops, with a standardized pipeline from batched script generation to seamless visual rendering — multiplying content throughput and slashing cost for traditional projects.",
      },
    },
    {
      question: {
        zh: "面对流量越来越贵，你如何帮项目做0-1起盘？",
        en: "With paid traffic getting expensive, how do you bootstrap 0→1?",
      },
      answer: {
        zh: "拒绝盲目铺量，依赖「差异化内容策略 + 精准投流」。我擅长通过深度用户画像分析捕捉痛点，曾创造单条视频爆量200W+播放的冷启动案例，迅速为新业务建立稳定的获客阵地。",
        en: "Not brute-force volume — differentiated content + precise paid placement. Deep persona analysis to capture pain points; cold-start case with a single video at 2M+ views, building a stable acquisition base for the new business.",
      },
    },
    {
      question: {
        zh: "为什么你能撬动千万级的高客单变现？",
        en: "Why can you unlock 8-figure high-ticket revenue?",
      },
      answer: {
        zh: "因为我深知流量只是起点，私域才是终点。针对高净值人群，通过前端精准内容筛选与后端社群SOP承接，实现逆势涨粉9,600+并成功转化300+高客单用户。",
        en: "Traffic is the start, private domain is the finish. For high-net-worth audiences I pair front-end content filtering with back-end community SOP — net +9,600 followers and 300+ high-ticket conversions against the trend.",
      },
    },
    {
      question: {
        zh: "什么样的项目或企业最适合找你合作？",
        en: "Who is the best fit to work with you?",
      },
      answer: {
        zh: "两类企业：一是渴望利用AI降本增效、快速重构内容生产线的传统品牌；二是产品客单价高、急需通过全网矩阵精准获客并跑通私域转化闭环的商业项目。",
        en: "Two kinds: traditional brands who want AI to cut cost and rebuild their content line; and high-ticket businesses who need cross-platform multi-account acquisition plus a working private-traffic conversion loop.",
      },
    },
  ] satisfies LocalizedFaq[],
};

export type LocalizedProfile = {
  name: string;
  title: string;
  location: string;
  bioZh: string;
  bioEn: string;
  resumeUrl: string;
  skills: string[];
  timeline: TimelineItem[];
  faq: FaqItem[];
};

export function getProfile(locale: Locale): LocalizedProfile {
  return {
    name: pick(locale, profileSource.name),
    title: pick(locale, profileSource.title),
    location: pick(locale, profileSource.location),
    bioZh: profileSource.bio.zh,
    bioEn: profileSource.bio.en,
    resumeUrl: profileSource.resumeUrl,
    skills: profileSource.skills.map((s) => pick(locale, s)),
    timeline: profileSource.timeline.map((t) => ({
      year: pick(locale, t.year),
      company: t.company ? pick(locale, t.company) : undefined,
      title: pick(locale, t.title),
      role: pick(locale, t.role),
      desc: pick(locale, t.desc),
    })),
    faq: profileSource.faq.map((f) => ({
      question: pick(locale, f.question),
      answer: pick(locale, f.answer),
    })),
  };
}

/** @deprecated 兼容旧引用,默认中文。新代码请用 getProfile(locale) */
export const profile = getProfile("zh");

export type ContactPlatform = {
  index: string;
  name: string;
  note: string;
  url: string;
};

export const contactInfo = {
  phone: "+86 156 0783 5498",
  phoneTel: "+8615607835498",
  email: "584917939@qq.com",
} as const;

export type ContactInfo = typeof contactInfo;

const contactPlatformsSource = [
  {
    index: "01",
    name: { zh: "抖音", en: "Douyin" },
    note: { zh: "短视频创作", en: "Short-video creation" },
    url: "https://www.douyin.com/",
  },
  {
    index: "02",
    name: { zh: "视频号", en: "Channels" },
    note: { zh: "微信视频号", en: "WeChat Channels" },
    url: "https://channels.weixin.qq.com/",
  },
  {
    index: "03",
    name: { zh: "小红书", en: "Xiaohongshu" },
    note: { zh: "图文内容创作", en: "Image & text content" },
    url: "https://www.xiaohongshu.com/",
  },
  {
    index: "04",
    name: { zh: "作品集网站", en: "Portfolio Site" },
    note: { zh: "www.gaoxinming.xyz", en: "www.gaoxinming.xyz" },
    url: "https://gaoxinming.xyz",
  },
];

export function getContactPlatforms(locale: Locale): ContactPlatform[] {
  return contactPlatformsSource.map((p) => ({
    index: p.index,
    name: pick(locale, p.name),
    note: pick(locale, p.note),
    url: p.url,
  }));
}

/** @deprecated 兼容旧引用,默认中文。新代码请用 getContactPlatforms(locale) */
export const contactPlatforms: ContactPlatform[] = getContactPlatforms("zh");
