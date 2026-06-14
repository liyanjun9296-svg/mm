"use client";

import { useEffect, useRef, useState } from "react";
import lottie, { type AnimationItem } from "lottie-web";

// 40×23px 模糊占位图（来自 seq_0_0.png），避免 263KB 网络请求
const PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAXCAYAAAB50g0VAAAEzUlEQVR42qWXXXfbPA6EZwYgbcdJ2v7/X7ltk1giAeyFZLfvRxpnl8c8Rxcy9WhmCFDEXYOQRElmkpt5N7MHd39s5s/u9uxmj252NMkoBApvWfVzxvw+xvzPOsbPdaxv6xhLbCOzqqrqj0/2e+BI4vojJZImqok6SDpJejDp0aSTSaIQAMisWaVLSE2iSZJIBkmSwAdwdwLeQDc+UqKapC7ZSbKzyZ7N7IuZPeyAgwUlc1bpYmKX5CS1o+0LokDiTyr6HVg7FylSlPwKZ9LZTM9m9s1kX016cJMorixYFkaVvWVmnzHddhW5WwJ+QPcxIPd51Y4mslFXa+3JZF9M+mamb2Z2NokSLgQQWw5/WKqb5NrisfHtK9f/a/HNWNBIGqUm6SjpLPFJ5BdRX0V9M/JsEmR4JTCYeMjt3ibJrhbvwb4rWP6RvZt6IEkj2UQeRJ5Inkk+kfxC8ivJr5uqLJNI4A3EwVJNom8vx2tiwDuT7x8KeIsfNnuJI4kTiUcCTwCeSTyJfCR5kilMChIHFHpkNk2ZSBH4peBtm/yPZWaXDXuUjaSTOBA4AjgTeATwtEM+UnyUqZtsmmsh2ZjRIsvNpkky/Yog7ozgHQqC2vKHRqCTOBE4A/UI1BOBJ5JnkSeTNXdfW7NOsmXKE/Ax3WUy/sqh7t0o/k5p3pTbL0kYASdxAHAE6gFVZ6DOAB5IPsjs4O7eekNzbxJbZrQC2piz+XD3rROZeFWSBFkE3q02dygIARAIB9CIOgJ12iZOJI4Su5m6N1dvPXtvbmKLjA6yj4jex+iLezMzM5MppMws/lYL6xOAvG3irSCIgBFouE6ik2gkm7b+rNaa+qHreDiYiZ4ZjVKfEX2M0Zc+2jqGj2kWCqWUVYUkN7h/UfEdwLoV6L+4vhtOUntfpqQys3T3bK2h956HwwFuYlUYJY8ZfYzR1nX0dV3bGMPmDFkmK5NFglX/2vY+04sBsEgWyaAUkoZMq5kt7m6tNfXex6H30dyyKkHQYk5fx9qWZfVDaz5a8znDImNmirnDfULBG1Nha+hJIvaDyCC1SHoz6cVkP83czWyaubn7bK299WZLVU6gcszB49Lt0psfevNldbltdSfI/O0A8Q8V/R2D90jwep0AJ8iV1JukF0k/ZHaSmWlT8yjRJYbERaYfLL6m2drdozWv7g435w63t5Yd7ob4OYsLYAFMAJPkQumV0g/JjtpGUHwDeQTgVciqGlX1CtR3Ei8kLyKHxJQI3Rr8LdbXeviPsuh/hruqhwlwALwAfCHZ9tNXALwU8L0qD5Hhc84ac4RUC4GXGfMlcv7MiktVDlTNqkrcTtP1y9JPZ3D/d22QA8AFgAEUiCpgVNVrZp7mjLaO4ctYYEJWxSBriTnf1nV9GWO8jDkvM+bIzMi8nvhrZ6vPW1woFJgoRBVmAWuhVChUIapyycyXGXFY53BfZSYSlTXDgsQaM9ZluSyXZXlbxnpZxxhjzpgbZf3tu6Q+r+AGmoWKPVvc1szIqjUyLnPONkRbRBOBQmCGpYiImHNZlnVZl3VdxzrGWEfMGRG/A1Zh86ruBawqEPuW36TM2vLDqkJm1W7VGhFtTmqIkjbACBWJjIgYyxrLOuau3pzbN11mZlbmu10EAP4LiJHnNoOL0kwAAAAASUVORK5CYII=";

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
    <div style={{ position: "relative" }} className="hero-video">
      {/* 模糊占位图：lottie 加载完后淡出，消除空白帧 */}
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PLACEHOLDER}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: loaded ? 0 : 1,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        />
      )}
      {/* lottie 容器：加载完后淡入 */}
      {!failed && (
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      )}
    </div>
  );
}
