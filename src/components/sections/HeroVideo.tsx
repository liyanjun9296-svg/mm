"use client";

import { useEffect, useRef } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setInitial = () => { video.currentTime = 1; };
    video.addEventListener("loadedmetadata", setInitial);
    if (video.readyState >= 1) video.currentTime = 1;

    const onMouseMove = (e: MouseEvent) => {
      if (!video.duration) return;
      const ratio = 1 - e.clientX / window.innerWidth;
      video.currentTime = ratio * video.duration;
    };

    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      video.removeEventListener("loadedmetadata", setInitial);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="hero-video"
      src="/videos/hero-scroll.mp4"
      muted
      playsInline
      preload="auto"
    />
  );
}
