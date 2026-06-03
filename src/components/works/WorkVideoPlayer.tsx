"use client";

import { useEffect, useRef, useState } from "react";

type Quality = "low" | "original";

type WorkVideoPlayerProps = {
  src: string; // 1080p 低档(默认播放);空字符串表示 raw-only(待处理),不渲染播放器
  srcOriginal?: string; // 原片(faststart 后),提供时显示「原画质」切换按钮
  poster?: string;
  unavailableLabel: string;
  processingLabel: string;
  switchToOriginalLabel: string;
  switchToLowLabel: string;
};

/**
 * 详情页视频播放器:
 * - mediaUrl 为空 → 显示「视频处理中」占位(raw-only:已上传原片但 CLI 未跑,前台不播)。
 * - 错误兜底:onError 立刻清 src,杜绝浏览器 Range 死循环。
 * - 双档切换:srcOriginal 存在时,右下角按钮在「1080p ↔ 原画质」之间切,记录 currentTime + 是否 paused 续播。
 */
export default function WorkVideoPlayer({
  src,
  srcOriginal,
  poster,
  unavailableLabel,
  processingLabel,
  switchToOriginalLabel,
  switchToLowLabel,
}: WorkVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [quality, setQuality] = useState<Quality>("low");

  // 切换档位时:把上一档的 currentTime/paused 记下,在 loadedmetadata 后无缝续播
  const resumeStateRef = useRef<{ time: number; paused: boolean } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const resume = resumeStateRef.current;
    if (!resume) return;

    const onLoaded = () => {
      try {
        video.currentTime = Math.max(0, resume.time);
        if (!resume.paused) {
          void video.play().catch(() => {});
        }
      } finally {
        resumeStateRef.current = null;
      }
    };
    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [quality]);

  if (!src) {
    return (
      <div className="detail-video-fallback" role="status">
        {processingLabel}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="detail-video-fallback" role="alert">
        {unavailableLabel}
      </div>
    );
  }

  const currentSrc = quality === "original" && srcOriginal ? srcOriginal : src;
  const canSwitch = !!srcOriginal && srcOriginal !== src;

  function toggleQuality() {
    const video = videoRef.current;
    if (video) {
      resumeStateRef.current = {
        time: video.currentTime || 0,
        paused: video.paused,
      };
    }
    setQuality((q) => (q === "low" ? "original" : "low"));
  }

  return (
    <div className="detail-video-wrap">
      <video
        ref={videoRef}
        controls
        preload="metadata"
        src={currentSrc}
        poster={poster}
        onError={() => {
          const video = videoRef.current;
          // 关键:把 src 清空,浏览器立刻停止任何后台 Range 请求,杜绝死循环
          if (video) {
            video.removeAttribute("src");
            video.load();
          }
          setFailed(true);
        }}
      />
      {canSwitch ? (
        <button
          type="button"
          className="detail-video-quality"
          onClick={toggleQuality}
          aria-label={quality === "low" ? switchToOriginalLabel : switchToLowLabel}
        >
          {quality === "low" ? switchToOriginalLabel : switchToLowLabel}
        </button>
      ) : null}
    </div>
  );
}
