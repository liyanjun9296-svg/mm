"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { CaseCardData } from "@/features/profile/data/case-details";

// 弹窗内容(534 行)只在点击案例卡后需要,懒加载移出首屏 bundle
const CaseModalContent = dynamic(() => import("./CaseModalContent"), {
  loading: () => (
    <p className="admin-desc" role="status">
      加载中…
    </p>
  ),
});

type Props = {
  cases: CaseCardData[];
};

export default function ViralCaseCards({ cases }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobileSheet, setIsMobileSheet] = useState(false);
  const activeCase = cases.find((c) => c.id === activeId);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const syncMobileSheet = () => setIsMobileSheet(media.matches);

    syncMobileSheet();
    media.addEventListener("change", syncMobileSheet);

    return () => {
      media.removeEventListener("change", syncMobileSheet);
    };
  }, []);

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [activeId]);

  useEffect(() => {
    if (!isMobileSheet || !activeId) {
      return;
    }

    const setSheetHeight = () => {
      document.documentElement.style.setProperty("--case-sheet-height", `${window.innerHeight * 0.9}px`);
    };

    setSheetHeight();
    window.addEventListener("resize", setSheetHeight);
    window.visualViewport?.addEventListener("resize", setSheetHeight);

    return () => {
      window.removeEventListener("resize", setSheetHeight);
      window.visualViewport?.removeEventListener("resize", setSheetHeight);
      document.documentElement.style.removeProperty("--case-sheet-height");
    };
  }, [activeId, isMobileSheet]);

  const modalOverlay = (
    <AnimatePresence>
      {activeCase && (
        <>
          <motion.div
            className="case-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveId(null)}
            onTouchMove={(event) => event.preventDefault()}
          />
          <div
            className="case-modal-wrapper"
            onClick={() => setActiveId(null)}
            onTouchMove={(event) => {
              if (event.target === event.currentTarget) {
                event.preventDefault();
              }
            }}
          >
            <motion.div
              layoutId={isMobileSheet ? undefined : `case-card-${activeCase.id}`}
              className="case-modal"
              onClick={(event) => event.stopPropagation()}
              {...(isMobileSheet
                ? {
                    initial: { y: "100%" },
                    animate: { y: 0 },
                    exit: { y: "100%" },
                    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
                  }
                : {})}
            >
              {/* Close button - sticky inside modal */}
              <button
                className="case-modal-close"
                onClick={() => setActiveId(null)}
                aria-label="关闭"
              >
                ✕
              </button>

              {/* Modal header */}
              <div className="case-modal-header">
                <div className="case-modal-header-left">
                  <span className="case-modal-index">
                    {activeCase.index} / {activeCase.tag}{activeCase.tagExtra ? ` / ${activeCase.tagExtra}` : ""}
                  </span>
                  <h2 className="case-modal-title">
                    {activeCase.title}
                  </h2>
                  <p className="case-modal-subtitle" dangerouslySetInnerHTML={{ __html: activeCase.subtitle }} />
                  {activeCase.projectInfo && (
                    <p className="case-modal-project">
                      {activeCase.projectInfo}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="case-modal-body">
                <div className="case-modal-mobile-intro">
                  <p className="case-modal-subtitle" dangerouslySetInnerHTML={{ __html: activeCase.subtitle }} />
                  {activeCase.projectInfo && (
                    <p className="case-modal-project">
                      {activeCase.projectInfo}
                    </p>
                  )}
                </div>
                <CaseModalContent caseData={activeCase} />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="viral-cases">
        {cases.map((c) => (
          <motion.div
            key={c.id}
            layoutId={isMobileSheet ? undefined : `case-card-${c.id}`}
            className={`viral-case-card${c.modules.length > 0 ? " has-detail" : ""}`}
            onClick={() => c.modules.length > 0 && setActiveId(c.id)}
            role={c.modules.length > 0 ? "button" : undefined}
            tabIndex={c.modules.length > 0 ? 0 : undefined}
          >
            <div className="viral-case-header">
              <span className="viral-case-index">{c.index}</span>
              <span className="viral-case-tag">{c.tag}</span>
            </div>
            <h3 className="viral-case-title">
              {c.title}
            </h3>
            <p className="viral-case-subtitle" dangerouslySetInnerHTML={{ __html: c.subtitle }} />
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
                <svg viewBox="0 0 30 30" focusable="false">
                  <path d="M11.9876 3.276L23.7116 15L11.9876 26.724" />
                </svg>
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {isMobileSheet && typeof document !== "undefined" ? createPortal(modalOverlay, document.body) : modalOverlay}
    </>
  );
}
