import RevealOnScroll from "@/components/motion/RevealOnScroll";

type SectionHeaderProps = {
  index: string;
  title: string;
  right?: React.ReactNode;
};

export default function SectionHeader({ index, title, right }: SectionHeaderProps) {
  return (
    <>
      <RevealOnScroll className="section-header">
        <div className="section-header-left">
          <span className="section-header-index">{index}</span>
          <h2 className="section-header-title">{title}</h2>
        </div>
        {right ?? <span className="section-header-line" aria-hidden="true" />}
      </RevealOnScroll>
      <div className="section-divider" />
    </>
  );
}
