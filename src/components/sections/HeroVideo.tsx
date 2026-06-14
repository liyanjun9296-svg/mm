"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import lottie, { type AnimationItem } from "lottie-web";
export default function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "/lottie/hero.json",
    });
    animRef.current = anim;

    const onMouseMove = (e: MouseEvent) => {
      if (!anim.totalFrames) return;
      const ratio = 1 - e.clientX / window.innerWidth;
      anim.goToAndStop(Math.round(ratio * (anim.totalFrames - 1)), true);
    };

    anim.addEventListener("data_failed", () => setFailed(true));

    anim.addEventListener("DOMLoaded", () => {
      anim.goToAndStop(anim.totalFrames - 1, true);
      setLoaded(true);
      window.addEventListener("mousemove", onMouseMove);
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      anim.destroy();
    };
  }, []);

  return (
    <>
      {(!loaded || failed) && (
        <Image
          src="/lottie/images/seq_0_0.png"
          alt=""
          width={2112}
          height={1188}
          priority
          unoptimized
          className="hero-video"
          style={{ objectFit: "contain" }}
        />
      )}
      {!failed && (
        <div
          ref={containerRef}
          className="hero-video"
          style={{ background: "transparent", display: loaded ? undefined : "none" }}
        />
      )}
    </>
  );
}
