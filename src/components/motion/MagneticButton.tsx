"use client";

import { useRef } from "react";

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  as?: "button" | "a";
  href?: string;
};

export default function MagneticButton({
  children,
  className,
  as = "button",
  href,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const canAnimate = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
      .matches;

  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!ref.current || !canAnimate()) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    ref.current.style.transform = `translate(${dx * 0.2}px, ${dy * 0.2}px) scale(1.04)`;
  };

  const handleLeave = () => {
    if (!ref.current) {
      return;
    }
    ref.current.style.transform = "translate(0, 0) scale(1)";
  };

  if (as === "a") {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={`btn magnetic ${className ?? ""}`.trim()}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={`btn magnetic ${className ?? ""}`.trim()}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </button>
  );
}

