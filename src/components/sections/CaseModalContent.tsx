"use client";

import { motion } from "framer-motion";
import type { CaseCardData } from "@/features/profile/data/case-details";

type Props = {
  caseData: CaseCardData;
};

/* ── Pain Points: 4 circles with connectors ── */
function PainPointsModule({ caseData }: Props) {
  if (!caseData.painPoints) return null;
  return (
    <div className="case-pain-points">
      {caseData.painPoints.map((p, i) => (
        <div key={p.title} className="case-pain-point-wrapper">
          <div className="case-pain-circle">
            <span className="case-pain-title">{p.title}</span>
            <span className="case-pain-desc">{p.description}</span>
          </div>
          {i < (caseData.painPoints?.length ?? 0) - 1 && (
            <span className="case-pain-connector" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Platform Radial Diagram ── */
function PlatformRadialDiagram() {
  return (
    <div className="diagram-radial">
      <div className="diagram-radial-center">校区品牌内容</div>
      <div className="diagram-radial-nodes">
        <div className="diagram-radial-node">
          <span className="diagram-radial-dot" />
          <span className="diagram-radial-label">抖音</span>
          <span className="diagram-radial-sub">短视频曝光</span>
        </div>
        <div className="diagram-radial-node">
          <span className="diagram-radial-dot" />
          <span className="diagram-radial-label">视频号</span>
          <span className="diagram-radial-sub">熟人生态传播</span>
        </div>
        <div className="diagram-radial-node">
          <span className="diagram-radial-dot" />
          <span className="diagram-radial-label">公众号</span>
          <span className="diagram-radial-sub">深度内容沉淀</span>
        </div>
      </div>
    </div>
  );
}

/* ── Brand Assets Diagram ── */
function BrandAssetsDiagram() {
  return (
    <div className="diagram-brand">
      <div className="diagram-brand-logo">Logo System</div>
      <div className="diagram-brand-colors">
        <span className="diagram-brand-swatch" style={{ background: "#11332F" }} />
        <span className="diagram-brand-swatch" style={{ background: "#1a5c4a" }} />
        <span className="diagram-brand-swatch" style={{ background: "#A3BABB" }} />
        <span className="diagram-brand-swatch" style={{ background: "#CFB581" }} />
      </div>
      <div className="diagram-brand-text-colors">
        <span className="diagram-brand-text-swatch" style={{ background: "#111111" }} />
        <span className="diagram-brand-text-swatch" style={{ background: "#333333" }} />
        <span className="diagram-brand-text-swatch" style={{ background: "#555555" }} />
        <span className="diagram-brand-text-swatch" style={{ background: "#999999" }} />
      </div>
      <div className="diagram-brand-templates">
        <span className="diagram-brand-tpl">公众号封面</span>
        <span className="diagram-brand-tpl">短视频封面</span>
        <span className="diagram-brand-tpl">招生海报</span>
      </div>
    </div>
  );
}

/* ── Swimlane Diagram ── */
function SwimlaneDiagram() {
  return (
    <div className="diagram-swimlane">
      <div className="diagram-swim-lane">
        <span className="diagram-swim-label">内容运营</span>
        <div className="diagram-swim-nodes">
          <span>内容发布</span>
          <span>评论/私信引导</span>
          <span>微信/社群承接</span>
          <span>线索整理</span>
          <span>内容复盘</span>
        </div>
      </div>
      <div className="diagram-swim-connections">
        <span>线索交接</span>
        <span>咨询反馈</span>
        <span>反哺选题</span>
      </div>
      <div className="diagram-swim-lane">
        <span className="diagram-swim-label">招生老师</span>
        <div className="diagram-swim-nodes">
          <span>咨询接待</span>
          <span>家长答疑</span>
          <span>邀约到访</span>
          <span>报名转化</span>
          <span>反馈高频问题</span>
        </div>
      </div>
    </div>
  );
}

/* ── System Build Module ── */
function SystemBuildModule({ caseData }: Props) {
  if (!caseData.systemCards) return null;
  const diagrams: Record<string, () => React.ReactElement> = {
    "platform-radial": PlatformRadialDiagram,
    "brand-assets": BrandAssetsDiagram,
    swimlane: SwimlaneDiagram,
  };
  return (
    <div className="case-system-cards">
      {caseData.systemCards.map((card) => {
        const Diagram = diagrams[card.diagram];
        return (
          <div key={card.title} className="case-system-card">
            <div className="case-system-card-text">
              <span className="case-system-card-problem">{card.problem}</span>
              <h4>{card.title}</h4>
              <p>{card.content}</p>
              <div className="case-system-card-tags">
                {card.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <div className="case-system-card-diagram">
              {Diagram && <Diagram />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Cycle Module ── */
function CycleModule({ caseData }: Props) {
  if (!caseData.cycleNodes) return null;
  return (
    <div className="case-cycle">
      <div className="case-cycle-ring">
        <div className="case-cycle-center">持续运营机制</div>
        <div className="case-cycle-nodes">
          {caseData.cycleNodes.map((node, i) => (
            <div
              key={node.title}
              className="case-cycle-node"
              style={{ "--idx": i, "--total": caseData.cycleNodes!.length } as React.CSSProperties}
            >
              <span className="case-cycle-node-title">{node.title}</span>
              <span className="case-cycle-node-desc">{node.description}</span>
            </div>
          ))}
        </div>
      </div>
      {caseData.cycleSummary && (
        <div className="case-cycle-summary">
          <h4>{caseData.cycleSummary.title}</h4>
          <p>{caseData.cycleSummary.content}</p>
          <div className="case-cycle-tags">
            {caseData.cycleSummary.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Result Module ── */
function ResultModule({ caseData }: Props) {
  if (!caseData.resultSummary) return null;
  const r = caseData.resultSummary;
  return (
    <div className="case-result">
      <div className="case-result-text">
        <h4>{r.title}</h4>
        <p>{r.content}</p>
        {r.highlight && <span className="case-result-highlight">{r.highlight}</span>}
      </div>
      <div className="case-result-metrics">
        {r.metrics.map((m) => (
          <div key={m.label} className="case-result-metric">
            <span className="case-result-value">{m.value}</span>
            <span className="case-result-label">{m.label}</span>
            {m.description && (
              <span className="case-result-desc">{m.description}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Background Module: text points + image placeholders ── */
function BackgroundModule({ caseData }: Props) {
  if (!caseData.backgroundPoints) return null;
  return (
    <div className="case-background">
      <div className="case-background-points">
        {caseData.backgroundPoints.map((p) => (
          <div key={p} className="case-background-point">{p}</div>
        ))}
      </div>
      <div className="case-background-images">
        {(caseData.backgroundImages ?? []).map((img) => (
          <div key={img.label} className="case-background-img-placeholder">
            <span>{img.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Insights Module: 4 cards + conclusion ── */
function InsightsModule({ caseData }: Props) {
  if (!caseData.insightCards) return null;
  return (
    <div className="case-insights">
      <div className="case-insight-cards">
        {caseData.insightCards.map((card) => (
          <div key={card.title} className="case-insight-card">
            <h4>{card.title}</h4>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
      {caseData.insightConclusion && (
        <div className="case-insight-conclusion">
          <span className="case-insight-conclusion-title">{caseData.insightConclusion.title}</span>
          <span className="case-insight-conclusion-content">{caseData.insightConclusion.content}</span>
        </div>
      )}
    </div>
  );
}

/* ── Strategy Module: flow nodes + image placeholders ── */
function StrategyModule({ caseData }: Props) {
  if (!caseData.strategyNodes) return null;
  return (
    <div className="case-strategy">
      <div className="case-strategy-flow">
        {caseData.strategyNodes.map((node, i) => (
          <div key={node.title} className="case-strategy-node">
            <div className="case-strategy-dot" />
            <div className="case-strategy-node-text">
              <span className="case-strategy-node-title">{node.title}</span>
              <span className="case-strategy-node-desc">{node.description}</span>
            </div>
            {i < (caseData.strategyNodes?.length ?? 0) - 1 && (
              <span className="case-strategy-connector" />
            )}
          </div>
        ))}
      </div>
      <div className="case-strategy-images">
        {(caseData.strategyImages ?? []).map((img) => (
          <div key={img.label} className="case-strategy-img-placeholder">
            <span>{img.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Result Deposits Module: left metrics + right deposits list ── */
function ResultDepositsModule({ caseData }: Props) {
  if (!caseData.resultSummary && !caseData.resultDeposits) return null;
  return (
    <div className="case-result-deposits">
      <div className="case-result-deposits-metrics">
        {caseData.resultSummary?.metrics.map((m) => (
          <div key={m.label} className="case-result-metric">
            <span className="case-result-value">{m.value}</span>
            <span className="case-result-label">{m.label}</span>
          </div>
        ))}
      </div>
      {caseData.resultDeposits && (
        <div className="case-result-deposits-list">
          {caseData.resultDeposits.map((d) => (
            <div key={d} className="case-result-deposit-item">{d}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Video Cards Module: horizontal scroll 5 cards ── */
function VideoCardsModule({ caseData }: Props) {
  if (!caseData.videoDirections) return null;
  return (
    <div className="case-video-cards">
      {caseData.videoDirections.map((card) => (
        <div key={card.title} className="case-video-card">
          {card.videoUrl ? (
            <video
              className="case-video-card-video"
              src={card.videoUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="case-video-card-placeholder">
              <span>{card.placeholder}</span>
            </div>
          )}
          <div className="case-video-card-text">
            <h4>{card.title}</h4>
            <p>{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Problem Cards Module ── */
function ProblemCardsModule({ caseData }: Props) {
  if (!caseData.problemCards) return null;
  return (
    <div className="case-problem-cards">
      {caseData.problemCards.map((card) => (
        <div key={card.title} className="case-problem-card">
          <h4>{card.title}</h4>
          <p>{card.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Horizontal Flow Module ── */
function FlowHorizontalModule({ caseData }: Props) {
  if (!caseData.horizontalFlow) return null;
  return (
    <div className="case-flow-horizontal">
      {caseData.horizontalFlow.map((node, i) => (
        <div key={node.title} className="case-flow-h-node-wrapper">
          <div className="case-flow-h-node">
            <span className="case-flow-h-title">{node.title}</span>
            <span className="case-flow-h-desc">{node.description}</span>
          </div>
          {i < (caseData.horizontalFlow?.length ?? 0) - 1 && (
            <span className="case-flow-h-arrow">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Value Cards Module ── */
function ValueCardsModule({ caseData }: Props) {
  if (!caseData.valueCards) return null;
  return (
    <div className="case-value-cards">
      {caseData.valueCards.map((card) => (
        <div key={card.title} className="case-value-card">
          <h4>{card.title}</h4>
          <p>{card.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Video Link Module ── */
function VideoLinkModule({ caseData }: Props) {
  if (!caseData.videoLink) return null;
  const link = caseData.videoLink;
  return (
    <div className="case-video-link">
      <div className="case-video-link-text">
        <h4>{link.title}</h4>
        <span className="case-video-link-subtitle">{link.subtitle}</span>
        <p>{link.description}</p>
      </div>
      <a href={link.href} className="case-video-link-btn">{link.buttonText}</a>
    </div>
  );
}

/* ── Image Showcase Module ── */
function ImageShowcaseModule({ caseData }: Props) {
  if (!caseData.showcaseImage) return null;
  return (
    <div className="case-image-showcase">
      <div className="case-image-showcase-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={caseData.showcaseImage.src}
          alt={caseData.showcaseImage.alt}
          className="case-image-showcase-img"
        />
      </div>
    </div>
  );
}

export default function CaseModalContent({ caseData }: Props) {
  return (
    <div className="case-modules">
      {caseData.modules.map((mod, i) => (
        <motion.div
          key={mod.index}
          className={`case-module case-module--${mod.type}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
        >
          <div className="case-module-header">
            <span className="case-module-index">{mod.index}</span>
            <h3 className="case-module-title">{mod.title}</h3>
          </div>
          <p className="case-module-subtitle">{mod.subtitle}</p>
          {mod.content && (
            <p className="case-module-content" dangerouslySetInnerHTML={{ __html: mod.content }} />
          )}

          {mod.type === "pain-points" && <PainPointsModule caseData={caseData} />}
          {mod.type === "system-build" && <SystemBuildModule caseData={caseData} />}
          {mod.type === "cycle" && <CycleModule caseData={caseData} />}
          {mod.type === "result" && <ResultModule caseData={caseData} />}
          {mod.type === "background" && <BackgroundModule caseData={caseData} />}
          {mod.type === "insights" && <InsightsModule caseData={caseData} />}
          {mod.type === "strategy" && <StrategyModule caseData={caseData} />}
          {mod.type === "result-deposits" && <ResultDepositsModule caseData={caseData} />}
          {mod.type === "image-showcase" && <ImageShowcaseModule caseData={caseData} />}
          {mod.type === "video-cards" && <VideoCardsModule caseData={caseData} />}
          {mod.type === "problem-cards" && <ProblemCardsModule caseData={caseData} />}
          {mod.type === "flow-horizontal" && <FlowHorizontalModule caseData={caseData} />}
          {mod.type === "value-cards" && <ValueCardsModule caseData={caseData} />}
          {mod.type === "video-link" && <VideoLinkModule caseData={caseData} />}

          {/* Legacy support for other cases */}
          {mod.type === "text-image" && (
            <div className="case-module-text-image">
              <div className="case-module-text">
                <p>{mod.content}</p>
              </div>
              {mod.imagePlaceholder && (
                <div className="case-module-image-placeholder">
                  <span>{mod.imagePlaceholder}</span>
                </div>
              )}
            </div>
          )}
          {mod.type === "model" && caseData.modelCards && (
            <div className="case-model-grid">
              {caseData.modelCards.map((card, ci) => (
                <div key={card.title} className="case-model-card-wrapper">
                  <div className="case-model-card">
                    <h4>{card.title}</h4>
                    <p>{card.description}</p>
                    <div className="case-model-tags">
                      {card.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                  {ci < (caseData.modelCards?.length ?? 0) - 1 && (
                    <span className="case-model-arrow">→</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {mod.type === "flow" && caseData.flowNodes && (
            <div className="case-flow">
              {caseData.flowNodes.map((node, ni) => (
                <div key={node.title} className="case-flow-node-wrapper">
                  <div className="case-flow-node">
                    <div className="case-flow-dot" />
                    <span className="case-flow-title">{node.title}</span>
                    <span className="case-flow-details">{node.details}</span>
                  </div>
                  {ni < (caseData.flowNodes?.length ?? 0) - 1 && (
                    <span className="case-flow-connector" />
                  )}
                </div>
              ))}
              <div className="case-flow-loop" aria-label="闭环回到起点">↩</div>
            </div>
          )}
          {mod.type === "summary" && (
            <div className="case-summary">
              <div className="case-summary-text">
                <p>{mod.content}</p>
              </div>
              <div className="case-summary-metrics">
                {caseData.metrics.map((m) => (
                  <div key={m.label} className="case-summary-metric">
                    <span className="case-summary-value">{m.value}</span>
                    <span className="case-summary-label">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
