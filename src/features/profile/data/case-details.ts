import type { Locale } from "@/lib/i18n";

export type CaseMetric = {
  value: string;
  label: string;
  description?: string;
};

export type CaseModule = {
  index: string;
  title: string;
  subtitle: string;
  content?: string;
  imagePlaceholder?: string;
  type: "text-image" | "model" | "flow" | "summary" | "pain-points" | "system-build" | "cycle" | "result" | "background" | "insights" | "strategy" | "result-deposits" | "image-showcase" | "video-cards" | "problem-cards" | "flow-horizontal" | "value-cards" | "video-link";
};

export type ModelCard = {
  title: string;
  description: string;
  tags: string[];
};

export type FlowNode = {
  title: string;
  details: string;
};

export type PainPoint = {
  title: string;
  description: string;
};

export type SystemCard = {
  title: string;
  problem: string;
  content: string;
  tags: string[];
  diagram: "platform-radial" | "brand-assets" | "swimlane";
};

export type CycleNode = {
  title: string;
  description: string;
};

export type CycleSummary = {
  title: string;
  content: string;
  tags: string[];
};

export type ResultSummary = {
  title: string;
  content: string;
  highlight: string;
  metrics: CaseMetric[];
};

export type InsightCard = {
  title: string;
  description: string;
};

export type StrategyNode = {
  title: string;
  description: string;
};

export type ImagePlaceholder = {
  label: string;
  src?: string;
};

export type StrategyTableRow = {
  shot: string;
  timeline: string;
  shotSize: string;
  camera: string;
  description: string;
  screenText: string;
};

export type VideoDirectionCard = {
  title: string;
  keywords: string[];
  description: string;
  placeholder: string;
  videoUrl?: string;
};

export type VideoLinkCard = {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  href: string;
};

export type CaseCardData = {
  id: string;
  index: string;
  tag: string;
  tagExtra?: string;
  title: string;
  subtitle: string;
  projectInfo?: string;
  metrics: CaseMetric[];
  platformTags: string[];
  modules: CaseModule[];
  modelCards?: ModelCard[];
  flowNodes?: FlowNode[];
  summaryText?: string;
  painPoints?: PainPoint[];
  systemCards?: SystemCard[];
  cycleNodes?: CycleNode[];
  cycleSummary?: CycleSummary;
  resultSummary?: ResultSummary;
  backgroundPoints?: string[];
  backgroundImages?: ImagePlaceholder[];
  insightCards?: InsightCard[];
  insightConclusion?: { title: string; content: string };
  strategyNodes?: StrategyNode[];
  strategyImages?: ImagePlaceholder[];
  strategyTable?: StrategyTableRow[];
  resultDeposits?: string[];
  showcaseImage?: {
    segments: { src: string; width: number; height: number }[];
    alt: string;
    caption?: string;
  };
  videoDirections?: VideoDirectionCard[];
  problemCards?: PainPoint[];
  horizontalFlow?: { title: string; description: string }[];
  valueCards?: PainPoint[];
  videoLink?: VideoLinkCard;
};

