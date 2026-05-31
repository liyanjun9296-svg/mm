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

export const profile = {
  name: "高欣明",
  title: "新媒体全链路操盘手 & AIGC专家",
  location: "北京 · 中国",
  bioZh:
    "7年新媒体全链路操盘经验，深度融合AIGC工作流与商业增长策略。独立完成从内容策划、视觉拍摄到私域变现的完整商业闭环，曾创造单条视频200W+播放、撬动千万级营收。",
  bioEn:
    "7+ years in new media operations with AIGC workflows and growth strategy. End-to-end from content planning and visual production to private-domain conversion.",
  resumeUrl: "#",
  skills: ["AIGC 工作流", "商业增长", "视觉创制", "私域转化", "矩阵运营"],
  timeline: [
    {
      year: "2023 — 至今",
      company: "武汉藏龙高级中学",
      title: "品牌运营负责人",
      role: "矩阵体系 / AIGC链路 / 内容生产",
      desc: "服务品牌搭建，构建社群体系闭环，搭建 AIGC 量产与矩阵同步增长。",
    },
    {
      year: "2021 — 2023",
      company: "煜明科技",
      title: "运营主管",
      role: "内容策略 / 视觉导演",
      desc: "负责跨平台视觉体系与爆款内容策略落地。",
    },
    {
      year: "2018 — 2021",
      company: "编学边玩",
      title: "新媒体运营",
      role: "拍摄 / 剪辑 / 运营",
      desc: "独立运营50万+的主账号，seo相关策略制定",
    },
  ] satisfies TimelineItem[],
  faq: [
    {
      question: "你的核心差异化优势是什么？",
      answer:
        "全链路闭环能力。我能独立打通「视觉拍摄 - AIGC提效 - 矩阵冷启动 - 私域SOP变现」的完整商业闭环，帮企业省去多部门跨团队的沟通成本，直接对商业转化结果负责。",
    },
    {
      question: "你的AIGC工作流是如何具体落地的？",
      answer:
        "绝非简单的文生图自嗨。我将AI工具切实嵌入日常业务流程，跑通了从脚本批量化生成到视觉无缝渲染的标准化流水线，内容资产生产效率提升数倍，帮传统项目实现极限降本。",
    },
    {
      question: "面对流量越来越贵，你如何帮项目做0-1起盘？",
      answer:
        "拒绝盲目铺量，依赖「差异化内容策略 + 精准投流」。我擅长通过深度用户画像分析捕捉痛点，曾创造单条视频爆量200W+播放的冷启动案例，迅速为新业务建立稳定的获客阵地。",
    },
    {
      question: "为什么你能撬动千万级的高客单变现？",
      answer:
        "因为我深知流量只是起点，私域才是终点。针对高净值人群，通过前端精准内容筛选与后端社群SOP承接，实现逆势涨粉9,600+并成功转化300+高客单用户。",
    },
    {
      question: "什么样的项目或企业最适合找你合作？",
      answer:
        "两类企业：一是渴望利用AI降本增效、快速重构内容生产线的传统品牌；二是产品客单价高、急需通过全网矩阵精准获客并跑通私域转化闭环的商业项目。",
    },
  ] satisfies FaqItem[],
};

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

export const contactPlatforms: ContactPlatform[] = [
  {
    index: "01",
    name: "抖音",
    note: "短视频创作",
    url: "https://www.douyin.com/",
  },
  {
    index: "02",
    name: "视频号",
    note: "微信视频号",
    url: "https://channels.weixin.qq.com/",
  },
  {
    index: "03",
    name: "小红书",
    note: "图文内容创作",
    url: "https://www.xiaohongshu.com/",
  },
  {
    index: "04",
    name: "作品集网站",
    note: "www.gaoxinming.xyz",
    url: "https://gaoxinming.xyz",
  },
];
