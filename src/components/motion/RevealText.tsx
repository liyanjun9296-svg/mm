"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType } from "react";

type RevealTextProps = {
  text: string;
  as?: ElementType;
  stagger?: number;
  delay?: number;
  className?: string;
};

export default function RevealText({
  text,
  as: Tag = "span",
  stagger = 60,
  delay = 0,
  className,
}: RevealTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const isCJK = /[\u4e00-\u9fff]/.test(text);
  const tokens = isCJK ? Array.from(text) : text.split(" ");

  return (
    <Tag
      ref={ref as never}
      className={`reveal-text ${visible ? "is-in" : ""}${className ? ` ${className}` : ""}`}
    >
      {tokens.map((token, i) => (
        <span className="reveal-mask" key={`${token}-${i}`}>
          <span
            className="reveal-inner"
            style={{ "--reveal-delay": `${delay + i * stagger}ms` } as CSSProperties}
          >
            {token}
          </span>
          {!isCJK && i < tokens.length - 1 ? "\u00A0" : null}
        </span>
      ))}
    </Tag>
  );
}
