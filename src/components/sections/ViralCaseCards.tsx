"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CaseCardData } from "@/features/profile/data/case-details";
import CaseModalContent from "./CaseModalContent";

type Props = {
  cases: CaseCardData[];
};

export default function ViralCaseCards({ cases }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeCase = cases.find((c) => c.id === activeId);

  return (
    <>
      <div className="viral-cases">
        {cases.map((c) => (
          <motion.div
            key={c.id}
            layoutId={`case-card-${c.id}`}
            className={`viral-case-card${c.modules.length > 0 ? " has-detail" : ""}`}
            onClick={() => c.modules.length > 0 && setActiveId(c.id)}
            role={c.modules.length > 0 ? "button" : undefined}
            tabIndex={c.modules.length > 0 ? 0 : undefined}
          >
            <div className="viral-case-header">
              <span className="viral-case-index">{c.index}</span>
              <span className="viral-case-tag">{c.tag}</span>
            </div>
            <motion.h3
              layoutId={`case-title-${c.id}`}
              className="viral-case-title"
            >
              {c.title}
            </motion.h3>
            <p className="viral-case-subtitle">{c.subtitle}</p>
            {c.metrics.length > 0 && (
              <div className="viral-case-metrics">
                {c.metrics.map((m) => (
                  <span key={m.label} className="viral-case-metric">
                    <strong>{m.value}</strong> {m.label}
                  </span>
                ))}
              </div>
            )}
            {c.platformTags.length > 0 && (
              <div className="viral-case-platforms">
                {c.platformTags.join(" · ")}
              </div>
            )}
            {c.modules.length > 0 && (
              <span className="viral-case-arrow" aria-hidden="true">
                →
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal overlay */}
      <AnimatePresence>
        {activeCase && (
          <>
            <motion.div
              className="case-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveId(null)}
            />
            <div className="case-modal-wrapper">
              <motion.div
                layoutId={`case-card-${activeCase.id}`}
                className="case-modal"
              >
                {/* Modal header */}
                <div className="case-modal-header">
                  <div className="case-modal-header-left">
                    <span className="case-modal-index">
                      {activeCase.index} / {activeCase.tag}{activeCase.tagExtra ? ` / ${activeCase.tagExtra}` : ""}
                    </span>
                    <motion.h2
                      layoutId={`case-title-${activeCase.id}`}
                      className="case-modal-title"
                    >
                      {activeCase.title}
                    </motion.h2>
                    <p className="case-modal-subtitle">
                      {activeCase.subtitle}
                    </p>
                    {activeCase.projectInfo && (
                      <p className="case-modal-project">
                        {activeCase.projectInfo}
                      </p>
                    )}
                  </div>
                  <div className="case-modal-header-right">
                    {activeCase.metrics.map((m) => (
                      <div key={m.label} className="case-modal-metric">
                        <span className="case-modal-metric-value">
                          {m.value}
                        </span>
                        <span className="case-modal-metric-label">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close button */}
                <button
                  className="case-modal-close"
                  onClick={() => setActiveId(null)}
                  aria-label="关闭"
                >
                  ✕
                </button>

                {/* Content */}
                <div className="case-modal-body">
                  <CaseModalContent caseData={activeCase} />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
