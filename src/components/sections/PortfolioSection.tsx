"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type PortfolioSectionProps = {
  works: WorkItem[];
  messages: Messages;
  locale: Locale;
};

const VIDEO_TABS = [
  { key: "全部", labelKey: "videoTabAll" as const },
  { key: "产品", labelKey: "videoTabProduct" as const },
  { key: "AI", labelKey: "videoTabAI" as const },
  { key: "校园", labelKey: "videoTabCampus" as const },
];

export default function PortfolioSection({ works, messages, locale }: PortfolioSectionProps) {
  const [activeTab, setActiveTab] = useState("全部");

  const videos = works.filter((w) => w.category === "video");
  const photos = works.filter((w) => w.category === "photo");

  const filteredVideos =
    activeTab === "全部"
      ? videos
      : videos.filter((w) => w.subcategory === activeTab);

  return (
    <section id="works" className="section">
      <div className="container">
        <RevealOnScroll className="section-head section-head-row">
          <span className="section-index">01</span>
          <h2 className="section-title">
            <span className="section-title-main">{messages.works.sectionTitle}</span>
            <span className="section-title-en"> / WORKS</span>
          </h2>
          <span className="section-spacer" />
        </RevealOnScroll>
        <div className="section-divider" />

        {/* 视频区 */}
        <div className="portfolio-block">
          <div className="video-tab-bar">
            {VIDEO_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`video-tab${activeTab === tab.key ? " video-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {messages.works[tab.labelKey]}
              </button>
            ))}
          </div>
          <div className="video-grid">
            {filteredVideos.map((work, i) => (
              <RevealOnScroll key={work.slug} delay={i * 60}>
                <Link href={`/${locale}/works/${work.slug}`} className="video-card">
                  <div className="video-card-thumb">
                    <Image
                      src={work.coverImage}
                      alt={work.title}
                      className="video-card-img"
                      width={800}
                      height={450}
                    />
                    {work.duration && (
                      <span className="video-card-duration">{work.duration}</span>
                    )}
                  </div>
                  <div className="video-card-info">
                    <p className="video-card-title">{work.title}</p>
                    <div className="video-card-meta">
                      <span className="video-card-platform">{work.platform}</span>
                      {work.subcategory && (
                        <span className="video-card-tag">{work.subcategory}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        {/* 照片区 */}
        <div className="portfolio-block">
          <div className="photo-section-header">
            <h3 className="photo-section-title">{messages.works.photo}</h3>
            <Link href={`/${locale}/photos`} className="photo-view-all hover-link">
              {messages.works.photoViewAll}
            </Link>
          </div>
          <div className="photo-grid">
            {photos.map((work, i) => (
              <RevealOnScroll key={work.slug} delay={i * 60}>
                <Link href={`/${locale}/works/${work.slug}`} className="photo-item">
                  <div className="photo-item-img-wrap">
                    <Image
                      src={work.coverImage}
                      alt={work.title}
                      className="photo-item-img"
                      width={400}
                      height={400}
                    />
                  </div>
                  <p className="photo-item-caption">{work.title}</p>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