const casesData: Record<Locale, CaseCardData[]> = {
  zh: [
    {
      id: "content-ops",
      index: "01",
      tag: "系统运营",
      tagExtra: "教育品牌增长",
      title: "内容运营系统搭建",
      subtitle:
        '围绕教育品牌「<strong>曝光</strong>、<strong>信任</strong>、<strong>承接</strong>、<strong>转化</strong>」四个关键问题，搭建内容矩阵、品牌视觉、私域协作与运营复盘机制，让学校宣传从零散内容发布，升级为可持续运行的招生增长系统。',
      projectInfo: "武汉藏龙高级中学｜品牌宣传 / AI视频创作",
      metrics: [
        { value: "9700+", label: "精准涨粉" },
        { value: "300+", label: "年度招生" },
        { value: "1000万+", label: "营收贡献" },
      ],
      platformTags: ["抖音", "视频号", "公众号", "私域社群"],
      modules: [
        {
          index: "01",
          title: "业务痛点",
          subtitle: "目标：学校宣传不只是曝光，核心是建立家长信任并推动招生转化。",
          content:
            "教育品牌的转化链路长，家长不会因为一条内容立刻报名。项目初期真正要解决的，不是单纯「发什么内容」，而是如何让学校<strong>被持续看见、被持续信任</strong>，并让内容带来的咨询能够被有效<strong>承接和转化</strong>。",
          type: "pain-points",
        },
        {
          index: "02",
          title: "系统搭建",
          subtitle: "运营系统模型",
          content:
            "将学校内容运营拆成三组核心解决方案：用<strong>平台矩阵</strong>解决曝光问题，用<strong>打造品牌感</strong>解决信任问题，用<strong>私域招生协作</strong>解决承接与转化问题。构成校区品牌传播与招生增长链路。",
          type: "system-build",
        },
        {
          index: "03",
          title: "运营节奏与执行闭环",
          subtitle: "让内容运营从临时发布，变成持续运转机制。",
          content:
            "解决方案搭建完成后，更重要的是让它稳定跑起来。通过<strong>月度规划</strong>、<strong>周度排期</strong>、<strong>内容生产</strong>、<strong>数据反馈</strong>和<strong>选题复盘</strong>，把校园内容运营从临时想选题、临时发内容，变成一套可持续推进的运营机制。",
          type: "cycle",
        },
        {
          index: "04",
          title: "结果沉淀",
          subtitle: "让内容生产真正服务于招生增长。",
          type: "result",
        },
      ],
      painPoints: [
        { title: "曝光不足", description: "学校特色、校园活动、师资力量、升学成果没有被持续看见。" },
        { title: "信任不足", description: "家长决策周期长，需要稳定、真实、连续的内容建立信任。" },
        { title: "承接不足", description: "内容产生兴趣后，缺少有效进入微信、社群、咨询链路的承接方式。" },
        { title: "转化不足", description: "招生线索需要招生老师持续跟进，内容端需要与招生端形成协作闭环。" },
      ],
      systemCards: [
        {
          title: "平台矩阵",
          problem: "解决曝光不足",
          content: "通过抖音、视频号、公众号形成多平台内容阵地，让学校内容持续触达目标家长。短视频平台负责快速曝光，视频号负责熟人生态传播，公众号负责深度内容沉淀，避免学校宣传只停留在单一渠道。",
          tags: ["抖音", "视频号", "公众号", "内容分发", "持续曝光"],
          diagram: "platform-radial",
        },
        {
          title: "品牌感打造",
          problem: "解决信任不足",
          content: "教育品牌不只是要被看见，更要让家长觉得专业、稳定、可信。通过 Logo 使用、VI 色卡、封面规范、视频包装和招生物料统一，让学校对外内容形成一致的品牌气质，减少内容零散感，提升家长对学校的信任感。",
          tags: ["Logo", "VI色卡", "封面规范", "视频包装", "招生物料", "品牌信任"],
          diagram: "brand-assets",
        },
        {
          title: "私域招生协作",
          problem: "解决承接不足和转化不足",
          content: "公域内容产生兴趣用户后，通过评论、私信、微信与社群承接家长咨询，再与招生老师协作完成线索分层、咨询跟进、邀约到访和报名转化。内容端负责触达和线索沉淀，招生端负责深度沟通和转化反馈，双方形成协作闭环。",
          tags: ["评论私信", "微信承接", "社群运营", "招生协作", "线索反馈", "反哺选题"],
          diagram: "swimlane",
        },
      ],
      cycleNodes: [
        { title: "月度内容规划", description: "结合招生节点、校园活动、节日热点确定重点主题" },
        { title: "周度选题排期", description: "拆分短视频、图文、视频号、公众号发布节奏" },
        { title: "内容生产执行", description: "脚本、拍摄、剪辑、封面、审核、发布" },
        { title: "数据与咨询反馈", description: "观察播放、互动、私信、咨询问题和社群反馈" },
        { title: "选题优化复盘", description: "把家长高频关注点反哺到下一轮内容规划" },
      ],
      cycleSummary: {
        title: "持续运营机制",
        content: "通过<strong>月度规划</strong>、<strong>周度排期</strong>、<strong>内容执行</strong>、<strong>数据反馈</strong>和<strong>选题复盘</strong>，让校园内容运营从临时发布变成持续运转机制，保证内容不断供、品牌表达不散、招生反馈能反哺下一轮内容。",
        tags: ["月度规划", "周度排期", "数据复盘", "选题优化"],
      },
      resultSummary: {
        title: "从零散内容发布，到招生增长系统",
        content: "最终形成「平台曝光—品牌信任—私域承接—招生转化—内容复盘」的完整闭环，让内容生产不只是品牌宣传物料，而是持续获客、建立信任并推动招生结果的增长工具。",
        highlight: "核心价值：把内容、品牌、私域和招生协作串联成一套可持续运行的增长系统。",
        metrics: [
          { value: "9700+", label: "精准涨粉", description: "内容矩阵带来目标人群增长" },
          { value: "300+", label: "年度招生", description: "内容与私域承接共同推动招生结果" },
          { value: "1000万+", label: "营收贡献", description: "内容运营最终服务商业增长" },
        ],
      },
    },
    {
      id: "cold-start",
      index: "02",
      tag: "爆款打造",
      tagExtra: "账号冷启动",
      title: "单条爆款打造",
      subtitle:
        "在账号 0-1 起号阶段，通过用户洞察、竞品拆解与内容方向判断，找到「精短、剧情合理、自然代入产品」的内容策略，打出账号首个爆款视频，完成从冷启动到热门内容的突破。",
      projectInfo: "0-1 起号项目｜短视频内容策划 / 脚本输出",
      metrics: [
        { value: "200万+", label: "单条浏览量" },
        { value: "10万+", label: "单条点赞" },
        { value: "首个爆款", label: "完成账号冷启动验证" },
      ],
      platformTags: [],
      modules: [
        {
          index: "01",
          title: "项目背景",
          subtitle: "0-1 起号阶段，第一条爆款的意义不只是流量，而是验证方向。",
          content:
            "账号处于冷启动阶段，缺少稳定内容模型和用户认知。首个爆款的核心价值，是验证账号内容方向、用户兴趣点和可复制的视频结构，为后续持续生产提供样本。",
          type: "background",
        },
        {
          index: "02",
          title: "行业洞察",
          subtitle: "爆款不是偶然，而是用户、平台、竞品和产品共同推导出的结果。",
          content:
            "通过前期分析，判断用户不爱看硬广，更容易被真实生活问题和轻剧情带入；短视频平台更适合快节奏、强结果展示；竞品内容证明「真实场景 + 剧情代入 + 明确卖点」更容易跑出效果；产品需要作为解决问题的工具自然出现。",
          type: "insights",
        },
        {
          index: "03",
          title: "内容策略",
          subtitle: "把洞察转化成可拍、可剪、可发布的视频结构。",
          content:
            "视频采用轻剧情结构，用真实生活问题开场，通过人物关系建立代入感，再让产品以解决问题的方式自然出现，最后用效果反馈完成记忆点。",
          type: "strategy",
        },
        {
          index: "04",
          title: "结果沉淀",
          subtitle: "首个爆款完成账号冷启动验证，并沉淀后续内容模型。",
          content:
            "这条视频不仅完成了 200万+ 浏览和 10万+ 点赞，更重要的是验证了账号在冷启动阶段的内容方向：轻剧情、短节奏、真实场景、产品自然介入。它为后续选题、脚本结构和账号内容模型提供了参考样本。",
          type: "result-deposits",
        },
      ],
      backgroundPoints: [
        "0-1 起号阶段",
        "缺少稳定内容模型",
        "需要验证用户兴趣",
        "需要找到可复制的视频结构",
      ],
      backgroundImages: [
        { label: "账号主页截图", src: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/cold-start/account-profile.png" },
        { label: "爆款视频截图", src: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/cold-start/viral-video.png" },
      ],
      insightCards: [
        { title: "用户洞察", description: "用户不是想看硬广，而是想看一个真实生活问题被解决。" },
        { title: "平台洞察", description: "短视频平台更适合快进入、强冲突、轻剧情、强结果展示。" },
        { title: "竞品洞察", description: "真人剧情更容易建立代入感，真实家居场景更容易激发共鸣。" },
        { title: "产品洞察", description: "产品不能硬塞，要作为解决问题的工具自然出现。" },
      ],
      insightConclusion: {
        title: "最终策略",
        content: "精短 · 剧情合理 · 自然代入产品",
      },
      strategyNodes: [
        { title: "问题钩子", description: "用真实生活痛点开场，让用户快速知道「这和我有关」" },
        { title: "轻剧情代入", description: "用朋友/用户/设计师关系降低广告感" },
        { title: "冲突建立", description: "通过选择困难、空间不协调制造继续看的理由" },
        { title: "产品介入", description: "产品作为解决问题的工具自然出现" },
        { title: "结果反馈", description: "展示前后变化和用户满意反馈" },
      ],
      strategyTable: [
        { shot: "1", timeline: "0-5s", shotSize: "近景", camera: "固定", description: "黑底黄字/黄底黑字的纯文本画面，作为视频封面和开头，快速切换，交代视频主题，吸引观众注意力。", screenText: "发现一个 超超超写实设计app\n玩了一下午 省了上百万装修费" },
        { shot: "2", timeline: "6-10s", shotSize: "近景", camera: "固定", description: `镜头对准放在木桌上的iPad。iPad画面显示一个3D客餐厅。一只手出镜，点击屏幕右侧的菜单栏，调出"餐椅"列表，并点击切换了不同的椅子款式。`, screenText: "好多种椅子，都来试试看" },
        { shot: "3", timeline: "11-14s", shotSize: "近景", camera: "固定", description: "选中一把餐椅后，手在屏幕上拖拽该椅子调整位置。细节亮点：拖拽时画面中出现了实时的绿色尺寸线（如170cm, 34cm等），展示家具与墙面/其他物体的精确距离。", screenText: "这个好喜欢，拯救强迫症" },
        { shot: "4", timeline: "15-20s", shotSize: "近景", camera: "固定", description: `手指在屏幕上滑动，控制APP内的第一人称视角在虚拟房间内"走动"。从餐厅穿过走廊，路过干湿分离的洗手台/洗衣区，最后进入一间卧室。展示APP内流畅漫游功能。`, screenText: "我设计的不错吧，哈哈哈哈哈哈" },
        { shot: "5", timeline: "20-22s", shotSize: "近景", camera: "固定", description: `视角停留在卧室。手再次点击右侧菜单，调出"双人床"的替换列表，点击其中一款，卧室里的床瞬间完成了一键替换。`, screenText: "床也换一下" },
        { shot: "6", timeline: "23-26s", shotSize: "近景", camera: "固定", description: `手调"木地板"材质菜单，连续点击了两种不同颜色和纹理的木地板。点击后，卧室地面的材质实时发生变化，展示逼真的光影和材质效果。`, screenText: "地板也来下" },
        { shot: "7", timeline: "27-31s", shotSize: "全屏", camera: "固定", description: "片尾画面，显示创作者的头像、搜索框及抖音号。（引导关注）", screenText: "" },
      ],
      resultSummary: {
        title: "首个爆款完成冷启动验证",
        content: "这条视频验证了账号在冷启动阶段的内容方向：轻剧情、短节奏、真实场景、产品自然介入。",
        highlight: "",
        metrics: [
          { value: "200万+", label: "单条浏览量" },
          { value: "10万+", label: "单条点赞" },
        ],
      },
      resultDeposits: [
        "验证账号内容方向",
        "确认用户兴趣点",
        "沉淀轻剧情脚本模型",
        "形成后续选题参考",
      ],
    },
    {
      id: "aigc-system",
      index: "03",
      tag: "AIGC体系",
      tagExtra: "跨场景内容生产",
      title: "AIGC / 团队赋能",
      subtitle:
        "围绕 AIGC 视频在连续性、稳定性和协作效率上的核心问题，搭建从创意拆解、分镜控制到生成校准的生产流程，将 AI 生成从单点素材产出转化为可复用的内容生产方法，降低团队使用门槛，统一产出标准。",
      projectInfo: "AIGC视频生产体系｜流程搭建 / 内容导演 / 团队赋能",
      metrics: [
        { value: "300%+", label: "效率提升" },
        { value: "500%+", label: "能力扩展" },
        { value: "300%+", label: "成本降低" },
      ],
      platformTags: ["校园宣传", "真人产品", "3D动画", "无人驾驶", "游戏CG"],
      modules: [
        {
          index: "01",
          title: "能力覆盖",
          subtitle: "从单一内容制作，扩展到多类型视频方向。",
          content:
            "AIGC 的价值不只是生成某一种风格的视频，而是让内容生产的边界被打开。通过不同方向的练习与项目探索，验证 AI 在校园宣传、产品表达、动画叙事、科技视觉和游戏化内容中的适配能力。",
          type: "video-cards",
        },
        {
          index: "02",
          title: "AIGC生产难点",
          subtitle: "AI 能生成好看的单镜头，但连续内容更需要控制。",
          content:
            "AIGC 视频真正的难点，不是单个镜头是否有冲击力，而是多个镜头放在一起时，角色、空间、动作和风格能不能保持稳定。",
          type: "problem-cards",
        },
        {
          index: "03",
          title: "流程方法",
          subtitle: "先搭控制流程，再进入 AI 生成。",
          content:
            "通过前期拆解和过程控制，把 AIGC 容易发散的生成过程收拢成可执行流程。先明确内容逻辑，再拆分镜头和画面要求，最后通过生成筛选、剪辑和后期统一，让视频从「单点素材」变成「完整作品」。",
          type: "flow-horizontal",
        },
        {
          index: "04",
          title: "团队赋能",
          subtitle: "把个人 AI 能力，转化为团队可理解、可执行、可复用的方法。",
          content:
            "AIGC 对团队的价值，不只是让某个人更快产出，而是改变内容协作方式。通过流程拆解、模板沉淀、提示词规范和验收标准，让各角色都能理解 AI 视频生产流程。",
          type: "value-cards",
        },
        {
          index: "05",
          title: "代表视频链接",
          subtitle: "点击查看完整 AIGC 视频作品。",
          type: "video-link",
        },
      ],
      videoDirections: [
        { title: "校园宣传视频", keywords: ["真实素材", "延时摄影", "品牌包装"], description: "用于校园宣传与活动包装，让真实素材具备更强的节奏感和传播质感。", placeholder: "校园视频循环素材", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/campus.mp4?v=20260616-500k" },
        { title: "真人产品视频", keywords: ["场景代入", "产品表达", "商业短片"], description: "用于产品展示与营销传播，让产品自然进入场景，而不是生硬露出。", placeholder: "真人产品视频循环素材", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/product.mp4?v=20260616-500k" },
        { title: "3D动画短片", keywords: ["分镜控制", "角色一致", "叙事节奏"], description: "用于剧情型视觉内容，重点控制角色、空间、动作因果和镜头节奏。", placeholder: "3D动画短片循环素材", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/animation.mp4?v=20260616-500k" },
        { title: "无人驾驶系列", keywords: ["科技视觉", "场景逻辑", "未来交通"], description: "用于智能驾驶与科技产品表达，重点建立清晰的场景逻辑和未来感视觉。", placeholder: "无人驾驶系列循环素材", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/autonomous.mp4?v=20260616-500k" },
        { title: "卡通游戏CG", keywords: ["角色风格", "趣味叙事", "游戏感"], description: "用于游戏化与动漫化内容表达，重点统一角色风格、动作表现和娱乐化情绪。", placeholder: "卡通游戏CG循环素材", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/game-cg.mp4?v=20260616-500k" },
      ],
      problemCards: [
        { title: "角色稳定", description: "人物形象、服装、姿态和状态在不同镜头中容易变化。" },
        { title: "空间清晰", description: "人物、道具、环境和运动方向需要保持连续关系。" },
        { title: "动作连贯", description: "前后镜头之间要有因果，不能只是好看的片段拼接。" },
        { title: "风格统一", description: "不同工具和提示词生成的画面，需要统一质感和视觉标准。" },
      ],
      horizontalFlow: [
        { title: "创意拆解", description: "明确内容目标、情绪方向和核心看点" },
        { title: "风格约束", description: "统一角色设定、画面质感、色调和视觉关键词" },
        { title: "脚本结构", description: "把想法拆成开头、推进、转折和收尾" },
        { title: "分镜控制", description: "规划镜头顺序、景别、动作和信息释放" },
        { title: "镜头生成", description: "按分镜生成素材，筛选可用镜头" },
        { title: "后期校准", description: "通过剪辑、调色、补镜头和节奏调整统一成片" },
        { title: "方法沉淀", description: "沉淀提示词、分镜模板、风格规范和验收标准" },
      ],
      valueCards: [
        { title: "降低上手门槛", description: "把复杂的 AI 视频制作拆成脚本、分镜、生成、筛选、剪辑等可执行步骤。" },
        { title: "统一产出标准", description: "通过提示词结构、风格规范、镜头模板和验收标准，减少产出差异。" },
        { title: "打通岗位协作", description: "让策划负责内容逻辑，设计负责视觉标准，剪辑负责节奏整合，运营负责传播反馈。" },
        { title: "推动组织进步", description: "把单个作品经验沉淀为团队方法，推动 AI 能力在更多项目和业务场景中扩散。" },
      ],
      videoLink: {
        title: "代表作品合集",
        subtitle: "AIGC视频方向探索",
        description: "覆盖校园宣传、真人产品、3D动画、无人驾驶与卡通游戏CG等多类视频方向，展示 AIGC 在不同内容场景中的生产适配能力。",
        buttonText: "观看完整视频 →",
        href: "/zh/portfolio",
      },
    },
    {
      id: "article-data",
      index: "04",
      tag: "网感表达",
      tagExtra: "教育类图文传播",
      title: "文章 /seo 数据展示",
      subtitle:
        "围绕 K12 教育、家庭教育与趣味知识方向进行图文选题包装，并通过多平台分发获得持续曝光，体现教育类内容的标题网感、用户情绪捕捉和平台适配能力。",
      projectInfo: undefined,
      metrics: [
        { value: "340万+", label: "图文曝光" },
        { value: "230万+", label: "单篇推荐" },
        { value: "17万+", label: "单篇阅读" },
      ],
      platformTags: ["公众号", "百家号", "一点号", "搜狐号", "大鱼号"],
      modules: [
        {
          index: "01",
          title: "热点文章部分展示",
          subtitle: "教育类图文多平台阅读、推荐与收藏数据展示。",
          content:
            "以下为过往教育类图文内容在企鹅号、百家号、一点号、趣头条、搜狐号、大鱼号等平台的部分数据展示。",
          type: "image-showcase",
        },
      ],
      showcaseImage: {
        segments: [
          { src: "/images/articles/article-data-1.jpg", width: 2400, height: 810 },
          { src: "/images/articles/article-data-2.jpg", width: 2400, height: 876 },
          { src: "/images/articles/article-data-3.jpg", width: 2400, height: 684 },
          { src: "/images/articles/article-data-4.jpg", width: 2400, height: 684 },
          { src: "/images/articles/article-data-5.jpg", width: 2400, height: 934 },
          { src: "/images/articles/article-data-6.jpg", width: 2400, height: 810 },
          { src: "/images/articles/article-data-7.jpg", width: 2400, height: 934 },
          { src: "/images/articles/article-data-8.jpg", width: 2400, height: 1244 },
        ],
        alt: "教育类图文内容多平台数据展示",
      },
    },
  ],
  en: [
    {
      id: "content-ops",
      index: "01",
      tag: "System Ops",
      tagExtra: "Education Brand Growth",
      title: "Content Operations System",
      subtitle:
        "Addressing four key challenges — exposure, trust, engagement, and conversion — by building a content matrix, brand identity, private-domain collaboration, and review mechanisms to transform scattered content into a sustainable enrollment growth system.",
      projectInfo:
        "Wuhan Canglong High School｜Brand Marketing / AI Video Creation",
      metrics: [
        { value: "9700+", label: "Followers Gained" },
        { value: "300+", label: "Annual Enrollment" },
        { value: "10M+", label: "Revenue Contribution" },
      ],
      platformTags: ["Douyin", "Channels", "WeChat OA", "Private Groups"],
      modules: [
        {
          index: "01",
          title: "Business Pain Points",
          subtitle: "School marketing isn't just about exposure — it's about building parent trust and driving enrollment.",
          content:
            "The conversion path in education is long; parents won't enroll from a single piece of content. The real challenge wasn't 'what to post' but how to ensure the school is <strong>consistently seen, trusted</strong>, and that inquiries are effectively <strong>handled and converted</strong>.",
          type: "pain-points",
        },
        {
          index: "02",
          title: "System Design",
          subtitle: "Operations System Model",
          content:
            "Breaking school content operations into three core solutions: platform matrix for exposure, brand identity for trust, and private-domain enrollment collaboration for engagement and conversion — forming a complete brand communication and enrollment growth chain.",
          type: "system-build",
        },
        {
          index: "03",
          title: "Operations Rhythm & Execution Loop",
          subtitle: "Turning content ops from ad-hoc publishing into a sustainable mechanism.",
          content:
            "After building the solution framework, the key is making it run steadily. Through monthly planning, weekly scheduling, content production, data feedback, and topic reviews, campus content operations evolve from spontaneous publishing into a continuously running mechanism.",
          type: "cycle",
        },
        {
          index: "04",
          title: "Results & Impact",
          subtitle: "Making content production truly serve enrollment growth.",
          type: "result",
        },
      ],
      painPoints: [
        { title: "Lack of Exposure", description: "School features, campus events, faculty strength, and academic results aren't being consistently seen." },
        { title: "Lack of Trust", description: "Parents have long decision cycles and need stable, authentic, continuous content to build trust." },
        { title: "Lack of Engagement", description: "After content sparks interest, there's no effective path into WeChat, groups, or consultation channels." },
        { title: "Lack of Conversion", description: "Enrollment leads require ongoing follow-up; content and admissions need to form a collaborative loop." },
      ],
      systemCards: [
        {
          title: "Platform Matrix",
          problem: "Solving lack of exposure",
          content: "Building multi-platform content presence through Douyin, Channels, and WeChat OA. Short video platforms drive rapid exposure, Channels leverage social trust, and WeChat OA provides deep content — preventing single-channel dependency.",
          tags: ["Douyin", "Channels", "WeChat OA", "Distribution", "Sustained Exposure"],
          diagram: "platform-radial",
        },
        {
          title: "Brand Identity",
          problem: "Solving lack of trust",
          content: "Education brands need to look professional, stable, and trustworthy. Through unified logo usage, VI colors, cover templates, video packaging, and recruitment materials, all external content maintains consistent brand quality.",
          tags: ["Logo", "VI Colors", "Cover Standards", "Video Packaging", "Materials", "Brand Trust"],
          diagram: "brand-assets",
        },
        {
          title: "Private Domain Collaboration",
          problem: "Solving lack of engagement & conversion",
          content: "After public content generates interest, comments, DMs, WeChat, and groups handle parent inquiries. Content team handles reach and lead collection; admissions team handles deep communication and conversion feedback, forming a collaborative loop.",
          tags: ["Comments/DMs", "WeChat", "Community", "Admissions Collaboration", "Lead Feedback", "Topic Optimization"],
          diagram: "swimlane",
        },
      ],
      cycleNodes: [
        { title: "Monthly Planning", description: "Align with enrollment dates, campus events, and trending topics" },
        { title: "Weekly Scheduling", description: "Break down short video, article, Channels, and WeChat OA publishing rhythm" },
        { title: "Content Production", description: "Scripts, filming, editing, covers, review, and publishing" },
        { title: "Data & Feedback", description: "Monitor views, engagement, DMs, inquiries, and community feedback" },
        { title: "Topic Optimization", description: "Feed high-frequency parent concerns back into next content cycle" },
      ],
      cycleSummary: {
        title: "Sustainable Operations Mechanism",
        content: "Through monthly planning, weekly scheduling, content execution, data feedback, and topic reviews, campus content operations evolve from ad-hoc publishing into a continuously running mechanism.",
        tags: ["Monthly Planning", "Weekly Scheduling", "Data Review", "Topic Optimization"],
      },
      resultSummary: {
        title: "From Scattered Publishing to Enrollment Growth System",
        content: "Formed a complete loop of 'platform exposure → brand trust → private domain → enrollment conversion → content review', transforming content from mere marketing collateral into a sustainable tool for customer acquisition, trust building, and enrollment results.",
        highlight: "Core value: Connecting content, brand, private domain, and admissions collaboration into one sustainable growth system.",
        metrics: [
          { value: "9700+", label: "Followers Gained", description: "Content matrix driving target audience growth" },
          { value: "300+", label: "Annual Enrollment", description: "Content and private domain jointly driving enrollment" },
          { value: "10M+", label: "Revenue Contribution", description: "Content operations ultimately serving business growth" },
        ],
      },
    },
    {
      id: "cold-start",
      index: "02",
      tag: "Viral Content",
      tagExtra: "Cold Start",
      title: "0-1 Launch",
      subtitle:
        "During the 0-1 account launch phase, leveraged user insights, competitor analysis, and content direction judgment to find a strategy of 'short, logical narrative, natural product integration' — producing the account's first viral video and breaking through from cold start to trending content.",
      projectInfo: "0-1 Launch Project｜Short Video Strategy / Script Writing",
      metrics: [
        { value: "2M+", label: "Single Video Views" },
        { value: "100K+", label: "Single Video Likes" },
        { value: "First Viral", label: "Cold Start Validation" },
      ],
      platformTags: [],
      modules: [
        {
          index: "01",
          title: "Project Background",
          subtitle: "In the 0-1 phase, the first viral hit isn't just about traffic — it validates direction.",
          content:
            "The account was in cold start with no stable content model or user awareness. The core value of the first viral video was validating content direction, user interests, and replicable video structure for sustained production.",
          type: "background",
        },
        {
          index: "02",
          title: "Industry Insights",
          subtitle: "Viral content isn't accidental — it's derived from users, platform, competitors, and product.",
          content:
            "Analysis showed users prefer real-life problems over hard ads; short video platforms favor fast pacing and strong results; competitors prove 'real scenarios + narrative immersion + clear selling points' perform best; products must appear naturally as problem-solving tools.",
          type: "insights",
        },
        {
          index: "03",
          title: "Content Strategy",
          subtitle: "Turning insights into a filmable, editable, publishable video structure.",
          content:
            "The video uses a light narrative structure: opening with a real-life problem, building immersion through character relationships, letting the product appear naturally as the solution, and closing with result feedback.",
          type: "strategy",
        },
        {
          index: "04",
          title: "Results & Impact",
          subtitle: "First viral hit validates cold start direction and deposits content model.",
          content:
            "This video achieved 2M+ views and 100K+ likes, but more importantly validated the cold start content direction: light narrative, fast pace, real scenarios, natural product integration. It provided a reference model for future topics and scripts.",
          type: "result-deposits",
        },
      ],
      backgroundPoints: [
        "0-1 account launch phase",
        "No stable content model",
        "Need to validate user interests",
        "Need to find replicable video structure",
      ],
      backgroundImages: [
        { label: "Account homepage screenshot", src: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/cold-start/account-profile.png" },
        { label: "Viral video screenshot", src: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/cold-start/viral-video.png" },
      ],
      insightCards: [
        { title: "User Insight", description: "Users don't want hard ads — they want to see a real-life problem being solved." },
        { title: "Platform Insight", description: "Short video platforms favor fast entry, strong conflict, light narrative, strong results." },
        { title: "Competitor Insight", description: "Real-person narratives build stronger immersion; real home scenarios spark more resonance." },
        { title: "Product Insight", description: "Products can't be forced in — they must appear naturally as problem-solving tools." },
      ],
      insightConclusion: {
        title: "Final Strategy",
        content: "Short · Logical narrative · Natural product integration",
      },
      strategyNodes: [
        { title: "Problem Hook", description: "Open with real-life pain points so users instantly know 'this relates to me'" },
        { title: "Light Narrative", description: "Use friend/user/designer relationships to reduce ad feeling" },
        { title: "Conflict Building", description: "Create reasons to keep watching through choice difficulty or spatial discord" },
        { title: "Product Entry", description: "Product appears naturally as the problem-solving tool" },
        { title: "Result Feedback", description: "Show before/after transformation and user satisfaction" },
      ],
      strategyImages: [
        { label: "Script output screenshot" },
        { label: "Storyboard screenshot" },
      ],
      resultSummary: {
        title: "First Viral Hit Validates Cold Start",
        content: "This video validated the cold start content direction: light narrative, fast pace, real scenarios, natural product integration.",
        highlight: "",
        metrics: [
          { value: "2M+", label: "Single Video Views" },
          { value: "100K+", label: "Single Video Likes" },
        ],
      },
      resultDeposits: [
        "Validated account content direction",
        "Confirmed user interest points",
        "Deposited light narrative script model",
        "Formed future topic reference",
      ],
    },
    {
      id: "aigc-system",
      index: "03",
      tag: "AIGC System",
      tagExtra: "Cross-scene Production",
      title: "AIGC Workflow & Team Enablement",
      subtitle:
        "Building production workflows from creative breakdown, storyboard control to generation calibration around AIGC video's core challenges in continuity, stability, and collaboration efficiency — transforming AI generation from single-asset output into reusable content production methods.",
      projectInfo: "AIGC Video Production｜Workflow Design / Content Direction / Team Enablement",
      metrics: [
        { value: "300%+", label: "Efficiency Gain" },
        { value: "500%+", label: "Capability Expansion" },
        { value: "300%+", label: "Cost Reduction" },
      ],
      platformTags: ["Campus", "Product", "3D Animation", "Autonomous Driving", "Game CG"],
      modules: [
        {
          index: "01",
          title: "Capability Coverage",
          subtitle: "Expanding from single content type to multi-direction video production.",
          content:
            "AIGC's value isn't just generating one style of video — it opens the boundaries of content production. Through practice and project exploration across different directions, validating AI's adaptation capability in campus marketing, product expression, animation narrative, tech visuals, and gamified content.",
          type: "video-cards",
        },
        {
          index: "02",
          title: "AIGC Production Challenges",
          subtitle: "AI can generate impressive single shots, but continuous content needs control.",
          content:
            "The real challenge in AIGC video isn't whether a single shot looks impactful, but whether characters, spaces, actions, and styles remain stable across multiple shots.",
          type: "problem-cards",
        },
        {
          index: "03",
          title: "Process Method",
          subtitle: "Build the control process first, then enter AI generation.",
          content:
            "Through upfront breakdown and process control, channeling AIGC's divergent generation into executable workflows. First clarify content logic, then break down shots and visual requirements, finally unify through generation screening, editing, and post-production.",
          type: "flow-horizontal",
        },
        {
          index: "04",
          title: "Team Enablement",
          subtitle: "Converting individual AI capability into team-understandable, executable, reusable methods.",
          content:
            "AIGC's value to teams isn't just making one person faster — it's changing how content collaboration works. Through workflow breakdown, template deposits, prompt standards, and acceptance criteria.",
          type: "value-cards",
        },
        {
          index: "05",
          title: "Featured Video Links",
          subtitle: "Click to view complete AIGC video works.",
          type: "video-link",
        },
      ],
      videoDirections: [
        { title: "Campus Promo Video", keywords: ["Real footage", "Timelapse", "Brand packaging"], description: "For campus marketing and event packaging, giving real footage stronger rhythm and distribution quality.", placeholder: "Campus video loop", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/campus.mp4?v=20260616-500k" },
        { title: "Product Video", keywords: ["Scene immersion", "Product expression", "Commercial short"], description: "For product showcase and marketing, letting products enter scenes naturally without forced placement.", placeholder: "Product video loop", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/product.mp4?v=20260616-500k" },
        { title: "3D Animation Short", keywords: ["Storyboard control", "Character consistency", "Narrative rhythm"], description: "For narrative visual content, focusing on character, space, action causality and camera rhythm control.", placeholder: "3D animation loop", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/animation.mp4?v=20260616-500k" },
        { title: "Autonomous Driving", keywords: ["Tech visuals", "Scene logic", "Future transport"], description: "For intelligent driving and tech product expression, building clear scene logic and futuristic visuals.", placeholder: "Autonomous driving loop", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/autonomous.mp4?v=20260616-500k" },
        { title: "Cartoon Game CG", keywords: ["Character style", "Fun narrative", "Game feel"], description: "For gamified and anime-style content, unifying character style, action performance, and entertainment emotion.", placeholder: "Game CG loop", videoUrl: "https://portfolio-gaoxinming-1305428454.cos.ap-beijing.myqcloud.com/site/cases/aigc/game-cg.mp4?v=20260616-500k" },
      ],
      problemCards: [
        { title: "Character Stability", description: "Character appearance, clothing, posture, and state easily change across different shots." },
        { title: "Spatial Clarity", description: "Characters, props, environment, and motion direction need to maintain continuous relationships." },
        { title: "Action Continuity", description: "Shots need causal connection, not just visually appealing fragments stitched together." },
        { title: "Style Unity", description: "Outputs from different tools and prompts need unified texture and visual standards." },
      ],
      horizontalFlow: [
        { title: "Creative Breakdown", description: "Clarify content goals, emotional direction, and core highlights" },
        { title: "Style Constraints", description: "Unify character design, visual texture, color tone, and visual keywords" },
        { title: "Script Structure", description: "Break ideas into opening, progression, turning point, and conclusion" },
        { title: "Storyboard Control", description: "Plan shot sequence, framing, actions, and information release" },
        { title: "Shot Generation", description: "Generate assets per storyboard, screen usable shots" },
        { title: "Post Calibration", description: "Unify through editing, color grading, supplementary shots, and rhythm adjustment" },
        { title: "Method Deposit", description: "Deposit prompts, storyboard templates, style specs, and acceptance standards" },
      ],
      valueCards: [
        { title: "Lower Entry Barrier", description: "Break complex AI video production into executable steps: script, storyboard, generation, screening, editing." },
        { title: "Unified Output Standards", description: "Reduce output variance through prompt structure, style specs, shot templates, and acceptance criteria." },
        { title: "Cross-role Collaboration", description: "Planning handles content logic, design handles visual standards, editing handles rhythm, operations handles distribution feedback." },
        { title: "Drive Organization Growth", description: "Deposit individual project experience into team methods, spreading AI capability across more projects and business scenarios." },
      ],
      videoLink: {
        title: "Featured Works Collection",
        subtitle: "AIGC Video Direction Exploration",
        description: "Covering campus marketing, product videos, 3D animation, autonomous driving, and cartoon game CG — showcasing AIGC's production adaptation capability across different content scenarios.",
        buttonText: "Watch Full Videos →",
        href: "/en/portfolio",
      },
    },
    {
      id: "article-data",
      index: "04",
      tag: "Content Sense",
      tagExtra: "Educational Content Distribution",
      title: "Article / SEO Data Showcase",
      subtitle:
        "Packaging educational content topics around K12, family education, and fun knowledge for multi-platform distribution, demonstrating headline sense, emotional resonance, and platform adaptation capabilities.",
      projectInfo: undefined,
      metrics: [
        { value: "3.4M+", label: "Content Impressions" },
        { value: "2.3M+", label: "Single Post Reach" },
        { value: "170K+", label: "Single Post Reads" },
      ],
      platformTags: ["WeChat OA", "Baijia", "Yidian", "Sohu", "Dayu"],
      modules: [
        {
          index: "01",
          title: "Top Articles Showcase",
          subtitle: "Multi-platform reading, recommendation, and collection data for educational content.",
          content:
            "Below shows partial data from past educational content distributed across Tencent, Baijia, Yidian, Qutoutiao, Sohu, Dayu and other platforms.",
          type: "image-showcase",
        },
      ],
      showcaseImage: {
        segments: [
          { src: "/images/articles/article-data-1.jpg", width: 2400, height: 810 },
          { src: "/images/articles/article-data-2.jpg", width: 2400, height: 876 },
          { src: "/images/articles/article-data-3.jpg", width: 2400, height: 684 },
          { src: "/images/articles/article-data-4.jpg", width: 2400, height: 684 },
          { src: "/images/articles/article-data-5.jpg", width: 2400, height: 934 },
          { src: "/images/articles/article-data-6.jpg", width: 2400, height: 810 },
          { src: "/images/articles/article-data-7.jpg", width: 2400, height: 934 },
          { src: "/images/articles/article-data-8.jpg", width: 2400, height: 1244 },
        ],
        alt: "Educational content multi-platform data showcase",
      },
    },
  ],
};

export function getCases(locale: Locale): CaseCardData[] {
  return casesData[locale];
}
