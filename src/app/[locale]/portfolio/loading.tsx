export default function PortfolioLoading({ bare }: { bare?: boolean }) {
  const content = (
    <div style={{ paddingTop: bare ? 0 : 80 }}>
      {/* tabs skeleton */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        {[80, 64, 96, 72].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 36 }} />
        ))}
      </div>
      {/* grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: "16/10" }} />
        ))}
      </div>
    </div>
  );

  if (bare) return content;

  return (
    <main className="portfolio-hub-page">
      <div className="container">{content}</div>
    </main>
  );
}
