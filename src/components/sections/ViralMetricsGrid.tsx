"use client";

import { useState } from "react";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import type { ViralMetric } from "@/features/profile/data/viral-hits";

type Props = {
  metrics: ViralMetric[];
};

export default function ViralMetricsGrid({ metrics }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="viral-metrics">
      {metrics.map((m, i) => (
        <RevealOnScroll key={m.label} className="viral-metric-item" delay={i * 80}>
          <div
            className={`viral-metric-card${hovered === i ? " is-hovered" : ""}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="viral-metric-value">{m.value}</span>
            <span className="viral-metric-label">{m.label}</span>
            {/* Tooltip-style description overlay */}
            <span className="viral-metric-desc">{m.description}</span>
          </div>
        </RevealOnScroll>
      ))}
    </div>
  );
}
