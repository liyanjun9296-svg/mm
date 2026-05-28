"use client";

import { useRef } from "react";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const canAnimate = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
      .matches;

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !canAnimate()) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (py * 2 - 1) * -10;
    const ry = (px * 2 - 1) * 12;

    ref.current.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    ref.current.style.boxShadow = "0 24px 48px rgba(0,0,0,0.5)";
  };

  const onLeave = () => {
    if (!ref.current) {
      return;
    }

    ref.current.style.transform = "perspective(700px) rotateX(0) rotateY(0) translateY(0)";
    ref.current.style.boxShadow = "none";
  };

  return (
    <div ref={ref} className={`tilt ${className ?? ""}`.trim()} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

