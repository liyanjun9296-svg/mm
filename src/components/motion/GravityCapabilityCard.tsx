"use client";

import { useRef } from "react";

type GravityCapabilityCardProps = {
  children: React.ReactNode;
  className?: string;
};

function canAnimate() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
      .matches
  );
}

export default function GravityCapabilityCard({
  children,
  className,
}: GravityCapabilityCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !canAnimate()) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (py * 2 - 1) * -10;
    const ry = (px * 2 - 1) * 11;

    ref.current.style.setProperty("--cap-tilt-x", `${rx}deg`);
    ref.current.style.setProperty("--cap-tilt-y", `${ry}deg`);
    ref.current.style.setProperty("--cap-lift", "-6px");
    ref.current.style.setProperty("--cap-glow", "1");
  };

  const onLeave = () => {
    if (!ref.current) {
      return;
    }

    ref.current.style.setProperty("--cap-tilt-x", "0deg");
    ref.current.style.setProperty("--cap-tilt-y", "0deg");
    ref.current.style.setProperty("--cap-lift", "0px");
    ref.current.style.setProperty("--cap-glow", "0");
  };

  return (
    <div
      ref={ref}
      className={`cap-gravity-card ${className ?? ""}`.trim()}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
