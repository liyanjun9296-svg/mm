export type CapabilityItem = {
  id: string;
  icon: "camera" | "spark" | "chart";
  title: string;
  body: string;
  monoTag: string;
  tags: string[];
};

export const capabilities: CapabilityItem[] = [
  {
    id: "visual",
    icon: "camera",
    title: "视频与摄影/视觉创制",
    body: "全流程独立起盘，脚本分镜、拍摄、精修剪辑一手包办。持证摄影师，电影级镜头语言定制品牌视觉体系。",
    monoTag: "摄影 · 剪辑 · 调色 · 分镜",
    tags: ["CapCut", "DaVinci", "Premiere", "摄影"],
  },
  {
    id: "aigc",
    icon: "spark",
    title: "技术赋能 / AIGC 工作流",
    body: "深度打通 seedance / Midjourney / Coze 等工具链，跑通 AI 量产标准流，极限缩减 70% 人工成本。",
    monoTag: "链路类 · 图像类 · 视频类 · 降本70%",
    tags: ["seedance", "Midjourney", "Sora"],
  },
  {
    id: "growth",
    icon: "chart",
    title: "商业增长 / 矩阵与转化",
    body: "单条短视频 200W+ 播放、10W+ 点赞。精准私域 SOP 运营，直接撬动千万级营收。",
    monoTag: "200W+播放 · 千万营收 · 私域SOP",
    tags: ["抖音", "小红书", "视频号", "私域SOP"],
  },
];
