"use client";

import { useEffect, useRef } from "react";
import GravityCapabilityCard from "@/components/motion/GravityCapabilityCard";
import { capabilities } from "@/features/profile/data/capabilities";

const ENTRANCE_VARIANTS = ["cap-entrance-left", "cap-entrance-center", "cap-entrance-right"] as const;

function CapabilityIcon({ type }: { type: "camera" | "spark" | "chart" }) {
  if (type === "spark") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (type === "chart") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 18V6M10 18V10M16 18V14M22 18V4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h4l2-3h4l2 3h4v12H4V7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function CapabilitiesGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      grid.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(grid);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={gridRef} className="capabilities-grid">
      {capabilities.map((item, index) => (
        <div key={item.id} className={`cap-entrance ${ENTRANCE_VARIANTS[index] ?? "cap-entrance-center"}`}>
          <GravityCapabilityCard className="cap-card">
            <div className="cap-card-glow" aria-hidden="true" />
            <div className="cap-card-icon">
              <CapabilityIcon type={item.icon} />
            </div>
            <h3 className="cap-card-title">{item.title}</h3>
            <p className="cap-card-body">{item.body}</p>
            <div className="cap-card-divider" />
            <p className="cap-card-mono">{item.monoTag}</p>
            <div className="cap-card-tags">
              {item.tags.map((tag) => (
                <span key={tag} className="cap-card-tag">
                  {tag}
                </span>
              ))}
            </div>
          </GravityCapabilityCard>
        </div>
      ))}
    </div>
  );
}
