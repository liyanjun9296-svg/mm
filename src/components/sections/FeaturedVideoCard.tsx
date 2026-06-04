"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import MediaVariantImage from "@/components/MediaVariantImage";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type FeaturedVideoCardProps = {
  work: WorkItem;
  layout: "large" | "compact";
  locale: Locale;
  messages: Messages;
};

function canHoverPreview() {
  // 暂时关闭 hover 预览以节省 COS 外网下行流量（每次 hover = 下载完整视频文件）
  return false;
}

export default function FeaturedVideoCard({
  work,
  layout,
  locale,
  messages,
}: FeaturedVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const thumbHeight = layout === "large" ? 260 : 200;

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }
    setProgress(video.currentTime / video.duration);
  };

  const handleMouseEnter = () => {
    if (!canHoverPreview() || !work.mediaUrl || videoFailed) {
      return;
    }
    setPreviewActive(true);
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (!videoLoaded) {
      video.src = work.mediaUrl;
      setVideoLoaded(true);
    }
    void video.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setPreviewActive(false);
    setProgress(0);
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.pause();
    video.currentTime = 0;
  };

  return (
    <RevealOnScroll>
      <Link
        href={`/${locale}/works/${work.slug}`}
        className={`featured-card featured-card--${layout}${previewActive ? " is-preview-active" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="featured-card-thumb" style={{ height: thumbHeight }}>
          <MediaVariantImage
            src={work.coverImage}
            variant="list"
            alt={work.title}
            className="featured-card-img featured-card-img--poster"
            width={800}
            height={450}
          />
          {work.mediaUrl && !videoFailed ? (
            <video
              ref={videoRef}
              className="featured-video-preview"
              muted
              playsInline
              loop
              preload="none"
              aria-hidden="true"
              onTimeUpdate={handleTimeUpdate}
              onError={() => {
                // 视频加载失败:停止后续 hover 预览尝试,避免反复重试浪费流量
                const video = videoRef.current;
                if (video) {
                  video.removeAttribute("src");
                  video.load();
                }
                setVideoFailed(true);
                setPreviewActive(false);
              }}
            />
          ) : null}
          {work.mediaUrl ? (
            <div className="featured-video-timeline" aria-hidden="true">
              <div
                className="featured-video-timeline-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          ) : null}
          {work.duration ? (
            <span className="video-card-duration">{work.duration}</span>
          ) : null}
        </div>
        <div className="featured-card-info">
          <p className="featured-card-title">{work.title}</p>
          <span className="featured-card-tag">{messages.portfolio.tagVideo}</span>
        </div>
      </Link>
    </RevealOnScroll>
  );
}
