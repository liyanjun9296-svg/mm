type MarqueeTextProps = {
  text: string;
  className?: string;
};

export default function MarqueeText({ text, className }: MarqueeTextProps) {
  return (
    <div className={`h1-marquee-wrap ${className ?? ""}`.trim()} aria-label={text}>
      <div className="h1-marquee-track">
        <span>{text}</span>
        <span aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}

