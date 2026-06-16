"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MediaVariantImage from "@/components/MediaVariantImage";
import { useSearchParams } from "next/navigation";
import { mergeVideoTabCategories } from "@/features/portfolio/utils/mergeCategories";
import PhotoMasonryGrid from "@/components/sections/PhotoMasonryGrid";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type HubTab = "video" | "photo" | "article";

type PortfolioHubClientProps = {
  works: WorkItem[];
  videoCategories: string[];
  photoCategories: string[];
  messages: Messages;
  locale: Locale;
};

export default function PortfolioHubClient({
  works,
  videoCategories,
  photoCategories,
  messages,
  locale,
}: PortfolioHubClientProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as HubTab | null) ?? "video";
  const [mainTab, setMainTab] = useState<HubTab>(
    initialTab === "photo" || initialTab === "article" ? initialTab : "video",
  );
  const [videoTab, setVideoTab] = useState("全部");
  const [photoTab, setPhotoTab] = useState("全部");

  const videos = works.filter((w) => w.category === "video");
  const photos = works.filter((w) => w.category === "photo");
  const articles = works.filter((w) => w.category === "article");

  const tabCategories = useMemo(
    () => mergeVideoTabCategories(videoCategories, videos.map((w) => w.subcategory)),
    [videoCategories, videos],
  );

  const photoTabCategories = useMemo(
    () => mergeVideoTabCategories(photoCategories, photos.map((w) => w.subcategory)),
    [photoCategories, photos],
  );

  const filteredVideos =
    videoTab === "全部" ? videos : videos.filter((w) => w.subcategory === videoTab);

  const filteredPhotos =
    photoTab === "全部" ? photos : photos.filter((w) => w.subcategory === photoTab);

  return (
    <>
      <div className="portfolio-hub-tabs">
        <button
          type="button"
          className={`portfolio-hub-tab${mainTab === "video" ? " portfolio-hub-tab--active" : ""}`}
          onClick={() => setMainTab("video")}
        >
          {messages.portfolio.hubVideo}
        </button>
        <button
          type="button"
          className={`portfolio-hub-tab${mainTab === "photo" ? " portfolio-hub-tab--active" : ""}`}
          onClick={() => setMainTab("photo")}
        >
          {messages.portfolio.hubPhoto}
        </button>
        <button
          type="button"
          className={`portfolio-hub-tab${mainTab === "article" ? " portfolio-hub-tab--active" : ""}`}
          onClick={() => setMainTab("article")}
        >
          {messages.portfolio.hubArticle}
        </button>
      </div>

      {mainTab === "video" ? (
        <>
          <div className="video-tab-bar">
            <button
              className={`video-tab${videoTab === "全部" ? " video-tab--active" : ""}`}
              onClick={() => setVideoTab("全部")}
            >
              {messages.works.videoTabAll}
            </button>
            {tabCategories.map((category) => (
              <button
                key={category}
                className={`video-tab${videoTab === category ? " video-tab--active" : ""}`}
                onClick={() => setVideoTab(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="video-grid">
            {filteredVideos.map((work) => (
              <Link
                key={work.slug}
                href={`/${locale}/works/${work.slug}`}
                className={`video-card${work.platform ? "" : " video-card--no-platform"}`}
                prefetch={false}
              >
                <div className="video-card-thumb">
                  <MediaVariantImage
                    src={work.coverImage}
                    variant="list"
                    alt={work.title}
                    className="video-card-img"
                    width={800}
                    height={450}
                  />
                  {work.duration ? (
                    <span className="video-card-duration">{work.duration}</span>
                  ) : null}
                </div>
                <div className="video-card-info">
                  <p className="video-card-title">{work.title}</p>
                  <div className="video-card-meta">
                    {work.platform ? (
                      <span className="video-card-platform">{work.platform}</span>
                    ) : null}
                    {work.subcategory ? (
                      <span className="video-card-tag">{work.subcategory}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {mainTab === "photo" ? (
        <>
          <div className="video-tab-bar">
            <button
              className={`video-tab${photoTab === "全部" ? " video-tab--active" : ""}`}
              onClick={() => setPhotoTab("全部")}
            >
              {messages.works.videoTabAll}
            </button>
            {photoTabCategories.map((category) => (
              <button
                key={category}
                className={`video-tab${photoTab === category ? " video-tab--active" : ""}`}
                onClick={() => setPhotoTab(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <PhotoMasonryGrid works={filteredPhotos} locale={locale} messages={messages} />
        </>
      ) : null}

      {mainTab === "article" ? (
        <div className="article-list">
          {articles.map((work) => (
            <article key={work.slug} className="article-card">
              {work.coverImage ? (
                <div className="article-card-cover">
                  <MediaVariantImage
                    src={work.coverImage}
                    variant="list"
                    alt=""
                    width={320}
                    height={180}
                  />
                </div>
              ) : null}
              <div className="article-card-body">
                <h3>{work.title}</h3>
                {work.subtitle ? <p className="article-card-sub">{work.subtitle}</p> : null}
                <p className="article-card-desc">{work.description}</p>
                {work.externalUrl ? (
                  <a
                    href={work.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="work-link"
                  >
                    {messages.contact.openLink}
                  </a>
                ) : (
                  <Link href={`/${locale}/works/${work.slug}`} className="work-link" prefetch={false}>
                    {messages.works.openDetail}
                  </Link>
                )}
              </div>
            </article>
          ))}
          {articles.length === 0 ? (
            <p className="admin-desc">{messages.portfolio.noArticles}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
