"use client";

import { useSyncExternalStore } from "react";

const HERO_MODE_KEY = "portfolio-hero-mode";

export type HeroMode = "static" | "video";

function getSnapshot(): HeroMode {
  return (localStorage.getItem(HERO_MODE_KEY) as HeroMode) || "video";
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function getHeroMode(): HeroMode {
  if (typeof window === "undefined") return "video";
  return getSnapshot();
}

export function setHeroMode(mode: HeroMode) {
  localStorage.setItem(HERO_MODE_KEY, mode);
  window.dispatchEvent(new Event("storage"));
}

export default function HeroModeToggle() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => "video" as HeroMode);

  return (
    <div className="admin-hero-toggle">
      <span className="admin-hero-toggle-label">Hero 模式：</span>
      <button
        className={`admin-hero-toggle-btn ${mode === "static" ? "active" : ""}`}
        onClick={() => setHeroMode("static")}
      >
        静态图片
      </button>
      <button
        className={`admin-hero-toggle-btn ${mode === "video" ? "active" : ""}`}
        onClick={() => setHeroMode("video")}
      >
        动态交互
      </button>
    </div>
  );
}
