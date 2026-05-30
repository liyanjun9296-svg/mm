"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
};

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="faq-accordion">
      <p className="mono-label">FAQ</p>
      <div className="faq-list">
        {items.map((item, index) => {
          const open = openSet.has(index);
          return (
            <div key={item.question} className="faq-item">
              <button
                type="button"
                className="faq-question"
                onClick={() => toggle(index)}
                aria-expanded={open}
              >
                <span>{item.question}</span>
                <span className="faq-icon">{open ? "−" : "+"}</span>
              </button>
              {open ? <p className="faq-answer">{item.answer}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
